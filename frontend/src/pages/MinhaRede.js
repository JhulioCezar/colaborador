import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPessoas, deletePessoa } from '../services/supabase';
import Layout from '../components/Layout';
import './MinhaRede.css';

function MinhaRede() {
  const [pessoas, setPessoas] = useState([]);
  const [arvore, setArvore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pessoaSelecionada, setPessoaSelecionada] = useState(null);
  const [expandidos, setExpandidos] = useState({});
  const navigate = useNavigate();

  const getPrimeiroNome = (nomeCompleto) => {
    if (!nomeCompleto) return '';
    return nomeCompleto.split(' ')[0];
  };

  useEffect(() => {
    carregarPessoas();
  }, []);

  const carregarPessoas = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user?.id;
      
      if (!userId) {
        navigate('/login');
        return;
      }

      const result = await listPessoas(userId);
      const listaPessoas = result.pessoas || [];
      
      setPessoas(listaPessoas);
      construirArvore(listaPessoas);
      
      const expandidosIniciais = {};
      listaPessoas.forEach(p => {
        expandidosIniciais[p.id] = true;
      });
      setExpandidos(expandidosIniciais);
      
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error);
    } finally {
      setLoading(false);
    }
  };

  const construirArvore = (listaPessoas) => {
    const pessoasMap = {};
    listaPessoas.forEach(pessoa => {
      pessoasMap[pessoa.id] = {
        ...pessoa,
        filhos: []
      };
    });

    const user = JSON.parse(localStorage.getItem('user'));
    const usuarioLogadoId = user?.id;

    let raiz = null;
    
    listaPessoas.forEach(pessoa => {
      if (pessoa.user_id === usuarioLogadoId && (pessoa.nome_completo === 'Boss Master' || pessoa.nome_completo === 'Administrador')) {
        raiz = pessoasMap[pessoa.id];
      }
    });

    if (!raiz && listaPessoas.length > 0) {
      raiz = pessoasMap[listaPessoas[0].id];
    }

    listaPessoas.forEach(pessoa => {
      if (pessoa.convidado_por && pessoasMap[pessoa.convidado_por]) {
        pessoasMap[pessoa.convidado_por].filhos.push(pessoasMap[pessoa.id]);
      } else if (pessoa.user_id === usuarioLogadoId && pessoa.id !== raiz?.id) {
        if (raiz) {
          raiz.filhos.push(pessoasMap[pessoa.id]);
        }
      }
    });

    if (raiz) {
      const idsUnicos = new Set();
      raiz.filhos = raiz.filhos.filter(filho => {
        if (idsUnicos.has(filho.id)) return false;
        idsUnicos.add(filho.id);
        return true;
      });
    }

    setArvore(raiz);
  };

  const toggleExpandir = (id) => {
    setExpandidos(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandirTodos = () => {
    const novosExpandidos = {};
    pessoas.forEach(p => {
      novosExpandidos[p.id] = true;
    });
    setExpandidos(novosExpandidos);
  };

  const recolherTodos = () => {
    const novosExpandidos = {};
    pessoas.forEach(p => {
      novosExpandidos[p.id] = false;
    });
    setExpandidos(novosExpandidos);
  };

  const handleEditar = (id) => {
    navigate(`/editar-pessoa/${id}`);
  };

  const handleDeletar = async (id, nome) => {
    if (window.confirm(`Tem certeza que deseja deletar ${nome}?`)) {
      try {
        await deletePessoa(id);
        alert('Pessoa deletada com sucesso!');
        carregarPessoas();
        setPessoaSelecionada(null);
      } catch (error) {
        console.error('Erro ao deletar:', error);
        alert('Erro ao deletar pessoa');
      }
    }
  };

  const RenderArvoreTeia = ({ nodes, nivel = 0 }) => {
    return (
      <div className="teia-nivel">
        {nodes.map((node, index) => {
          const temFilhos = node.filhos && node.filhos.length > 0;
          const estaExpandido = expandidos[node.id];
          const primeiroNome = getPrimeiroNome(node.nome_completo);
          
          return (
            <div key={node.id} className="teia-node-wrapper">
              <div className="teia-node">
                <div 
                  className={`teia-avatar ${pessoaSelecionada?.id === node.id ? 'selecionado' : ''}`}
                  onClick={() => setPessoaSelecionada(node)}
                >
                  {node.foto_url ? (
                    <img src={node.foto_url} alt={primeiroNome} />
                  ) : (
                    <div className="teia-avatar-placeholder">👤</div>
                  )}
                </div>
                <div className="teia-nome">{primeiroNome}</div>
                {temFilhos && (
                  <button 
                    className="teia-expandir"
                    onClick={(e) => { e.stopPropagation(); toggleExpandir(node.id); }}
                  >
                    {estaExpandido ? '−' : '+'}
                  </button>
                )}
              </div>
              
              {temFilhos && estaExpandido && (
                <div className="teia-conexoes">
                  <div className="teia-linha-vertical"></div>
                  <div className="teia-linha-horizontal"></div>
                  <div className="teia-filhos">
                    {node.filhos.map((filho, idx) => (
                      <div key={filho.id} className="teia-filho-item">
                        <div className="teia-linha-conexao-filho"></div>
                        <RenderArvoreTeia nodes={[filho]} nivel={nivel + 1} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout titulo="Minha Rede">
        <div className="loading">Carregando...</div>
      </Layout>
    );
  }

  return (
    <Layout titulo="Minha Rede">
      <div className="minha-rede-content">
        {!arvore ? (
          <div className="sem-registros">
            <p>Nenhum contato cadastrado ainda.</p>
            <button className="btn-primary" onClick={() => navigate('/cadastro-pessoa')}>
              Cadastrar primeiro contato
            </button>
          </div>
        ) : (
          <div className="teia-container">
            <div className="teia-raiz">
              <div 
                className={`teia-avatar-raiz ${pessoaSelecionada?.id === arvore.id ? 'selecionado' : ''}`}
                onClick={() => setPessoaSelecionada(arvore)}
              >
                {arvore.foto_url ? (
                  <img src={arvore.foto_url} alt={getPrimeiroNome(arvore.nome_completo)} />
                ) : (
                  <div className="teia-avatar-placeholder-raiz">👤</div>
                )}
                <div className="teia-nome-raiz">{getPrimeiroNome(arvore.nome_completo)}</div>
              </div>
              
              {arvore.filhos && arvore.filhos.length > 0 && (
                <>
                  <div className="teia-controles">
                    <button className="btn-expandir-todos" onClick={expandirTodos}>
                      Expandir Todos
                    </button>
                    <button className="btn-recolher-todos" onClick={recolherTodos}>
                      Recolher Todos
                    </button>
                  </div>
                  <div className="teia-linha-raiz-vertical"></div>
                  <div className="teia-linha-raiz-horizontal"></div>
                  <div className="teia-filhos-raiz">
                    {arvore.filhos.map((filho, index) => (
                      <div key={filho.id} className="teia-filho-raiz-item">
                        <div className="teia-linha-conexao-raiz"></div>
                        <RenderArvoreTeia nodes={[filho]} nivel={1} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {pessoaSelecionada && (
        <div className="modal-overlay" onClick={() => setPessoaSelecionada(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-fechar" onClick={() => setPessoaSelecionada(null)}>×</button>
            
            <div className="modal-foto">
              {pessoaSelecionada.foto_url ? (
                <img src={pessoaSelecionada.foto_url} alt={pessoaSelecionada.nome_completo} />
              ) : (
                <div className="modal-foto-placeholder">👤</div>
              )}
            </div>
            
            <h3>{pessoaSelecionada.nome_completo}</h3>
            <p><strong>CPF:</strong> {pessoaSelecionada.cpf}</p>
            <p><strong>Endereço:</strong> {pessoaSelecionada.endereco}</p>
            {pessoaSelecionada.titulo_eleitor && (
              <p><strong>Título:</strong> {pessoaSelecionada.titulo_eleitor} | Zona: {pessoaSelecionada.zona} | Sessão: {pessoaSelecionada.sessao}</p>
            )}
            
            <div className="modal-acoes">
              <button onClick={() => handleEditar(pessoaSelecionada.id)} className="btn-editar-modal">
                ✏️ Editar
              </button>
              <button onClick={() => handleDeletar(pessoaSelecionada.id, pessoaSelecionada.nome_completo)} className="btn-deletar-modal">
                🗑️ Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default MinhaRede;
