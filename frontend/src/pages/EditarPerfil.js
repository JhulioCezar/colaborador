import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import './EditarPerfil.css';

function EditarPerfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome_completo: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    complemento: '',
    cep: '',
    coordenadas: '',
    link_maps: '',
    cpf: '',
    titulo_eleitor: '',
    zona: '',
    sessao: '',
    endereco_votacao: '',
    local_votacao: '',
    bairro_votacao: '',
    municipio_votacao: '',
    foto: null,
    fotoPreview: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buscandoCoordenadas, setBuscandoCoordenadas] = useState(false);
  const [validando, setValidando] = useState(false);
  const [mensagemValidacao, setMensagemValidacao] = useState('');

  const estadosBrasileiros = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  useEffect(() => {
    carregarDados();
  }, [id]);

  const formatarNome = (nome) => {
    const palavras = nome.toLowerCase().split(' ');
    const excecoes = ['e', 'da', 'de', 'do', 'das', 'dos'];
    const palavrasFormatadas = palavras.map((palavra) => {
      if (excecoes.includes(palavra)) {
        return palavra;
      }
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    });
    return palavrasFormatadas.join(' ');
  };

  const formatarCPF = (valor) => {
    const cpf = valor.replace(/\D/g, '');
    if (cpf.length <= 11) {
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14);
    }
    return valor;
  };

  const formatarCEP = (valor) => {
    const cep = valor.replace(/\D/g, '');
    if (cep.length <= 8) {
      return cep.replace(/(\d{5})(\d{3})/, '$1-$2').slice(0, 9);
    }
    return valor;
  };

  const buscarEnderecoPorCEP = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length !== 8) {
      setError('CEP inválido. Digite 8 números.');
      return;
    }

    try {
      const response = await api.get(`https://viacep.com.br/ws/${cep}/json/`);
      if (response.data.erro) {
        setError('CEP não encontrado');
        return;
      }

      setFormData(prev => ({
        ...prev,
        logradouro: response.data.logradouro || '',
        bairro: response.data.bairro || '',
        cidade: response.data.localidade || '',
        estado: response.data.uf || '',
        complemento: response.data.complemento || '',
        link_maps: `https://maps.google.com/?q=${response.data.logradouro},${response.data.bairro},${response.data.localidade}`
      }));
      setError('');
    } catch (err) {
      setError('Erro ao buscar CEP');
    }
  };

  const buscarPorCoordenadas = async () => {
    const coords = formData.coordenadas.trim();
    if (!coords) {
      setError('Digite as coordenadas no formato: latitude, longitude');
      return;
    }

    const partes = coords.split(',').map(p => p.trim());
    if (partes.length !== 2) {
      setError('Formato inválido. Use: -23.5505, -46.6333');
      return;
    }

    const latitude = parseFloat(partes[0]);
    const longitude = parseFloat(partes[1]);

    if (isNaN(latitude) || isNaN(longitude)) {
      setError('Coordenadas inválidas. Use números decimais.');
      return;
    }

    setBuscandoCoordenadas(true);
    setError('');

    try {
      const response = await api.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );

      if (response.data && response.data.address) {
        const address = response.data.address;
        const logradouro = address.road || address.pedestrian || '';
        const numero = address.house_number || '';
        const bairro = address.suburb || address.neighbourhood || '';
        const cidade = address.city || address.town || address.village || '';
        const estado = address.state_code || address.state || '';
        const cep = address.postcode || '';
        
        setFormData(prev => ({
          ...prev,
          logradouro: logradouro,
          numero: numero,
          bairro: bairro,
          cidade: cidade,
          estado: estado,
          complemento: '',
          cep: cep ? formatarCEP(cep) : '',
          link_maps: `https://maps.google.com/?q=${latitude},${longitude}`
        }));
        
        if (!logradouro) {
          setError('Endereço não encontrado para estas coordenadas');
        } else {
          setError('');
        }
      } else {
        setError('Endereço não encontrado para estas coordenadas');
      }
    } catch (err) {
      console.error('Erro ao buscar endereço:', err);
      setError('Erro ao buscar endereço. Verifique as coordenadas.');
    } finally {
      setBuscandoCoordenadas(false);
    }
  };

  const obterLocalizacao = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador');
      return;
    }

    setError('');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coordenadas = `${latitude}, ${longitude}`;
        const linkMaps = `https://maps.google.com/?q=${latitude},${longitude}`;
        
        setFormData(prev => ({
          ...prev,
          coordenadas: coordenadas,
          link_maps: linkMaps
        }));

        try {
          const response = await api.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          
          if (response.data && response.data.address) {
            const address = response.data.address;
            const logradouro = address.road || address.pedestrian || '';
            const numero = address.house_number || '';
            const bairro = address.suburb || address.neighbourhood || '';
            const cidade = address.city || address.town || address.village || '';
            const estado = address.state_code || address.state || '';
            const cep = address.postcode || '';
            
            setFormData(prev => ({
              ...prev,
              coordenadas: coordenadas,
              link_maps: linkMaps,
              logradouro: logradouro,
              numero: numero,
              bairro: bairro,
              cidade: cidade,
              estado: estado,
              cep: cep ? formatarCEP(cep) : ''
            }));
          }
        } catch (err) {
          console.error('Erro ao buscar endereço por GPS:', err);
        }
      },
      (err) => {
        setError('Erro ao obter localização: ' + err.message);
      }
    );
  };

  const validarZonaSessao = async () => {
    const zona = formData.zona;
    const sessao = formData.sessao;
    
    if (!zona || !sessao) {
      setError('Preencha zona e sessão para validar');
      return;
    }
    
    setValidando(true);
    setError('');
    setMensagemValidacao('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/pessoas/validar-zona-sessao/${zona}/${sessao}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const local = response.data.local;
        setMensagemValidacao(`✅ Válido! Local de votação: ${local.local_votacao}, Endereço: ${local.endereco}`);
        
        const preencherEndereco = window.confirm(
          `Deseja preencher o endereço do LOCAL DE VOTAÇÃO?\n\n` +
          `Local: ${local.local_votacao}\n` +
          `Endereço: ${local.endereco}\n\n` +
          `(O endereço do colaborador deve ser preenchido separadamente)`
        );
        
        if (preencherEndereco) {
          setFormData(prev => ({
            ...prev,
            endereco_votacao: local.endereco,
            local_votacao: local.local_votacao,
            bairro_votacao: local.bairro,
            municipio_votacao: local.municipio
          }));
          setMensagemValidacao(prev => prev + '\n\n📍 Endereço do local de votação preenchido!');
        }
      } else {
        setMensagemValidacao('❌ Zona e sessão não encontradas na base do TSE');
      }
    } catch (error) {
      console.error('Erro ao validar:', error);
      setError('Erro ao validar zona/sessão');
    } finally {
      setValidando(false);
    }
  };

  const carregarDados = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await api.get(`/pessoas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const pessoa = response.data.pessoa;
      
      let logradouro = '', numero = '', bairro = '', cidade = '', estado = '';
      if (pessoa.endereco) {
        const partes = pessoa.endereco.split(',').map(p => p.trim());
        logradouro = partes[0] || '';
        numero = partes[1] || '';
        bairro = partes[2] || '';
        cidade = partes[3] || '';
        estado = partes[4] || '';
      }
      
      setFormData({
        nome_completo: pessoa.nome_completo || '',
        logradouro: logradouro,
        numero: numero,
        bairro: bairro,
        cidade: cidade,
        estado: estado,
        complemento: '',
        cep: pessoa.cep || '',
        coordenadas: pessoa.coordenadas || '',
        link_maps: pessoa.link_maps || '',
        cpf: pessoa.cpf || '',
        titulo_eleitor: pessoa.titulo_eleitor || '',
        zona: pessoa.zona || '',
        sessao: pessoa.sessao || '',
        endereco_votacao: pessoa.endereco_votacao || '',
        local_votacao: pessoa.local_votacao || '',
        bairro_votacao: pessoa.bairro_votacao || '',
        municipio_votacao: pessoa.municipio_votacao || '',
        foto: null,
        fotoPreview: pessoa.foto_url || ''
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        foto: file,
        fotoPreview: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    if (name === 'nome_completo') {
      value = formatarNome(value);
    } else if (name === 'cpf') {
      value = formatarCPF(value);
    } else if (name === 'cep') {
      value = formatarCEP(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      
      let fotoUrl = formData.fotoPreview;
      if (formData.foto) {
        const fotoFormData = new FormData();
        fotoFormData.append('foto', formData.foto);
        
        const fotoResponse = await api.post('/upload/foto-pessoa', fotoFormData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (fotoResponse.data.success) {
          fotoUrl = fotoResponse.data.foto_url;
        }
      }

      const enderecoCompleto = `${formData.logradouro}, ${formData.numero}, ${formData.bairro}, ${formData.cidade}, ${formData.estado}`;

      let latitude = null, longitude = null;
      if (formData.coordenadas && formData.coordenadas.includes(',')) {
        const coords = formData.coordenadas.split(',');
        latitude = parseFloat(coords[0]);
        longitude = parseFloat(coords[1]);
      }

      await api.put(`/pessoas/${id}`, 
        {
          nome_completo: formData.nome_completo,
          endereco: enderecoCompleto,
          cpf: formData.cpf,
          titulo_eleitor: formData.titulo_eleitor,
          zona: formData.zona,
          sessao: formData.sessao,
          coordenadas: formData.coordenadas,
          link_maps: formData.link_maps,
          cep: formData.cep,
          latitude: latitude,
          longitude: longitude,
          foto_url: fotoUrl,
          endereco_votacao: formData.endereco_votacao,
          local_votacao: formData.local_votacao,
          bairro_votacao: formData.bairro_votacao,
          municipio_votacao: formData.municipio_votacao
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Perfil atualizado com sucesso!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Erro ao atualizar perfil');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Layout titulo="Editar Perfil">
        <div className="loading">Carregando...</div>
      </Layout>
    );
  }

  return (
    <Layout titulo="Editar Perfil">
      <div className="editar-perfil-container">
        <div className="editar-perfil-card">
          <h2>Editar Perfil</h2>
          <p className="info-text">Preencha apenas os campos que deseja alterar</p>
          <form onSubmit={handleSubmit}>
            
            <div className="form-group foto-upload">
              <label>Foto</label>
              <div className="foto-preview" onClick={() => document.getElementById('foto-input').click()}>
                {formData.fotoPreview ? (
                  <img src={formData.fotoPreview} alt="Preview" />
                ) : (
                  <div className="foto-placeholder">📷 Clique para adicionar foto</div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                id="foto-input"
                style={{ display: 'none' }}
              />
            </div>
            
            <div className="form-group">
              <label>Nome completo</label>
              <input
                type="text"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleChange}
                placeholder="Digite o nome completo"
              />
            </div>
            
            <div className="form-section">
              <h3>📍 Endereço</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Logradouro</label>
                  <input
                    type="text"
                    name="logradouro"
                    value={formData.logradouro}
                    onChange={handleChange}
                    placeholder="Rua/Avenida"
                  />
                </div>
                <div className="form-group">
                  <label>Nº</label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    placeholder="Número"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Bairro</label>
                  <input
                    type="text"
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleChange}
                    placeholder="Bairro"
                  />
                </div>
                <div className="form-group">
                  <label>Cidade</label>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                    placeholder="Cidade"
                  />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                  >
                    <option value="">Selecione</option>
                    {estadosBrasileiros.map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Complemento</label>
                  <input
                    type="text"
                    name="complemento"
                    value={formData.complemento}
                    onChange={handleChange}
                    placeholder="Apto, Bloco, etc"
                  />
                </div>
                <div className="form-group cep-group">
                  <label>CEP</label>
                  <div className="cep-input">
                    <input
                      type="text"
                      name="cep"
                      value={formData.cep}
                      onChange={handleChange}
                      placeholder="00000-000"
                    />
                    <button type="button" onClick={buscarEnderecoPorCEP} className="btn-cep">
                      Buscar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>🗺️ Localização Avançada</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Coordenadas</label>
                  <div className="coordenadas-input">
                    <input
                      type="text"
                      name="coordenadas"
                      value={formData.coordenadas}
                      onChange={handleChange}
                      placeholder="-23.5505, -46.6333"
                    />
                    <button 
                      type="button" 
                      onClick={buscarPorCoordenadas} 
                      className="btn-buscar-coordenadas"
                      disabled={buscandoCoordenadas}
                    >
                      {buscandoCoordenadas ? 'Buscando...' : '🔍 Buscar Endereço'}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Link Google Maps</label>
                  {formData.link_maps ? (
                    <a 
                      href={formData.link_maps} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link-maps"
                    >
                      {formData.link_maps}
                    </a>
                  ) : (
                    <input
                      type="text"
                      value={formData.link_maps}
                      readOnly
                      placeholder="Link gerado automaticamente"
                    />
                  )}
                </div>
                <div className="form-group gps-button">
                  <button type="button" onClick={obterLocalizacao} className="btn-gps">
                    📍 GPS
                  </button>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>📄 Documentos</h3>
              <div className="form-group">
                <label>CPF</label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
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
                <div className="form-group validar-button">
                  <button 
                    type="button" 
                    onClick={validarZonaSessao} 
                    className="btn-validar"
                    disabled={validando}
                  >
                    {validando ? 'Validando...' : '🔍 Validar com TSE'}
                  </button>
                </div>
              </div>
              
              {mensagemValidacao && <div className="info-message">{mensagemValidacao}</div>}
              
              {formData.local_votacao && (
                <div className="form-section-votacao">
                  <h3>🗳️ Local de Votação (TSE)</h3>
                  <div className="form-group">
                    <label>Local de Votação</label>
                    <input
                      type="text"
                      value={formData.local_votacao}
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                  <div className="form-group">
                    <label>Endereço do Local de Votação</label>
                    <input
                      type="text"
                      value={formData.endereco_votacao}
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Bairro (Local Votação)</label>
                      <input
                        type="text"
                        value={formData.bairro_votacao}
                        readOnly
                        className="readonly-field"
                      />
                    </div>
                    <div className="form-group">
                      <label>Município (Local Votação)</label>
                      <input
                        type="text"
                        value={formData.municipio_votacao}
                        readOnly
                        className="readonly-field"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <button type="submit" className="btn-primary" disabled={uploading}>
              {uploading ? 'Salvando...' : 'Salvar Alterações'}
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

export default EditarPerfil;
