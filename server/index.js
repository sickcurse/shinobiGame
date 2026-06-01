const express = require('express')
const cors    = require('cors')
const path    = require('path')

const app = express()

app.use(cors())
app.use(express.json())

// Serve the game's static files from the project root
app.use(express.static(path.join(__dirname, '..')))

app.use('/api/auth',   require('./routes/auth'))
app.use('/api/scores', require('./routes/scores'))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Shinobi server → http://localhost:${PORT}`)
})
