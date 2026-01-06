const router = require('express').Router();

router.get('/status', (req, res) => {
    res.json({ status: 'Auth service is up and running' });
});

router.post('/login', (req, res) => {
    // Placeholder for login logic
    res.json({ message: 'Login endpoint' });
});

module.exports = router;