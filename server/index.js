const express = require('express')
const cors    = require('cors')
const path    = require('path')
const { init } = require('./db')

const app = express()

app.use(cors())
app.use(express.json())

// Serve vanilla game from root directory
app.use(express.static(path.join(__dirname, '..')))

app.use('/api/auth',   require('./routes/auth'))
app.use('/api/scores', require('./routes/scores'))

// Fallback to index.html for SPA routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'))
})

const PORT = process.env.PORT || 3000

init()
  .then(() => {
    app.listen(PORT, () => console.log(`Shinobi server → http://localhost:${PORT}`))
  })
  .catch(err => {
    console.error('DB init failed:', err)
    process.exit(1)
  })
