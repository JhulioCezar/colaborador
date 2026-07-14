const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const router = express.Router();

// Configurar armazenamento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Apenas imagens são permitidas'));
        }
    }
});

// Middleware para verificar token
const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'meu_segredo_super_secreto_123');
        req.usuarioId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// Upload de foto do perfil do usuário logado (admin)
router.post('/foto-perfil', verificarToken, upload.single('foto'), async (req, res) => {
    console.log('=== UPLOAD FOTO PERFIL ===');
    console.log('Usuário ID:', req.usuarioId);
    console.log('Arquivo recebido:', req.file);
    
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const fotoUrl = `http://localhost:3001/uploads/${req.file.filename}`;
    console.log('Foto salva em:', fotoUrl);
    
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cadastro_pessoas',
        waitForConnections: true,
        connectionLimit: 10
    });

    try {
        // Buscar a pessoa que tem o mesmo nome_completo = 'Administrador' ou a mais antiga do usuário
        const [pessoas] = await pool.query(
            'SELECT id FROM pessoas WHERE user_id = ? AND nome_completo = "Administrador" LIMIT 1',
            [req.usuarioId]
        );
        
        let pessoaId;
        if (pessoas.length > 0) {
            pessoaId = pessoas[0].id;
            console.log('Encontrado perfil Administrador, ID:', pessoaId);
        } else {
            // Se não encontrar, cria um novo perfil para o admin
            const [result] = await pool.query(
                'INSERT INTO pessoas (user_id, nome_completo, endereco, cpf) VALUES (?, "Administrador", "Sistema", "000.000.000-00")',
                [req.usuarioId]
            );
            pessoaId = result.insertId;
            console.log('Criado novo perfil Administrador, ID:', pessoaId);
        }

        await pool.query(
            'UPDATE pessoas SET foto_url = ? WHERE id = ?',
            [fotoUrl, pessoaId]
        );
        console.log('Foto do perfil atualizada para pessoa ID:', pessoaId);

        res.json({ success: true, foto_url: fotoUrl });
    } catch (error) {
        console.error('Erro ao salvar foto do perfil:', error);
        res.status(500).json({ error: 'Erro ao salvar foto' });
    } finally {
        await pool.end();
    }
});

// Upload de foto de pessoa (NÃO altera a foto do admin)
router.post('/foto-pessoa', verificarToken, upload.single('foto'), async (req, res) => {
    console.log('=== UPLOAD FOTO PESSOA ===');
    console.log('Usuário ID:', req.usuarioId);
    console.log('Arquivo recebido:', req.file);
    
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const fotoUrl = `http://localhost:3001/uploads/${req.file.filename}`;
    console.log('Foto salva em:', fotoUrl);
    
    res.json({ success: true, foto_url: fotoUrl });
});

// Rota de teste
router.get('/teste', (req, res) => {
    res.json({ mensagem: 'Upload funcionando!' });
});

module.exports = router;
