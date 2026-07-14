import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Usuario.css';

function Usuario() {
  const [fotoPreview, setFotoPreview] = useState('');
  const [userName, setUserName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [totalContatos, setTotalContatos] = useState(0);
  const [saudacao, setSaudacao] = useState('');
  const [dataAtual, setDataAtual] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setUserName(userData.username);
    }
    carregarFotoPerfil();
    carregarEstatisticas();
    definirSaudacao();
  }, []);

  const definirSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) setSaudacao('Bom dia');
    else if (hora < 18) setSaudacao('Boa tarde');
    else setSaudacao('Boa noite');
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setDataAtual(new Date().toLocaleDateString('pt-BR', options));
  };

 const carregarFotoPerfil = async () => {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        const usuarioId = user?.id;
        
        const response = await api.get('/pessoas/minha-rede', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.pessoas && response.data.pessoas.length > 0) {
            // Buscar a pessoa que tem o user_id igual ao ID do usuário logado
            // E que seja o perfil principal (Boss Master para master, Administrador para admin)
            const meuPerfil = response.data.pessoas.find(p => 
                p.user_id === usuarioId && 
                (p.nome_completo === 'Boss Master' || p.nome_completo === 'Administrador')
            );
            
            // Se não encontrar pelo nome, pega a primeira que tenha user_id igual
            const perfilFinal = meuPerfil || response.data.pessoas.find(p => p.user_id === usuarioId);
            
            if (perfilFinal && perfilFinal.foto_url) {
                setFotoPreview(perfilFinal.foto_url);
            } else {
                setFotoPreview('');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar foto do perfil:', error);
    }
};

  const carregarEstatisticas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/pessoas/minha-rede', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const contatos = response.data.pessoas.filter(p => p.nome_completo !== 'Administrador');
      setTotalContatos(contatos.length);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleFotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens (jpg, png, gif)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('foto', file);

    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/upload/foto-perfil', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setFotoPreview(response.data.foto_url);
        alert('Foto do perfil atualizada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleSair = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="usuario-container">
      <div className="usuario-card">
        
        <div className="cabecalho">
  <div className="saudacao">
    <div>
      <h1>{saudacao}, {userName}!</h1>
      <p className="data-atual">{dataAtual}</p>
    </div>
  </div>
</div>

        <div className="foto-perfil-container">
          <div className="foto-perfil" onClick={() => document.getElementById('foto-input').click()}>
            {fotoPreview ? (
              <img src={fotoPreview} alt="Foto do usuário" />
            ) : (
              <div className="foto-placeholder">Foto</div>
            )}
          </div>
          <button 
            className="btn-alterar-foto" 
            onClick={() => document.getElementById('foto-input').click()}
            disabled={uploading}
          >
            {uploading ? 'Enviando...' : 'Alterar foto'}
          </button>
          <input
            type="file"
            accept="image/*"
            onChange={handleFotoUpload}
            id="foto-input"
            style={{ display: 'none' }}
          />
        </div>

        <div className="estatisticas">
          <div className="estatistica-card">
            <span className="estatistica-icon">👥</span>
            <div>
              <span className="estatistica-valor">{totalContatos}</span>
              <span className="estatistica-label">contatos na rede</span>
            </div>
          </div>
        </div>

        <div className="grid-botoes">
          <button className="botao-grid" onClick={() => navigate('/cadastro-pessoa')}>
            <span className="botao-icon">👤</span>
            <div>
              <strong>Cadastrar</strong>
              <small>Novo usuário</small>
            </div>
          </button>
          
          <button className="botao-grid" onClick={() => navigate('/convidar')}>
            <span className="botao-icon">💬</span>
            <div>
              <strong>Convidar</strong>
              <small>Via WhatsApp</small>
            </div>
          </button>
          
          <button className="botao-grid" onClick={() => navigate('/minha-rede')}>
            <span className="botao-icon">👥</span>
            <div>
              <strong>Minha Rede</strong>
              <small>{totalContatos} contatos</small>
            </div>
          </button>
          
          <button className="botao-grid" onClick={() => navigate('/mapa')}>
            <span className="botao-icon">🗺️</span>
            <div>
              <strong>Ver no Mapa</strong>
              <small>Localização</small>
            </div>
          </button>
        </div>

        <button className="btn-sair" onClick={handleSair}>
          <span className="sair-icon">🚪</span>
          Sair do sistema
        </button>

        <div className="rodape">
          <p>Sistema de Cadastro de Pessoas | Versão 1.0</p>
        </div>
      </div>
    </div>
  );
}

export default Usuario;
