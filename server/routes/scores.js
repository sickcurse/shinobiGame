const express = require('express')
const jwt     = require('jsonwebtoken')
const { pool } = require('../db')

const router = express.Router()
const SECRET = process.env.JWT_SECRET || 'shinobi-dev-secret-change-in-prod'

function getUser(req) {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return null
    try { return jwt.verify(auth.slice(7), SECRET) }
    catch { return null }
}

router.post('/', async (req, res) => {
    const { score, levelReached } = req.body || {}

    if (typeof score !== 'number' || typeof levelReached !== 'number')
        return res.status(400).json({ error: 'score and levelReached must be numbers' })

    const user = getUser(req)

    try {
        await pool.query(
            'INSERT INTO runs (user_id, username, score, level_reached) VALUES ($1, $2, $3, $4)',
            [user?.id ?? null, user?.username ?? 'Guest', score, levelReached]
        )
        res.json({ ok: true })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

router.get('/leaderboard', async (_req, res) => {
    try {
        const result = await pool.query(`
            SELECT username, score, level_reached, played_at
            FROM   runs
            ORDER  BY score DESC
            LIMIT  10
        `)
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

router.get('/me', async (req, res) => {
    const user = getUser(req)
    if (!user) return res.status(401).json({ error: 'Not logged in' })

    try {
        const result = await pool.query(`
            SELECT score, level_reached, played_at
            FROM   runs
            WHERE  user_id = $1
            ORDER  BY played_at DESC
            LIMIT  20
        `, [user.id])
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

module.exports = router
