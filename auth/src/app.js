const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('../routes/auth.route');

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Auth Service is running');
});

// Auth routes
app.use('/auth', authRoutes);

module.exports = app;