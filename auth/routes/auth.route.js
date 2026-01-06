const router = require('express').Router();

router.get('/status', (req, res) => {
    res.json({ status: 'Auth service is up and running' });
});

module.exports = router;