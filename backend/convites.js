const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware para verificar token
const verificarToken = (req, res, next) => {
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
};

// Criar convite
router.post('/criar', verificarToken, async (req, res) => {
    const { nome_convidado, contato } = req.body;
    
    if (!nome_convidado || !contato) {
        return res.status(400).json({ error: 'Nome e contato (telefone) são obrigatórios' });
    }

    try {
        const conviteId = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const { data, error } = await supabase
            .from('convites')
            .insert([{
                convite_id: conviteId,
                nome_convidado,
                email: contato,
                convidado_por: req.usuarioId,
                expires_at: expiresAt.toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        const linkConvite = `${process.env.BASE_URL || 'http://localhost:3000'}/cadastro-convite/${conviteId}`;
        
        res.json({
            success: true,
            link: linkConvite,
            convidado: nome_convidado,
            contato: contato,
            mensagem: `Convidado ${nome_convidado} (${contato}) receberá o link: ${linkConvite}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar convite' });
    }
});

// Verificar convite
router.get('/verificar/:conviteId', async (req, res) => {
    const { conviteId } = req.params;

    try {
        const { data, error } = await supabase
            .from('convites')
            .select('*')
            .eq('convite_id', conviteId)
            .eq('status', 'pendente')
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error || !data) {
            return res.status(400).json({ error: 'Convite inválido ou expirado' });
        }

        res.json({
            success: true,
            convite: data
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao verificar convite' });
    }
});

// Registrar via convite
router.post('/registrar', async (req, res) => {
    const { conviteId, username, password, nome_completo, endereco, cpf, titulo_eleitor, zona, sessao } = req.body;

    if (!conviteId || !username || !password) {
        return res.status(400).json({ error: 'Convite, usuário e senha são obrigatórios' });
    }

    try {
        const { data: convite, error: conviteError } = await supabase
            .from('convites')
            .select('*')
            .eq('convite_id', conviteId)
            .eq('status', 'pendente')
            .gt('expires_at', new Date().toISOString())
            .single();

        if (conviteError || !convite) {
            return res.status(400).json({ error: 'Convite inválido ou expirado' });
        }

        const { data: existing, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Usuário já existe' });
        }

        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert([{ username, password_hash: hashedPassword }])
            .select()
            .single();

        if (userError) throw userError;

        const userId = newUser.id;

        if (nome_completo) {
            const { error: pessoaError } = await supabase
                .from('pessoas')
                .insert([{
                    user_id: userId,
                    nome_completo,
                    endereco,
                    cpf,
                    titulo_eleitor: titulo_eleitor || null,
                    zona: zona || null,
                    sessao: sessao || null,
                    convidado_por: convite.convidado_por
                }]);

            if (pessoaError) throw pessoaError;
        }

        await supabase
            .from('convites')
            .update({ status: 'aceito' })
            .eq('id', convite.id);

        res.status(201).json({
            success: true,
            message: 'Cadastro realizado com sucesso!',
            userId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao cadastrar' });
    }
});

module.exports = router;
