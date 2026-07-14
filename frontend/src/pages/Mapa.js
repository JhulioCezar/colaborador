import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import api from '../services/api';
import Layout from '../components/Layout';
import './Mapa.css';

const mapContainerStyle = {
  width: '100%',
  height: '550px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const libraries = ['places'];
const GOOGLE_MAPS_API_KEY = 'AIzaSyDIaPKoL3ObI_fRA6bOl-xRrLPI5k1h4pU';

function Mapa() {
  const [pessoas, setPessoas] = useState([]);
  const [filteredPessoas, setFilteredPessoas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPessoa, setSelectedPessoa] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: -23.5505, lng: -46.6333 });
  const [mapZoom, setMapZoom] = useState(12);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [filtros, setFiltros] = useState({ estado: '', municipio: '', bairro: '' });
  const [estadosUnicos, setEstadosUnicos] = useState([]);
  const [municipiosUnicos, setMunicipiosUnicos] = useState([]);
  const [bairrosUnicos, setBairrosUnicos] = useState([]);
  const [municipiosPorEstado, setMunicipiosPorEstado] = useState({});
  const [bairrosPorMunicipio, setBairrosPorMunicipio] = useState({});
  const navigate = useNavigate();

  const extrairEnderecoParts = (endereco) => {
    if (!endereco) return { bairro: '', municipio: '', estado: '' };
    const parts = endereco.split(',').map(p => p.trim());
    return {
      bairro: parts[2] || '',
      municipio: parts[3] || '',
      estado: parts[4] || ''
    };
  };

  const criarIconePersonalizado = (fotoUrl) => {
    if (fotoUrl) {
      return {
        url: fotoUrl,
        scaledSize: { width: 40, height: 40 },
        anchor: { x: 20, y: 40 },
        labelOrigin: { x: 20, y: 0 }
      };
    }
    return null;
  };

  const carregarPessoas = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/pessoas/todos-contatos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const pessoasComCoords = response.data.pessoas.map(pessoa => {
        let lat = null, lng = null;
        
        if (pessoa.latitude && pessoa.longitude) {
          lat = parseFloat(pessoa.latitude);
          lng = parseFloat(pessoa.longitude);
        } else if (pessoa.coordenadas && pessoa.coordenadas.includes(',')) {
          const coords = pessoa.coordenadas.split(',');
          lat = parseFloat(coords[0]);
          lng = parseFloat(coords[1]);
        }
        
        return {
          ...pessoa,
          lat: lat,
          lng: lng,
          enderecoParts: extrairEnderecoParts(pessoa.endereco),
          icon: pessoa.foto_url ? criarIconePersonalizado(pessoa.foto_url) : null
        };
      }).filter(p => p.lat && p.lng);
      
      setPessoas(pessoasComCoords);
      setFilteredPessoas(pessoasComCoords);
      
      const estados = [...new Set(pessoasComCoords.map(p => p.enderecoParts.estado).filter(e => e && e !== ''))];
      setEstadosUnicos(estados.sort());
      
      const municipiosPorEstadoTemp = {};
      const bairrosPorMunicipioTemp = {};
      
      pessoasComCoords.forEach(p => {
        const estado = p.enderecoParts.estado;
        const municipio = p.enderecoParts.municipio;
        const bairro = p.enderecoParts.bairro;
        
        if (estado && municipio) {
          if (!municipiosPorEstadoTemp[estado]) {
            municipiosPorEstadoTemp[estado] = new Set();
          }
          municipiosPorEstadoTemp[estado].add(municipio);
        }
        
        if (municipio && bairro) {
          if (!bairrosPorMunicipioTemp[municipio]) {
            bairrosPorMunicipioTemp[municipio] = new Set();
          }
          bairrosPorMunicipioTemp[municipio].add(bairro);
        }
      });
      
      Object.keys(municipiosPorEstadoTemp).forEach(estado => {
        municipiosPorEstadoTemp[estado] = [...municipiosPorEstadoTemp[estado]].sort();
      });
      
      Object.keys(bairrosPorMunicipioTemp).forEach(municipio => {
        bairrosPorMunicipioTemp[municipio] = [...bairrosPorMunicipioTemp[municipio]].sort();
      });
      
      setMunicipiosPorEstado(municipiosPorEstadoTemp);
      setBairrosPorMunicipio(bairrosPorMunicipioTemp);
      
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const obterLocalizacaoAtual = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter({ lat: latitude, lng: longitude });
          setMapZoom(14);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setMapCenter({ lat: -23.5505, lng: -46.6333 });
          setMapZoom(12);
        }
      );
    } else {
      setMapCenter({ lat: -23.5505, lng: -46.6333 });
      setMapZoom(12);
    }
  }, []);

  useEffect(() => {
    carregarPessoas();
    obterLocalizacaoAtual();
  }, [carregarPessoas, obterLocalizacaoAtual]);

  useEffect(() => {
    let filtered = [...pessoas];
    
    if (filtros.estado) {
      filtered = filtered.filter(p => p.enderecoParts.estado === filtros.estado);
    }
    
    if (filtros.municipio) {
      filtered = filtered.filter(p => p.enderecoParts.municipio === filtros.municipio);
    }
    
    if (filtros.bairro) {
      filtered = filtered.filter(p => p.enderecoParts.bairro === filtros.bairro);
    }
    
    setFilteredPessoas(filtered);
  }, [filtros, pessoas]);

  const handleEstadoChange = (e) => {
    const estado = e.target.value;
    setFiltros({ estado: estado, municipio: '', bairro: '' });
    setMunicipiosUnicos(estado ? municipiosPorEstado[estado] || [] : []);
    setBairrosUnicos([]);
  };

  const handleMunicipioChange = (e) => {
    const municipio = e.target.value;
    setFiltros(prev => ({ ...prev, municipio: municipio, bairro: '' }));
    setBairrosUnicos(municipio ? bairrosPorMunicipio[municipio] || [] : []);
  };

  const handleBairroChange = (e) => {
    setFiltros(prev => ({ ...prev, bairro: e.target.value }));
  };

  const limparFiltros = () => {
    setFiltros({ estado: '', municipio: '', bairro: '' });
    setMunicipiosUnicos([]);
    setBairrosUnicos([]);
  };

  const handleSair = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const onLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

  if (loading) {
    return (
      <Layout titulo="Ver no Mapa">
        <div className="loading-spinner">Carregando dados...</div>
      </Layout>
    );
  }

  return (
    <Layout titulo="Ver no Mapa">
      <div className="mapa-container-page">
        <div className="mapa-header-page">
          <div className="filtros-container-page">
            <select value={filtros.estado} onChange={handleEstadoChange} className="filtro-select">
              <option value="">Todos os Estados</option>
              {estadosUnicos.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
            
            <select value={filtros.municipio} onChange={handleMunicipioChange} className="filtro-select" disabled={!filtros.estado}>
              <option value="">Todos os Municípios</option>
              {municipiosUnicos.map(municipio => (
                <option key={municipio} value={municipio}>{municipio}</option>
              ))}
            </select>
            
            <select value={filtros.bairro} onChange={handleBairroChange} className="filtro-select" disabled={!filtros.municipio}>
              <option value="">Todos os Bairros</option>
              {bairrosUnicos.map(bairro => (
                <option key={bairro} value={bairro}>{bairro}</option>
              ))}
            </select>
            
            <button onClick={limparFiltros} className="btn-limpar-filtros">
              Limpar Filtros
            </button>
          </div>
          
          <div className="resultado-info-page">
            <span className="resultado-badge">
              {filteredPessoas.length} {filteredPessoas.length === 1 ? 'contato' : 'contatos'} encontrados
            </span>
          </div>
        </div>
        
        <LoadScript 
          googleMapsApiKey={GOOGLE_MAPS_API_KEY} 
          libraries={libraries}
          onLoad={onLoad}
        >
          {mapLoaded && (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={mapZoom}
              options={{
                fullscreenControl: true,
                streetViewControl: false,
                mapTypeControl: true,
                zoomControl: true,
                gestureHandling: 'greedy'
              }}
            >
              {filteredPessoas.map((pessoa) => (
                <Marker
                  key={pessoa.id}
                  position={{ lat: pessoa.lat, lng: pessoa.lng }}
                  onClick={() => setSelectedPessoa(pessoa)}
                  title={pessoa.nome_completo}
                  icon={pessoa.icon}
                />
              ))}
              
              {selectedPessoa && (
                <InfoWindow
                  position={{ lat: selectedPessoa.lat, lng: selectedPessoa.lng }}
                  onCloseClick={() => setSelectedPessoa(null)}
                >
                  <div className="info-window">
                    {selectedPessoa.foto_url && (
                      <img src={selectedPessoa.foto_url} alt={selectedPessoa.nome_completo} className="info-foto" />
                    )}
                    <h4>{selectedPessoa.nome_completo}</h4>
                    <p className="info-endereco">{selectedPessoa.endereco}</p>
                    <p className="info-cpf"><strong>CPF:</strong> {selectedPessoa.cpf}</p>
                    {selectedPessoa.titulo_eleitor && (
                      <p className="info-titulo"><strong>Título:</strong> {selectedPessoa.titulo_eleitor} | Zona: {selectedPessoa.zona} | Sessão: {selectedPessoa.sessao}</p>
                    )}
                    <a 
                      href={`https://maps.google.com/?q=${selectedPessoa.lat},${selectedPessoa.lng}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="info-link"
                    >
                      Abrir no Google Maps →
                    </a>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </LoadScript>
        
        <div className="botoes-mapa">
          <button className="btn-voltar" onClick={() => navigate('/dashboard')}>
            Voltar
          </button>
          <button className="btn-sair" onClick={handleSair}>
            Sair
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default Mapa;
