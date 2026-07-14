import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import './AlterarCredenciais.css';

function AlterarCredenciais() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({ id: null, nome: '' });

  useEffect(() => {
    carregarDadosUsuario();
  }, []);

  const carregarDadosUsuario = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      const usuarioId = user?.id;
      
      const response = await api.get('/pessoas/minha-rede', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let meuPerfil = response.data.pessoas.find(p => 
        p.user_id === usuarioId && 
        (p.nome_completo === 'Boss Master' || p.nome_completo === 'Administrador')
      );
      
      if (!meuPerfil) {
        meuPerfil = response.data.pessoas.find(p => p.user_id === usuarioId);
      }
      
      if (meuPerfil) {
        setUserInfo({
          id: meuPerfil.id,
          nome: meuPerfil.nome_completo
        });
        
        const userResponse = await api.get(`/auth/usuario/${meuPerfil.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFormData(prev => ({
          ...prev,
          username: userResponse.data.username
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados do usuário');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não conferem');
      setLoading(false);
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      setLoading(false);
      return;
    }

    if (formData.username && formData.username.length < 3) {
      setError('O usuário deve ter no mínimo 3 caracteres');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const updateData = {};
      if (formData.username && formData.username !== '') {
        updateData.username = formData.username;
      }
      if (formData.newPassword && formData.newPassword !== '') {
        updateData.password = formData.newPassword;
      }
      
      if (Object.keys(updateData).length === 0) {
        setError('Nenhuma alteração foi feita');
        setLoading(false);
        return;
      }

      await api.put(`/auth/usuario/${userInfo.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (updateData.username) {
        const user = JSON.parse(localStorage.getItem('user'));
        user.username = updateData.username;
        localStorage.setItem('user', JSON.stringify(user));
      }

      setSuccess('Credenciais alteradas com sucesso!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Erro ao alterar credenciais');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout titulo="Alterar Credenciais">
      <div className="alterar-credenciais-container">
        <div className="alterar-credenciais-card">
          <h2>Alterar Usuário e Senha</h2>
          <p className="info-usuario">
            Usuário atual: <strong>{userInfo.nome}</strong>
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Novo Usuário (login)</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Digite o novo nome de usuário"
              />
              <small>Deixe em branco para manter o atual</small>
            </div>
            
            <div className="form-group">
              <label>Nova Senha</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Digite a nova senha"
              />
              <small>Deixe em branco para manter a atual (mínimo 6 caracteres)</small>
            </div>
            
            <div className="form-group">
              <label>Confirmar Nova Senha</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Digite a nova senha novamente"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard')}>
              Cancelar
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default AlterarCredenciais;
