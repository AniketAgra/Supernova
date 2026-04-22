const jwt = require('jsonwebtoken');

// Returns an array suitable for Supertest's .set('Cookie', ...)
// Default cookie name is 'token'; adjust if your app expects a different name.
function getAuthCookie({ userId = '696a0d0c134178021ca96f6e', extra = { role: "user" } } = {}) {
    const secret = process.env.JWT_SECRET || 'test-secret';
    const payload = { id: userId, ...extra };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    const cookieName = process.env.JWT_COOKIE_NAME || 'token';
    return [ `${cookieName}=${token}` ];
}

module.exports = { getAuthCookie };