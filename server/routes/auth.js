const express = require('express')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { pool } = require('../db')

const router = express.Router()
const SECRET = process.env.JWT_SECRET || 'shinobi-dev-secret-change-in-prod'

router.post('/register', async (req, res) => {
    const { username, password } = req.body || {}

    if (!username?.trim() || !password)
        return res.status(400).json({ error: 'Username and password required' })
    if (username.trim().length < 3)
        return res.status(400).json({ error: 'Username must be at least 3 characters' })
    if (password.length < 6)
        return res.status(400).json({ error: 'Password must be at least 6 characters' })

    const hash = bcrypt.hashSync(password, 10)

    try {
        const result = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
            [username.trim(), hash]
        )
        const user  = result.rows[0]
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '7d' })
        res.json({ token, username: user.username })
    } catch (err) {
        if (err.code === '23505')
            return res.status(409).json({ error: 'Username already taken' })
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

router.post('/login', async (req, res) => {
    const { username, password } = req.body || {}

    if (!username || !password)
        return res.status(400).json({ error: 'Username and password required' })

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
            [username.trim()]
        )
        const user = result.rows[0]

        if (!user || !bcrypt.compareSync(password, user.password_hash))
            return res.status(401).json({ error: 'Invalid username or password' })

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: '7d' })
        res.json({ token, username: user.username })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

module.exports = router
