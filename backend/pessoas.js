const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

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

// Criar nova pessoa
router.post('/', verificarToken, async (req, res) => {
    const { 
        nome_completo, endereco, cpf, titulo_eleitor, zona, sessao, 
        foto_url, coordenadas, link_maps, cep, latitude, longitude 
    } = req.body;
    
    const user_id = req.usuarioId;

    if (!nome_completo || !endereco || !cpf) {
        return res.status(400).json({ error: 'Nome, endereço e CPF são obrigatórios' });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO pessoas (user_id, nome_completo, endereco, cpf, titulo_eleitor, zona, sessao, foto_url, coordenadas, link_maps, cep, latitude, longitude) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id, 
                nome_completo, 
                endereco, 
                cpf, 
                titulo_eleitor || null, 
                zona || null, 
                sessao || null, 
                foto_url || null, 
                coordenadas || null, 
                link_maps || null, 
                cep || null, 
                latitude || null, 
                longitude || null
            ]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Pessoa cadastrada com sucesso',
            id: result.insertId 
        });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'CPF já cadastrado' });
        }
        res.status(500).json({ error: 'Erro ao cadastrar pessoa: ' + error.message });
    }
});

// Listar apenas o perfil do usuário logado (para foto e dados pessoais)
router.get('/minha-rede', verificarToken, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM pessoas WHERE user_id = ? ORDER BY created_at DESC',
            [req.usuarioId]
        );

        res.json({ success: true, pessoas: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar pessoas' });
    }
});

// Nova rota para listar TODOS os contatos da rede (para Minha Rede)
router.get('/todos-contatos', verificarToken, async (req, res) => {
    try {
        // Se for master (user_id=2), retorna todos os usuários
        if (req.usuarioId === 2) {
            const [rows] = await pool.query(
                'SELECT p.*, u.username FROM pessoas p JOIN users u ON p.user_id = u.id ORDER BY p.user_id, p.created_at DESC'
            );
            return res.json({ success: true, pessoas: rows });
        }
        
        // Para outros usuários, retorna apenas os seus contatos
        const [rows] = await pool.query(
            'SELECT * FROM pessoas WHERE user_id = ? ORDER BY created_at DESC',
            [req.usuarioId]
        );
        res.json({ success: true, pessoas: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar contatos' });
    }
});

// Atualizar pessoa (EDITAR)
router.put('/:id', verificarToken, async (req, res) => {
    const { 
        nome_completo, endereco, cpf, titulo_eleitor, zona, sessao, 
        foto_url, coordenadas, link_maps, cep, latitude, longitude 
    } = req.body;
    const pessoaId = req.params.id;
    const usuarioId = req.usuarioId;

    if (!nome_completo || !endereco || !cpf) {
        return res.status(400).json({ error: 'Nome, endereço e CPF são obrigatórios' });
    }

    try {
        // Verificar se a pessoa pertence ao usuário logado
        const [check] = await pool.query(
            'SELECT id FROM pessoas WHERE id = ? AND user_id = ?',
            [pessoaId, usuarioId]
        );

        if (check.length === 0) {
            return res.status(404).json({ error: 'Pessoa não encontrada ou não pertence a você' });
        }

        const [result] = await pool.query(
            `UPDATE pessoas SET 
                nome_completo = ?, 
                endereco = ?, 
                cpf = ?, 
                titulo_eleitor = ?, 
                zona = ?, 
                sessao = ?, 
                foto_url = ?, 
                coordenadas = ?, 
                link_maps = ?, 
                cep = ?, 
                latitude = ?, 
                longitude = ?,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?`,
            [
                nome_completo, 
                endereco, 
                cpf, 
                titulo_eleitor || null, 
                zona || null, 
                sessao || null, 
                foto_url || null, 
                coordenadas || null, 
                link_maps || null, 
                cep || null, 
                latitude || null, 
                longitude || null,
                pessoaId,
                usuarioId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pessoa não encontrada' });
        }

        res.json({ 
            success: true, 
            message: 'Pessoa atualizada com sucesso' 
        });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'CPF já cadastrado para outra pessoa' });
        }
        res.status(500).json({ error: 'Erro ao atualizar pessoa: ' + error.message });
    }
});

// Deletar pessoa
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM pessoas WHERE id = ? AND user_id = ?',
            [req.params.id, req.usuarioId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pessoa não encontrada' });
        }

        res.json({ success: true, message: 'Pessoa removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar pessoa' });
    }
});

// Rota de estatísticas para Dashboard
router.get('/estatisticas', verificarToken, async (req, res) => {
    try {
        const usuarioId = req.usuarioId;
        
        // Buscar todas as pessoas do usuário (ou todos se for master)
        let queryPessoas = '';
        let params = [];
        
        if (usuarioId === 2) {
            // Master vê todos os usuários
            queryPessoas = 'SELECT * FROM pessoas WHERE nome_completo != "Administrador" AND nome_completo != "Boss Master"';
        } else {
            // Usuário comum vê apenas seus contatos
            queryPessoas = 'SELECT * FROM pessoas WHERE user_id = ? AND nome_completo != "Administrador"';
            params = [usuarioId];
        }
        
        const [pessoas] = await pool.query(queryPessoas, params);
        
        // Total de contatos
        const totalContatos = pessoas.length;
        
        // Extrair cidade e estado do endereço
        const cidadesMap = new Map();
        const bairrosMap = new Map();
        const estadosMap = new Map();
        
        pessoas.forEach(pessoa => {
            if (pessoa.endereco) {
                const partes = pessoa.endereco.split(',').map(p => p.trim());
                const bairro = partes[2] || 'Não informado';
                const cidade = partes[3] || 'Não informado';
                const estado = partes[4] || 'Não informado';
                
                if (cidade !== 'Não informado') {
                    cidadesMap.set(cidade, (cidadesMap.get(cidade) || 0) + 1);
                }
                if (bairro !== 'Não informado') {
                    bairrosMap.set(bairro, (bairrosMap.get(bairro) || 0) + 1);
                }
                if (estado !== 'Não informado') {
                    estadosMap.set(estado, (estadosMap.get(estado) || 0) + 1);
                }
            }
        });
        
        // Converter para arrays ordenados
        const topCidades = Array.from(cidadesMap.entries())
            .map(([cidade, total]) => ({ cidade, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
        
        const topBairros = Array.from(bairrosMap.entries())
            .map(([bairro, total]) => ({ bairro, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
        
        const contatosPorEstado = Array.from(estadosMap.entries())
            .map(([estado, total]) => ({ estado, total }))
            .sort((a, b) => b.total - a.total);
        
        res.json({
            totalContatos,
            totalCidades: cidadesMap.size,
            totalBairros: bairrosMap.size,
            contatosPorEstado,
            topCidades,
            topBairros
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});
module.exports = router;
