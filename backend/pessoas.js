const express = require('express');
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

// Criar nova pessoa
router.post('/', verificarToken, async (req, res) => {
    const { 
        nome_completo, endereco, cpf, titulo_eleitor, zona, sessao, 
        foto_url, coordenadas, link_maps, cep, latitude, longitude,
        endereco_votacao, local_votacao, bairro_votacao, municipio_votacao
    } = req.body;
    
    const user_id = req.usuarioId;

    if (!nome_completo || !endereco || !cpf) {
        return res.status(400).json({ error: 'Nome, endereço e CPF são obrigatórios' });
    }

    try {
        const { data, error } = await supabase
            .from('pessoas')
            .insert([{
                user_id,
                nome_completo,
                endereco,
                cpf,
                titulo_eleitor: titulo_eleitor || null,
                zona: zona || null,
                sessao: sessao || null,
                foto_url: foto_url || null,
                coordenadas: coordenadas || null,
                link_maps: link_maps || null,
                cep: cep || null,
                latitude: latitude || null,
                longitude: longitude || null,
                endereco_votacao: endereco_votacao || null,
                local_votacao: local_votacao || null,
                bairro_votacao: bairro_votacao || null,
                municipio_votacao: municipio_votacao || null
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ error: 'CPF já cadastrado' });
            }
            throw error;
        }

        res.status(201).json({
            success: true,
            message: 'Pessoa cadastrada com sucesso',
            id: data.id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao cadastrar pessoa: ' + error.message });
    }
});

// Listar perfil do usuário logado
router.get('/minha-rede', verificarToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('pessoas')
            .select('*')
            .eq('user_id', req.usuarioId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, pessoas: data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar pessoas' });
    }
});

// Listar TODOS os contatos
router.get('/todos-contatos', verificarToken, async (req, res) => {
    try {
        let query = supabase
            .from('pessoas')
            .select('*, users(username)');

        if (req.usuarioId === 2) {
            // Master vê todos
        } else {
            query = query.eq('user_id', req.usuarioId);
        }

        const { data, error } = await query.order('user_id').order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, pessoas: data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar contatos' });
    }
});

// Atualizar pessoa
router.put('/:id', verificarToken, async (req, res) => {
    const { 
        nome_completo, endereco, cpf, titulo_eleitor, zona, sessao, 
        foto_url, coordenadas, link_maps, cep, latitude, longitude,
        endereco_votacao, local_votacao, bairro_votacao, municipio_votacao
    } = req.body;
    const pessoaId = req.params.id;
    const usuarioId = req.usuarioId;

    if (!nome_completo || !endereco || !cpf) {
        return res.status(400).json({ error: 'Nome, endereço e CPF são obrigatórios' });
    }

    try {
        const { data: check, error: checkError } = await supabase
            .from('pessoas')
            .select('id')
            .eq('id', pessoaId)
            .eq('user_id', usuarioId)
            .single();

        if (checkError || !check) {
            return res.status(404).json({ error: 'Pessoa não encontrada ou não pertence a você' });
        }

        const { error: updateError } = await supabase
            .from('pessoas')
            .update({
                nome_completo,
                endereco,
                cpf,
                titulo_eleitor: titulo_eleitor || null,
                zona: zona || null,
                sessao: sessao || null,
                foto_url: foto_url || null,
                coordenadas: coordenadas || null,
                link_maps: link_maps || null,
                cep: cep || null,
                latitude: latitude || null,
                longitude: longitude || null,
                endereco_votacao: endereco_votacao || null,
                local_votacao: local_votacao || null,
                bairro_votacao: bairro_votacao || null,
                municipio_votacao: municipio_votacao || null,
                updated_at: new Date()
            })
            .eq('id', pessoaId)
            .eq('user_id', usuarioId);

        if (updateError) {
            if (updateError.code === '23505') {
                return res.status(400).json({ error: 'CPF já cadastrado para outra pessoa' });
            }
            throw updateError;
        }

        res.json({
            success: true,
            message: 'Pessoa atualizada com sucesso'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar pessoa: ' + error.message });
    }
});

// Deletar pessoa
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('pessoas')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.usuarioId);

        if (error) throw error;

        res.json({ success: true, message: 'Pessoa removida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao deletar pessoa' });
    }
});

// Estatísticas para Dashboard
router.get('/estatisticas', verificarToken, async (req, res) => {
    try {
        const usuarioId = req.usuarioId;
        
        let query = supabase.from('pessoas').select('*');
        
        if (usuarioId !== 2) {
            query = query.eq('user_id', usuarioId);
        }

        const { data: pessoas, error } = await query;

        if (error) throw error;

        const filtered = pessoas.filter(p => 
            p.nome_completo !== 'Administrador' && 
            p.nome_completo !== 'Boss Master'
        );

        const totalContatos = filtered.length;
        
        const cidadesMap = new Map();
        const bairrosMap = new Map();
        const estadosMap = new Map();
        
        filtered.forEach(pessoa => {
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
