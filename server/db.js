const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

async function init() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id            SERIAL PRIMARY KEY,
            username      TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at    INTEGER DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER
        );

        CREATE TABLE IF NOT EXISTS runs (
            id            SERIAL PRIMARY KEY,
            user_id       INTEGER REFERENCES users(id),
            username      TEXT NOT NULL,
            score         INTEGER NOT NULL,
            level_reached INTEGER NOT NULL,
            played_at     INTEGER DEFAULT EXTRACT(EPOCH FROM NOW())::INTEGER
        );

        CREATE INDEX IF NOT EXISTS idx_runs_score ON runs (score DESC);
        CREATE INDEX IF NOT EXISTS idx_runs_user  ON runs (user_id);
    `)
}

module.exports = { pool, init }
