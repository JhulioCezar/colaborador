import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import './Layout.css';

function Layout({ children, titulo }) {
  const [menuAberto, setMenuAberto] = useState(true);
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [userName, setUserName] = useState('');
  const [pessoaId, setPessoaId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserName(user?.username || 'Usuário');
    carregarDadosPerfil();
  }, []);

  const carregarDadosPerfil = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const usuarioId = user?.id;
      
      const response = await api.get('/pessoas/minha-rede', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.pessoas && response.data.pessoas.length > 0) {
        let meuPerfil = response.data.pessoas.find(p => 
          p.user_id === usuarioId && 
          (p.nome_completo === 'Boss Master' || p.nome_completo === 'Administrador')
        );
        
        if (!meuPerfil) {
          meuPerfil = response.data.pessoas.find(p => p.user_id === usuarioId);
        }
        
        if (meuPerfil) {
          setPessoaId(meuPerfil.id);
          setUserName(meuPerfil.nome_completo);
          if (meuPerfil.foto_url) {
            setFotoPerfil(meuPerfil.foto_url);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const menuItems = [
    { label: 'Dashboard', rota: '/dashboard' },
    { label: 'Alterar Credenciais', rota: '/alterar-credenciais' },
    { label: 'Minha Rede', rota: '/minha-rede' },
    { label: 'Ver no Mapa', rota: '/mapa' },
    { label: 'Cadastrar Pessoa', rota: '/cadastro-pessoa' },
    { label: 'Convidar', rota: '/convidar' },
    { label: 'Mapa Eleitoral', rota: '/mapa-eleitoral' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNavigate = (rota) => {
    navigate(rota);
  };

  const handleEditarPerfil = () => {
    if (pessoaId) {
      navigate(`/editar-perfil/${pessoaId}`);
    } else {
      alert('Carregando dados do perfil, tente novamente');
    }
  };

  const isActive = (rota) => location.pathname === rota;

  return (
    <div className="layout-container">
      <div className={`menu-lateral ${menuAberto ? 'aberto' : 'fechado'}`}>
        <div className="menu-perfil">
          <div className="perfil-foto" onClick={handleEditarPerfil}>
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="Perfil" />
            ) : (
              <div className="perfil-placeholder">👤</div>
            )}
          </div>
          {menuAberto && (
            <>
              <div className="perfil-nome">{userName}</div>
              <button className="perfil-editar" onClick={handleEditarPerfil}>
                Editar perfil
              </button>
            </>
          )}
        </div>

        <div className="menu-divider"></div>
        
        <nav className="menu-nav">
          {menuItems.map((item, index) => (
            <div 
              key={index}
              className={`menu-item ${isActive(item.rota) ? 'ativo' : ''}`}
              onClick={() => handleNavigate(item.rota)}
            >
              <span className="menu-label">{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="menu-footer">
          <div className="menu-item" onClick={handleLogout}>
            <span className="menu-label">Sair</span>
          </div>
        </div>
      </div>

      <div className={`conteudo-principal ${menuAberto ? 'com-menu' : 'sem-menu'}`}>
        <header className="header-topo">
          <button 
            className="btn-toggle-menu"
            onClick={() => setMenuAberto(!menuAberto)}
          >
            {menuAberto ? '◀' : '▶'}
          </button>
          
          <div className="header-saudacao">
            <div>
              <h1>{titulo}</h1>
            </div>
          </div>
          
          <div className="header-acoes">
            <button className="btn-logout" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>

        <footer className="footer-rodape">
          <p>Sistema de Cadastro de Pessoas | Versão 1.0</p>
        </footer>
      </div>
    </div>
  );
}

export default Layout;
