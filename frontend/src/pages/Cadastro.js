import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/supabase';
import './Cadastro.css';

function Cadastro() {
  const navigate = useNavigate();
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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

    try {
      // Registrar usuário no Supabase
      const result = await registerUser(formData.username, formData.password);
      
      if (result.success) {
        // Criar pessoa (dados adicionais)
        // Isso será feito separadamente depois do login
        setSuccess('Cadastro realizado com sucesso! Redirecionando para o login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Erro ao cadastrar. Verifique os dados e tente novamente.');
    }
  };

  return (
    <div className="cadastro-container">
      <div className="cadastro-card">
        <h2>Cadastro de Usuário</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome completo</label>
            <input
              type="text"
              name="nome_completo"
              value={formData.nome_completo}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Endereço</label>
            <input
              type="text"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>CPF</label>
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
            <label>Usuário</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Confirmar Senha</label>
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

export default Cadastro;
