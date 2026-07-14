import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import api from '../services/api';
import Layout from '../components/Layout';
import './MapaEleitoral.css';

const mapContainerStyle = {
  width: '100%',
  height: '550px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const libraries = ['places'];
const GOOGLE_MAPS_API_KEY = 'AIzaSyDIaPKoL3ObI_fRA6bOl-xRrLPI5k1h4pU';

function MapaEleitoral() {
  const [locais, setLocais] = useState([]);
  const [filteredLocais, setFilteredLocais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: -9.97, lng: -67.81 });
  const [mapZoom, setMapZoom] = useState(12);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const [municipios, setMunicipios] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    carregarLocais();
  }, []);

  useEffect(() => {
    if (filtroMunicipio) {
      setFilteredLocais(locais.filter(l => l.municipio === filtroMunicipio));
    } else {
      setFilteredLocais(locais);
    }
  }, [filtroMunicipio, locais]);

  const carregarLocais = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/pessoas/locais-votacao', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setLocais(response.data.locais);
        setFilteredLocais(response.data.locais);
        
        const uniqueMunicipios = [...new Set(response.data.locais.map(l => l.municipio))];
        setMunicipios(uniqueMunicipios.sort());
      }
    } catch (error) {
      console.error('Erro ao carregar locais:', error);
    } finally {
      setLoading(false);
    }
  };

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
          setMapCenter({ lat: -9.97, lng: -67.81 });
          setMapZoom(12);
        }
      );
    } else {
      setMapCenter({ lat: -9.97, lng: -67.81 });
      setMapZoom(12);
    }
  }, []);

  useEffect(() => {
    obterLocalizacaoAtual();
  }, []);

  const onLoad = useCallback(() => {
    setMapLoaded(true);
  }, []);

  if (loading) {
    return (
      <Layout titulo="Mapa Eleitoral - Locais de Votação">
        <div className="loading-spinner">Carregando locais de votação...</div>
      </Layout>
    );
  }

  return (
    <Layout titulo="Mapa Eleitoral - Locais de Votação">
      <div className="mapa-eleitoral-container">
        <div className="mapa-eleitoral-header">
          <div className="filtros-eleitoral">
            <select 
              value={filtroMunicipio} 
              onChange={(e) => setFiltroMunicipio(e.target.value)}
              className="filtro-municipio"
            >
              <option value="">Todos os Municípios</option>
              {municipios.map(municipio => (
                <option key={municipio} value={municipio}>{municipio}</option>
              ))}
            </select>
            <div className="info-locais">
              <span className="info-badge">
                {filteredLocais.length} locais de votação encontrados
              </span>
            </div>
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
              {filteredLocais.map((local) => (
                <Marker
                  key={local.id}
                  position={{ lat: parseFloat(local.latitude), lng: parseFloat(local.longitude) }}
                  onClick={() => setSelectedLocal(local)}
                  title={local.local_votacao}
                  icon={{
                    url: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
                    scaledSize: { width: 32, height: 32 }
                  }}
                />
              ))}
              
              {selectedLocal && (
                <InfoWindow
                  position={{ lat: parseFloat(selectedLocal.latitude), lng: parseFloat(selectedLocal.longitude) }}
                  onCloseClick={() => setSelectedLocal(null)}
                >
                  <div className="info-window-eleitoral">
                    <h4>{selectedLocal.local_votacao}</h4>
                    <p><strong>Município:</strong> {selectedLocal.municipio}</p>
                    <p><strong>Endereço:</strong> {selectedLocal.endereco}</p>
                    <a 
                      href={`https://maps.google.com/?q=${selectedLocal.latitude},${selectedLocal.longitude}`} 
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
        
        <div className="botoes-mapa-eleitoral">
          <button className="btn-voltar" onClick={() => navigate('/dashboard')}>
            Voltar
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default MapaEleitoral;
