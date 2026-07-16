import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPessoa } from '../services/supabase';
import './CadastroPessoa.css';

function CadastroPessoa() {
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
  const [buscandoCoordenadas, setBuscandoCoordenadas] = useState(false);
  const [validando, setValidando] = useState(false);
  const [mensagemValidacao, setMensagemValidacao] = useState('');

  const estadosBrasileiros = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Restante das funções (formatarNome, formatarCPF, buscarEnderecoPorCEP, etc.)
  // Mantenha as mesmas funções do código original
  // ...

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id;

      if (!userId) {
        navigate('/login');
        return;
      }

      const enderecoCompleto = `${formData.logradouro}, ${formData.numero}, ${formData.bairro}, ${formData.cidade}, ${formData.estado}${formData.complemento ? ', ' + formData.complemento : ''}`;

      let latitude = null, longitude = null;
      if (formData.coordenadas && formData.coordenadas.includes(',')) {
        const coords = formData.coordenadas.split(',');
        latitude = parseFloat(coords[0]);
        longitude = parseFloat(coords[1]);
      }

      const pessoaData = {
        p_user_id: userId,
        p_nome_completo: formData.nome_completo,
        p_endereco: enderecoCompleto,
        p_cpf: formData.cpf,
        p_titulo_eleitor: formData.titulo_eleitor || null,
        p_zona: formData.zona || null,
        p_sessao: formData.sessao || null,
        p_foto_url: formData.fotoPreview || null,
        p_coordenadas: formData.coordenadas || null,
        p_link_maps: formData.link_maps || null,
        p_cep: formData.cep || null,
        p_latitude: latitude,
        p_longitude: longitude
      };

      const result = await createPessoa(pessoaData);
      
      if (result.success) {
        setSuccess('Pessoa cadastrada com sucesso!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Erro ao cadastrar pessoa. Verifique os dados e tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  // Mantenha o restante do
