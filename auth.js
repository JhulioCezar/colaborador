const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const router = express.Router();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cadastro_pessoas',
    waitForConnections: true,
    connectionLimit: 10
});

// Rota de teste da auth
router.get('/teste', (req, res) => {
    res.json({ mensagem: 'Auth funcionando!' });
});

// Rota de registro (criar conta)
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    console.log('Recebido registro:', { username, password });

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    try {
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Usuário já existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, hashedPassword]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Usuário criado com sucesso',
            userId: result.insertId 
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro ao criar usuário: ' + error.message });
    }
});

// Rota de login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    console.log('Recebido login:', { username, password });

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        
        console.log('Usuário encontrado:', users);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Usuário ou senha inválidos' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        console.log('Senha válida:', validPassword);

        if (!validPassword) {
            return res.status(401).json({ error: 'Usuário ou senha inválidos' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || 'meu_segredo_super_secreto_123',
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
        const [pessoas] = await pool.query(
            'SELECT user_id FROM pessoas WHERE id = ?',
            [req.params.pessoaId]
        );
        
        if (pessoas.length === 0) {
            return res.status(404).json({ error: 'Pessoa não encontrada' });
        }
        
        const [users] = await pool.query(
            'SELECT id, username FROM users WHERE id = ?',
            [pessoas[0].user_id]
        );
        
        res.json({ username: users[0].username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

// Atualizar usuário (username e senha)
router.put('/usuario/:pessoaId', verificarToken, async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const [pessoas] = await pool.query(
            'SELECT user_id FROM pessoas WHERE id = ?',
            [req.params.pessoaId]
        );
        
        if (pessoas.length === 0) {
            return res.status(404).json({ error: 'Pessoa não encontrada' });
        }
        
        const userId = pessoas[0].user_id;
        
        // Verificar se o usuário logado tem permissão (é master ou é o próprio)
        if (req.usuarioId !== 2 && req.usuarioId !== userId) {
            return res.status(403).json({ error: 'Permissão negada' });
        }
        
        // Atualizar username
        if (username) {
            await pool.query(
                'UPDATE users SET username = ? WHERE id = ?',
                [username, userId]
            );
        }
        
        // Atualizar senha
        if (password) {
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE users SET password_hash = ? WHERE id = ?',
                [hashedPassword, userId]
            );
        }
        
        res.json({ success: true, message: 'Usuário atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Nome de usuário já existe' });
        }
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

module.exports = router;