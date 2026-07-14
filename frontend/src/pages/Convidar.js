import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import './Convidar.css';

function Convidar() {
  const [nomeConvidado, setNomeConvidado] = useState('');
  const [contato, setContato] = useState('');
  const [linkConvite, setLinkConvite] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLinkConvite('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        '/convites/criar',
        { nome_convidado: nomeConvidado, contato: contato },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setLinkConvite(response.data.link);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao gerar convite');
    } finally {
      setLoading(false);
    }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkConvite);
    alert('Link copiado! Envie para o WhatsApp do convidado.');
  };

  const abrirWhatsApp = () => {
    const mensagem = encodeURIComponent(`Olá! Você foi convidado(a) para se cadastrar no nosso sistema. Acesse o link: ${linkConvite}`);
    window.open(`https://wa.me/?text=${mensagem}`, '_blank');
  };

  return (
    <Layout titulo="Convidar">
      <div className="convidar-container">
        <div className="convidar-card">
          <h2>Convidar Novo Usuário</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome da pessoa convidada *</label>
              <input
                type="text"
                value={nomeConvidado}
                onChange={(e) => setNomeConvidado(e.target.value)}
                required
                placeholder="Ex: João Silva"
              />
            </div>
            
            <div className="form-group">
              <label>Contato (telefone ou e-mail) *</label>
              <input
                type="text"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                required
                placeholder="Ex: (11) 99999-9999 ou joao@email.com"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Gerando...' : 'Gerar Link de Convite'}
            </button>
          </form>

          {linkConvite && (
            <div className="link-container">
              <h3>Link de Convite Gerado!</h3>
              <p className="info-convite">
                Convidado: <strong>{nomeConvidado}</strong><br />
                Contato: <strong>{contato}</strong>
              </p>
              <div className="link-box">
                <input type="text" value={linkConvite} readOnly />
                <button onClick={copiarLink} className="btn-copiar">Copiar</button>
              </div>
              <button onClick={abrirWhatsApp} className="btn-whatsapp">
                Enviar via WhatsApp
              </button>
            </div>
          )}

          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
            Voltar
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default Convidar;
