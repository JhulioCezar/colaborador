import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, Filler } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import Layout from '../components/Layout';
import api from '../services/api';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, Filler);

function Dashboard() {
  const navigate = useNavigate();
  const [estatisticas, setEstatisticas] = useState({
    totalContatos: 0,
    totalCidades: 0,
    totalBairros: 0,
    contatosPorEstado: [],
    topCidades: [],
    topBairros: []
  });
  const [estatisticasZona, setEstatisticasZona] = useState({
    zonas: [],
    sessoes: [],
    totalEleitores: 0
  });
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('geral');
  const [detalhesModal, setDetalhesModal] = useState(null);
  const [animacao, setAnimacao] = useState(false);

  useEffect(() => {
    carregarEstatisticas();
    carregarEstatisticasZona();
    setTimeout(() => setAnimacao(true), 100);
  }, []);

  const carregarEstatisticas = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/pessoas/estatisticas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEstatisticas(response.data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const carregarEstatisticasZona = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/pessoas/estatisticas-zona-sessao', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setEstatisticasZona({
          zonas: response.data.zonas,
          sessoes: response.data.sessoes,
          totalEleitores: response.data.totalEleitores
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas de zona:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirDetalhes = (titulo, dados) => {
    setDetalhesModal({ titulo, dados });
  };

  const fecharModal = () => {
    setDetalhesModal(null);
  };

  // Paleta de cores profissionais
  const cores = {
    primaria: 'rgba(102, 126, 234, 0.85)',
    primariaBorda: 'rgba(102, 126, 234, 1)',
    secundaria: 'rgba(54, 162, 235, 0.85)',
    secundariaBorda: 'rgba(54, 162, 235, 1)',
    terciaria: 'rgba(255, 159, 64, 0.85)',
    terciariaBorda: 'rgba(255, 159, 64, 1)',
    pizza: [
      'rgba(102, 126, 234, 0.85)',
      'rgba(54, 162, 235, 0.85)',
      'rgba(255, 99, 132, 0.85)',
      'rgba(75, 192, 192, 0.85)',
      'rgba(255, 159, 64, 0.85)',
    ]
  };

  // Configuração do gráfico de Estados
  const estadosLabels = estatisticas.contatosPorEstado.map(item => item.estado);
  const estadosValues = estatisticas.contatosPorEstado.map(item => item.total);
  
  const graficoEstadosData = {
    labels: estadosLabels,
    datasets: [
      {
        label: 'Quantidade de Contatos',
        data: estadosValues,
        backgroundColor: cores.primaria,
        borderColor: cores.primariaBorda,
        borderWidth: 1,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(102, 126, 234, 1)',
      },
    ],
  };

  const graficoEstadosOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 } } },
      tooltip: { 
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        callbacks: { label: (context) => `${context.raw} contatos` } 
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const estado = estadosLabels[index];
        const quantidade = estadosValues[index];
        abrirDetalhes(`Contatos em ${estado}`, [{ label: 'Total de contatos', value: quantidade }]);
      }
    }
  };

  // Configuração do gráfico de Zonas
  const zonasLabels = estatisticasZona.zonas.map(item => `Zona ${item.zona}`);
  const zonasValues = estatisticasZona.zonas.map(item => item.total);
  
  const graficoZonasData = {
    labels: zonasLabels,
    datasets: [
      {
        label: 'Eleitores por Zona',
        data: zonasValues,
        backgroundColor: cores.secundaria,
        borderColor: cores.secundariaBorda,
        borderWidth: 1,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(54, 162, 235, 1)',
      },
    ],
  };

  const graficoZonasOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 } } },
      tooltip: { 
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: { label: (context) => `${context.raw} eleitores` } 
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const zona = zonasLabels[index];
        const quantidade = zonasValues[index];
        abrirDetalhes(`Detalhes da ${zona}`, [{ label: 'Total de eleitores', value: quantidade }]);
      }
    }
  };

  // Configuração do gráfico de Sessões (Pie)
  const sessoesLabels = estatisticasZona.sessoes.slice(0, 5).map(item => `Sessão ${item.sessao}`);
  const sessoesValues = estatisticasZona.sessoes.slice(0, 5).map(item => item.total);
  
  const graficoSessoesData = {
    labels: sessoesLabels,
    datasets: [
      {
        data: sessoesValues,
        backgroundColor: cores.pizza,
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const graficoSessoesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: { position: 'right', labels: { font: { size: 11 } } },
      tooltip: { 
        backgroundColor: 'rgba(0,0,0,0.8)',
        callbacks: { label: (context) => `${context.label}: ${context.raw} eleitores (${Math.round((context.raw / estatisticasZona.totalEleitores) * 100)}%)` } 
      }
    },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const sessao = sessoesLabels[index];
        const quantidade = sessoesValues[index];
        abrirDetalhes(`Detalhes da ${sessao}`, [{ label: 'Total de eleitores', value: quantidade }]);
      }
    }
  };

  if (loading) {
    return (
      <Layout titulo="Dashboard">
        <div className="loading-container">
          <div className="loading-spinner-dashboard"></div>
          <p>Carregando estatísticas...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout titulo="Dashboard">
      <div className={`dashboard-container ${animacao ? 'animado' : ''}`}>
        
        {/* Abas */}
        <div className="abas-dashboard">
          <button 
            className={`aba-btn ${abaAtiva === 'geral' ? 'ativa' : ''}`}
            onClick={() => setAbaAtiva('geral')}
          >
            Geral
          </button>
          <button 
            className={`aba-btn ${abaAtiva === 'eleitoral' ? 'ativa' : ''}`}
            onClick={() => setAbaAtiva('eleitoral')}
          >
            Eleitoral
          </button>
        </div>

        {/* Aba Geral */}
        {abaAtiva === 'geral' && (
          <>
            <div className="cards-grid">
              <div className="card-dashboard" onClick={() => abrirDetalhes('Total de Contatos', [{ label: 'Contatos cadastrados', value: estatisticas.totalContatos }])}>
                <div className="card-info">
                  <h3>{estatisticas.totalContatos}</h3>
                  <p>Total de Contatos</p>
                </div>
              </div>
              
              <div className="card-dashboard" onClick={() => abrirDetalhes('Cidades Atendidas', estatisticas.topCidades.map(c => ({ label: c.cidade, value: c.total })))}>
                <div className="card-info">
                  <h3>{estatisticas.totalCidades}</h3>
                  <p>Cidades Atendidas</p>
                </div>
              </div>
              
              <div className="card-dashboard" onClick={() => abrirDetalhes('Bairros Diferentes', estatisticas.topBairros.map(b => ({ label: b.bairro, value: b.total })))}>
                <div className="card-info">
                  <h3>{estatisticas.totalBairros}</h3>
                  <p>Bairros Diferentes</p>
                </div>
              </div>
            </div>

            <div className="grafico-container">
              <h3>Contatos por Estado</h3>
              <div className="grafico-wrapper">
                <Bar data={graficoEstadosData} options={graficoEstadosOptions} />
              </div>
              <p className="grafico-dica">📊 Clique em uma barra para ver detalhes</p>
            </div>

            <div className="rankings-grid">
              <div className="ranking-card" onClick={() => abrirDetalhes('Top Cidades', estatisticas.topCidades.map(c => ({ label: c.cidade, value: c.total })))}>
                <h3>Top Cidades</h3>
                <div className="ranking-lista">
                  {estatisticas.topCidades.map((item, index) => (
                    <div key={index} className="ranking-item">
                      <span className="ranking-posicao">{index + 1}º</span>
                      <span className="ranking-nome">{item.cidade}</span>
                      <span className="ranking-valor">{item.total}</span>
                    </div>
                  ))}
                  {estatisticas.topCidades.length === 0 && (
                    <div className="sem-dados">Nenhum dado disponível</div>
                  )}
                </div>
              </div>
              
              <div className="ranking-card" onClick={() => abrirDetalhes('Top Bairros', estatisticas.topBairros.map(b => ({ label: b.bairro, value: b.total })))}>
                <h3>Top Bairros</h3>
                <div className="ranking-lista">
                  {estatisticas.topBairros.map((item, index) => (
                    <div key={index} className="ranking-item">
                      <span className="ranking-posicao">{index + 1}º</span>
                      <span className="ranking-nome">{item.bairro}</span>
                      <span className="ranking-valor">{item.total}</span>
                    </div>
                  ))}
                  {estatisticas.topBairros.length === 0 && (
                    <div className="sem-dados">Nenhum dado disponível</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Aba Eleitoral */}
        {abaAtiva === 'eleitoral' && (
          <>
            <div className="cards-grid">
              <div className="card-dashboard" onClick={() => abrirDetalhes('Total de Eleitores', [{ label: 'Eleitores cadastrados', value: estatisticasZona.totalEleitores }])}>
                <div className="card-info">
                  <h3>{estatisticasZona.totalEleitores}</h3>
                  <p>Total de Eleitores</p>
                </div>
              </div>
            </div>

            <div className="grafico-container">
              <h3>Top 10 Zonas Eleitorais</h3>
              <div className="grafico-wrapper">
                <Bar data={graficoZonasData} options={graficoZonasOptions} />
              </div>
              <p className="grafico-dica">📊 Clique em uma barra para ver detalhes</p>
            </div>

            <div className="grafico-container">
              <h3>Top 5 Sessões Eleitorais</h3>
              <div className="grafico-wrapper-pie">
                <Pie data={graficoSessoesData} options={graficoSessoesOptions} />
              </div>
              <p className="grafico-dica">🥧 Clique em uma fatia para ver detalhes</p>
            </div>

            <div className="info-eleitoral">
              <p>📋 Os dados acima são baseados nas zonas e sessões informadas no cadastro de cada pessoa.</p>
            </div>
          </>
        )}

      </div>

      {/* Modal de Detalhes */}
      {detalhesModal && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-fechar" onClick={fecharModal}>×</button>
            <h3>{detalhesModal.titulo}</h3>
            <div className="modal-detalhes-lista">
              {detalhesModal.dados.map((item, index) => (
                <div key={index} className="modal-detalhes-item">
                  <span className="modal-detalhes-label">{item.label}</span>
                  <span className="modal-detalhes-valor">{item.value}</span>
                </div>
              ))}
            </div>
            <button className="modal-fechar-btn" onClick={fecharModal}>Fechar</button>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Dashboard;
