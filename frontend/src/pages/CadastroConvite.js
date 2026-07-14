import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import './Cadastro.css';

function CadastroConvite() {
  const { conviteId } = useParams();
  const navigate = useNavigate();
  const [conviteValido, setConviteValido] = useState(null);
  const [formData, setFormData] = useState({
    nome_completo: '',
    endereco: '',
    cpf: '',
    titulo_eleitor: '',
    zona: '',
    sessao: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    verificarConvite();
  }, []);

  const verificarConvite = async () => {
    try {
      const response = await api.get(`/convites/verificar/${conviteId}`);
      if (response.data.success) {
        setConviteValido(response.data.convite);
      }
    } catch (err) {
      setError('Convite inválido ou expirado');
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    if (name === 'username') {
      value = value.toLowerCase().replace(/\s/g, '');
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      await api.post('/convites/registrar', {
        conviteId,
        username: formData.username,
        password: formData.password,
        nome_completo: formData.nome_completo,
        endereco: formData.endereco,
        cpf: formData.cpf,
        titulo_eleitor: formData.titulo_eleitor,
        zona: formData.zona,
        sessao: formData.sessao
      });

      setSuccess('Cadastro realizado com sucesso! Redirecionando para o login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao cadastrar');
    }
  };

  if (error && !conviteValido) {
    return (
      <div className="cadastro-container">
        <div className="cadastro-card">
          <h2>Convite Inválido</h2>
          <div className="error-message">{error}</div>
          <button className="btn-primary" onClick={() => navigate('/login')}>Voltar ao Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <h2>Complete seu Cadastro</h2>
        {conviteValido && (
          <p className="info-convite">Você foi convidado para se cadastrar!</p>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome completo *</label>
            <input
              type="text"
              name="nome_completo"
              value={formData.nome_completo}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Endereço *</label>
            <input
              type="text"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>CPF *</label>
            <input
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Título de Eleitor</label>
              <input
                type="text"
                name="titulo_eleitor"
                value={formData.titulo_eleitor}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Zona</label>
              <input
                type="text"
                name="zona"
                value={formData.zona}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Sessão</label>
              <input
                type="text"
                name="sessao"
                value={formData.sessao}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Usuário *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Senha *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Confirmar Senha *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <button type="submit" className="btn-primary">Cadastrar</button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/login')}>
            Voltar
          </button>
        </form>
      </div>
    </div>
  );
}

export default CadastroConvite;
