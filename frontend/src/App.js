import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Lazy Loading - carrega as páginas sob demanda
const Login = lazy(() => import('./pages/Login'));
const Cadastro = lazy(() => import('./pages/Cadastro'));
const CadastroConvite = lazy(() => import('./pages/CadastroConvite'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Usuario = lazy(() => import('./pages/Usuario'));
const MinhaRede = lazy(() => import('./pages/MinhaRede'));
const Mapa = lazy(() => import('./pages/Mapa'));
const CadastroPessoa = lazy(() => import('./pages/CadastroPessoa'));
const Convidar = lazy(() => import('./pages/Convidar'));
const EditarPessoa = lazy(() => import('./pages/EditarPessoa'));
const EditarPerfil = lazy(() => import('./pages/EditarPerfil'));
const AlterarCredenciais = lazy(() => import('./pages/AlterarCredenciais'));
const MapaEleitoral = lazy(() => import('./pages/MapaEleitoral'));

// Componente de loading enquanto carrega a página
const PageLoader = () => (
  <div className="page-loader">
    <div className="loading-spinner"></div>
    <p>Carregando...</p>
  </div>
);

function App() {
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="App">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/cadastro-convite/:conviteId" element={<CadastroConvite />} />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/usuario" element={
              <PrivateRoute>
                <Usuario />
              </PrivateRoute>
            } />
            <Route path="/minha-rede" element={
              <PrivateRoute>
                <MinhaRede />
              </PrivateRoute>
            } />
            <Route path="/mapa" element={
              <PrivateRoute>
                <Mapa />
              </PrivateRoute>
            } />
            <Route path="/cadastro-pessoa" element={
              <PrivateRoute>
                <CadastroPessoa />
              </PrivateRoute>
            } />
            <Route path="/convidar" element={
              <PrivateRoute>
                <Convidar />
              </PrivateRoute>
            } />
            <Route path="/editar-pessoa/:id" element={
              <PrivateRoute>
                <EditarPessoa />
              </PrivateRoute>
            } />
            <Route path="/editar-perfil/:id" element={
              <PrivateRoute>
                <EditarPerfil />
              </PrivateRoute>
            } />
            <Route path="/alterar-credenciais" element={
              <PrivateRoute>
                <AlterarCredenciais />
              </PrivateRoute>
            } />
            <Route path="/mapa-eleitoral" element={
              <PrivateRoute>
                <MapaEleitoral />
              </PrivateRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
