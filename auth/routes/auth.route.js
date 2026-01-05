const router = require('express').Router();

router.get('/status', (req, res) => {
    res.json({ status: 'Auth service is up and running' });
});

router.post('/login', (req, res) => {
    // Placeholder for login logic
    res.json({ message: 'Login endpoint' });
});

router.post('/register', (req, res) => {
    // Placeholder for registration logic
    res.json({ message: 'Register endpoint' });
});

module.exports = router;