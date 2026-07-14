const express = require('express');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const router = express.Router();
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

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
        expiresAt.setDate(expiresAt.getDate() + 7); // Expira em 7 dias

        await pool.query(
            `INSERT INTO convites (convite_id, nome_convidado, email, convidado_por, expires_at) 
             VALUES (?, ?, ?, ?, ?)`,
            [conviteId, nome_convidado, contato, req.usuarioId, expiresAt]
        );

        const linkConvite = `http://localhost:3000/cadastro-convite/${conviteId}`;
        
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
        const [convites] = await pool.query(
            `SELECT * FROM convites 
             WHERE convite_id = ? AND status = 'pendente' AND expires_at > NOW()`,
            [conviteId]
        );

        if (convites.length === 0) {
            return res.status(400).json({ error: 'Convite inválido ou expirado' });
        }

        res.json({
            success: true,
            convite: convites[0]
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
        // Verificar convite
        const [convites] = await pool.query(
            `SELECT * FROM convites 
             WHERE convite_id = ? AND status = 'pendente' AND expires_at > NOW()`,
            [conviteId]
        );

        if (convites.length === 0) {
            return res.status(400).json({ error: 'Convite inválido ou expirado' });
        }

        const convite = convites[0];

        // Verificar se usuário já existe
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Usuário já existe' });
        }

        // Criptografar senha
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir usuário
        const [result] = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            [username, hashedPassword]
        );

        const userId = result.insertId;

        // Inserir dados da pessoa
        if (nome_completo) {
            await pool.query(
                `INSERT INTO pessoas (user_id, nome_completo, endereco, cpf, titulo_eleitor, zona, sessao, convidado_por) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, nome_completo, endereco, cpf, titulo_eleitor, zona, sessao, convite.convidado_por]
            );
        }

        // Atualizar status do convite
        await pool.query(
            'UPDATE convites SET status = "aceito" WHERE id = ?',
            [convite.id]
        );

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