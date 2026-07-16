import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, Filler } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import Layout from '../components/Layout';
import { listPessoas } from '../services/supabase';
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
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id;
      
      if (!userId) {
        navigate('/login');
        return;
      }

      const result = await listPessoas(userId);
      const pessoas = result.pessoas || [];
      
      // Processar dados para estatísticas
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
      
      setEstatisticas({
        totalContatos,
        totalCidades: cidadesMap.size,
        totalBairros: bairrosMap.size,
        contatosPorEstado,
        topCidades,
        topBairros
      });
      
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const carregarEstatisticasZona = async () => {
    try {
      // Implementar estatísticas de zona/sessão
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar estatísticas de zona:', error);
      setLoading(false);
    }
  };

  const abrirDetalhes = (titulo, dados) => {
    setDetalhesModal({ titulo, dados });
  };

  const fecharModal = () => {
    setDetalhesModal(null);
  };

  // Restante do componente (gráficos, renderização) permanece igual
  // ... (mantenha o código existente para os gráficos e layout)

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
        {/* Mantenha o restante do JSX existente */}
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

        {/* Ranking de Cidades */}
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
