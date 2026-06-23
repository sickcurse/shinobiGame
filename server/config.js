const SECRET = process.env.JWT_SECRET

if (!SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production')
    }
    console.warn('⚠ JWT_SECRET not set — using insecure dev default')
}

module.exports = { SECRET: SECRET || 'shinobi-dev-secret-change-in-prod' }
