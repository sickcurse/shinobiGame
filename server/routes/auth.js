const express = require('express')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const db      = require('../db')

const router = express.Router()
const SECRET = process.env.JWT_SECRET || 'shinobi-dev-secret-change-in-prod'

router.post('/register', (req, res) => {
    const { username, password } = req.body || {}

    if (!username?.trim() || !password)
        return res.status(400).json({ error: 'Username and password required' })
    if (username.trim().length < 3)
        return res.status(400).json({ error: 'Username must be at least 3 characters' })
    if (password.length < 6)
        return res.status(400).json({ error: 'Password must be at least 6 characters' })

    const hash = bcrypt.hashSync(password, 10)

    try {
        const result = db
            .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
            .run(username.trim(), hash)

        const token = jwt.sign(
            { id: result.lastInsertRowid, username: username.trim() },
            SECRET,
            { expiresIn: '7d' }
        )
        res.json({ token, username: username.trim() })
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE')
            return res.status(409).json({ error: 'Username already taken' })
        res.status(500).json({ error: 'Server error' })
    }
})

router.post('/login', (req, res) => {
    const { username, password } = req.body || {}

    if (!username || !password)
        return res.status(400).json({ error: 'Username and password required' })

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim())

    if (!user || !bcrypt.compareSync(password, user.password_hash))
        return res.status(401).json({ error: 'Invalid username or password' })

    const token = jwt.sign(
        { id: user.id, username: user.username },
        SECRET,
        { expiresIn: '7d' }
    )
    res.json({ token, username: user.username })
})

module.exports = router
