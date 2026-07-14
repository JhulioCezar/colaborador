const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Importar rotas
const authRoutes = require('./auth');
const pessoasRoutes = require('./pessoas');
const convitesRoutes = require('./convites');
const uploadRoutes = require('./upload');

// Usar rotas
app.use('/api/auth', authRoutes);
app.use('/api/pessoas', pessoasRoutes);
app.use('/api/convites', convitesRoutes);
app.use('/api/upload', uploadRoutes);

// Rota de teste
app.get('/api/teste', (req, res) => {
    res.json({ mensagem: 'API funcionando!' });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
