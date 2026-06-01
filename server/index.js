const express = require('express')
const cors    = require('cors')
const path    = require('path')

const app  = express()
const prod = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json())

// In production serve the React build; in dev Vite handles the frontend
if (prod) {
    const clientDist = path.join(__dirname, '../client/dist')
    app.use(express.static(clientDist))
}

app.use('/api/auth',   require('./routes/auth'))
app.use('/api/scores', require('./routes/scores'))

// Catch-all: return the React app for any non-API route
if (prod) {
    app.get('*', (_req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'))
    })
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Shinobi server → http://localhost:${PORT}`)
})
