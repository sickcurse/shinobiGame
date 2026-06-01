const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, 'shinobi.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS runs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER,
    username      TEXT NOT NULL,
    score         INTEGER NOT NULL,
    level_reached INTEGER NOT NULL,
    played_at     INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_runs_score ON runs (score DESC);
  CREATE INDEX IF NOT EXISTS idx_runs_user  ON runs (user_id);
`)

module.exports = db
