const express = require('express')
const cors    = require('cors')
const path    = require('path')
const { init } = require('./db')

const app  = express()
const prod = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json())

if (prod) {
  const clientDist = path.join(__dirname, '../client/dist')
  app.use(express.static(clientDist))
}

app.use('/api/auth',   require('./routes/auth'))
app.use('/api/scores', require('./routes/scores'))

if (prod) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  })
}

const PORT = process.env.PORT || 3000

init()
  .then(() => {
    app.listen(PORT, () => console.log(`Shinobi server → http://localhost:${PORT}`))
  })
  .catch(err => {
    console.error('DB init failed:', err)
    process.exit(1)
  })
