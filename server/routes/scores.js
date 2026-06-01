const express = require('express')
const jwt     = require('jsonwebtoken')
const db      = require('../db')

const router = express.Router()
const SECRET = process.env.JWT_SECRET || 'shinobi-dev-secret-change-in-prod'

function getUser(req) {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return null
    try {
        return jwt.verify(auth.slice(7), SECRET)
    } catch {
        return null
    }
}

// Submit a score — works for guests and logged-in users
router.post('/', (req, res) => {
    const { score, levelReached } = req.body || {}

    if (typeof score !== 'number' || typeof levelReached !== 'number')
        return res.status(400).json({ error: 'score and levelReached must be numbers' })

    const user = getUser(req)

    db.prepare('INSERT INTO runs (user_id, username, score, level_reached) VALUES (?, ?, ?, ?)')
        .run(user?.id ?? null, user?.username ?? 'Guest', score, levelReached)

    res.json({ ok: true })
})

// Global leaderboard — top 10 scores across all users
router.get('/leaderboard', (_req, res) => {
    const rows = db.prepare(`
        SELECT username, score, level_reached, played_at
        FROM   runs
        ORDER  BY score DESC
        LIMIT  10
    `).all()
    res.json(rows)
})

// Personal run history for the authenticated user
router.get('/me', (req, res) => {
    const user = getUser(req)
    if (!user) return res.status(401).json({ error: 'Not logged in' })

    const rows = db.prepare(`
        SELECT score, level_reached, played_at
        FROM   runs
        WHERE  user_id = ?
        ORDER  BY played_at DESC
        LIMIT  20
    `).all(user.id)

    res.json(rows)
})

module.exports = router
