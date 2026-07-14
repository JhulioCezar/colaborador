const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuarioId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// Upload de foto do perfil
router.post('/foto-perfil', verificarToken, upload.single('foto'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const fotoUrl = `${process.env.BASE_URL || 'http://localhost:3001'}/uploads/${req.file.filename}`;

    try {
        const { data: pessoa, error: findError } = await supabase
            .from('pessoas')
            .select('id')
            .eq('user_id', req.usuarioId)
            .eq('nome_completo', 'Administrador')
            .single();

        let pessoaId;
        if (pessoa) {
            pessoaId = pessoa.id;
        } else {
            const { data: newPessoa, error: insertError } = await supabase
                .from('pessoas')
                .insert([{
                    user_id: req.usuarioId,
                    nome_completo: 'Administrador',
                    endereco: 'Sistema',
                    cpf: '000.000.000-00'
                }])
                .select()
                .single();

            if (insertError) throw insertError;
            pessoaId = newPessoa.id;
        }

        const { error: updateError } = await supabase
            .from('pessoas')
            .update({ foto_url: fotoUrl })
            .eq('id', pessoaId);

        if (updateError) throw updateError;

        res.json({ success: true, foto_url: fotoUrl });
    } catch (error) {
        console.error('Erro ao salvar foto do perfil:', error);
        res.status(500).json({ error: 'Erro ao salvar foto' });
    }
});

// Upload de foto de pessoa
router.post('/foto-pessoa', verificarToken, upload.single('foto'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const fotoUrl = `${process.env.BASE_URL || 'http://localhost:3001'}/uploads/${req.file.filename}`;
    
    res.json({ success: true, foto_url: fotoUrl });
});

// Rota de teste
router.get('/teste', (req, res) => {
    res.json({ mensagem: 'Upload funcionando!' });
});

module.exports = router;
