const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Inicializar Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rota de teste
router.get('/teste', (req, res) => {
    res.json({ mensagem: 'Auth funcionando!' });
});

// Rota de registro
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    try {
        // Verificar se usuário já existe
        const { data: existing, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Usuário já existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{ username, password_hash: hashedPassword }])
            .select()
            .single();

        if (insertError) throw insertError;

        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            userId: newUser.id
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro ao criar usuário: ' + error.message });
    }
});

// Rota de login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    try {
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (findError || !user) {
            return res.status(401).json({ error: 'Usuário ou senha inválidos' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Usuário ou senha inválidos' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: { id: user.id, username: user.username }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login: ' + error.message });
    }
});

// Buscar dados do usuário por ID da pessoa
router.get('/usuario/:pessoaId', verificarToken, async (req, res) => {
    try {
        const { data: pessoa, error: pessoaError } = await supabase
            .from('pessoas')
            .select('user_id')
            .eq('id', req.params.pessoaId)
            .single();

        if (pessoaError || !pessoa) {
            return res.status(404).json({ error: 'Pessoa não encontrada' });
        }

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, username')
            .eq('id', pessoa.user_id)
            .single();

        if (userError) throw userError;

        res.json({ username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

// Atualizar usuário
router.put('/usuario/:pessoaId', verificarToken, async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const { data: pessoa, error: pessoaError } = await supabase
            .from('pessoas')
            .select('user_id')
            .eq('id', req.params.pessoaId)
            .single();

        if (pessoaError || !pessoa) {
            return res.status(404).json({ error: 'Pessoa não encontrada' });
        }

        const userId = pessoa.user_id;

        if (req.usuarioId !== 2 && req.usuarioId !== userId) {
            return res.status(403).json({ error: 'Permissão negada' });
        }

        const updates = {};
        if (username) updates.username = username;
        if (password) {
            updates.password_hash = await bcrypt.hash(password, 10);
        }

        const { error: updateError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId);

        if (updateError) {
            if (updateError.code === '23505') {
                return res.status(400).json({ error: 'Nome de usuário já existe' });
            }
            throw updateError;
        }

        res.json({ success: true, message: 'Usuário atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

// Middleware para verificar token
function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuarioId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

module.exports = router;
