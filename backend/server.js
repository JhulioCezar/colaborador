const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// CONFIGURAÇÃO DO CORS (CORRETA)
// ============================================
app.use(cors({
  origin: [
    'https://colaborador-frontend.onrender.com',
    'https://colaborador.jhuliosolucoes.com.br',
    'http://localhost:3000'
  ],
  credentials: true
}));

// ============================================
// MIDDLEWARES
// ============================================
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// ROTAS
// ============================================
const authRoutes = require('./auth');
const pessoasRoutes = require('./pessoas');
const convitesRoutes = require('./convites');
const uploadRoutes = require('./upload');

app.use('/api/auth', authRoutes);
app.use('/api/pessoas', pessoasRoutes);
app.use('/api/convites', convitesRoutes);
app.use('/api/upload', uploadRoutes);

// ============================================
// ROTA DE TESTE
// ============================================
app.get('/api/teste', (req, res) => {
    res.json({ mensagem: 'API funcionando!' });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
