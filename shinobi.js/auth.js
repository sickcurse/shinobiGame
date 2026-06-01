// ── Auth & leaderboard module ─────────────────────────────────────────────────
;(function () {

const API = 'http://localhost:3000/api'

// ── State ─────────────────────────────────────────────────────────────────────
let _token    = localStorage.getItem('shinobiToken') || null
let _username = localStorage.getItem('shinobiUser')  || null
let _authMode = 'login'

// ── Public interface ──────────────────────────────────────────────────────────
window.Auth = {
    getToken:    () => _token,
    getUsername: () => _username,

    async submitScore(score, levelReached) {
        try {
            await _post('/scores', { score, levelReached })
        } catch { /* silent — game works offline */ }
    },

    showLeaderboard,
    init,
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
async function _post(path, body) {
    const res = await fetch(API + path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(_token ? { Authorization: 'Bearer ' + _token } : {})
        },
        body: JSON.stringify(body)
    })
    return res.json()
}

async function _get(path) {
    const res = await fetch(API + path, {
        headers: _token ? { Authorization: 'Bearer ' + _token } : {}
    })
    return res.json()
}

// ── Session ───────────────────────────────────────────────────────────────────
function _saveSession(token, username) {
    _token = token
    _username = username
    localStorage.setItem('shinobiToken', token)
    localStorage.setItem('shinobiUser', username)
}

function _clearSession() {
    _token = null
    _username = null
    localStorage.removeItem('shinobiToken')
    localStorage.removeItem('shinobiUser')
}

// ── Menu gate switching ───────────────────────────────────────────────────────
function _showAuthGate() {
    document.getElementById('authGate').style.display = 'flex'
    document.getElementById('playGate').style.display = 'none'
}

function _showPlayGate(name) {
    document.getElementById('authGate').style.display = 'none'
    document.getElementById('playGate').style.display = 'flex'
    document.getElementById('playGateName').textContent = name
        ? name.toUpperCase()
        : 'GUEST'
}

// ── Auth form ─────────────────────────────────────────────────────────────────
function _setError(msg) {
    document.getElementById('authError').textContent = msg
}

function _setTab(mode) {
    _authMode = mode
    document.getElementById('tabLogin').classList.toggle('active', mode === 'login')
    document.getElementById('tabRegister').classList.toggle('active', mode === 'register')
    document.getElementById('authSubmit').textContent = mode === 'login' ? 'LOGIN' : 'REGISTER'
    _setError('')
}

async function _handleAuthSubmit() {
    const username = document.getElementById('authUsername').value.trim()
    const password = document.getElementById('authPassword').value

    if (!username || !password) { _setError('Fill in all fields'); return }

    const btn = document.getElementById('authSubmit')
    btn.disabled = true
    btn.textContent = '...'

    try {
        const data = await _post(`/auth/${_authMode}`, { username, password })
        if (data.error) {
            _setError(data.error)
        } else {
            _saveSession(data.token, data.username)
            _showPlayGate(data.username)
        }
    } catch {
        _setError('Server unreachable')
    } finally {
        btn.disabled = false
        btn.textContent = _authMode === 'login' ? 'LOGIN' : 'REGISTER'
    }
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
async function showLeaderboard() {
    const overlay  = document.getElementById('leaderboard')
    const globalEl = document.getElementById('lbGlobal')
    const myRunsEl = document.getElementById('lbMyRuns')

    overlay.style.display = 'flex'
    globalEl.innerHTML    = '<div class="lbEmpty">loading...</div>'
    myRunsEl.innerHTML    = ''

    _switchLbTab('global')

    try {
        const rows = await _get('/scores/leaderboard')
        globalEl.innerHTML = _renderRows(rows, true)
    } catch {
        globalEl.innerHTML = '<div class="lbEmpty">unavailable</div>'
    }

    if (_token) {
        try {
            const rows = await _get('/scores/me')
            myRunsEl.innerHTML = _renderRows(rows, false)
        } catch {
            myRunsEl.innerHTML = '<div class="lbEmpty">unavailable</div>'
        }
    } else {
        myRunsEl.innerHTML = '<div class="lbEmpty">log in to see your runs</div>'
    }
}

function _switchLbTab(tab) {
    document.getElementById('lbTabGlobal').classList.toggle('active', tab === 'global')
    document.getElementById('lbTabMe').classList.toggle('active', tab === 'me')
    document.getElementById('lbGlobal').style.display  = tab === 'global' ? 'block' : 'none'
    document.getElementById('lbMyRuns').style.display  = tab === 'me'     ? 'block' : 'none'
}

function _renderRows(rows, showName) {
    if (!rows?.length) return '<div class="lbEmpty">no runs yet</div>'

    return rows.map((r, i) => {
        const date = r.played_at
            ? new Date(r.played_at * 1000).toLocaleDateString()
            : ''
        return `
            <div class="lbRow">
                ${showName ? `<span class="lbRank">#${i + 1}</span>` : `<span class="lbDate">${date}</span>`}
                ${showName ? `<span class="lbPlayer">${r.username}</span>` : ''}
                <span class="lbScore">${r.score} pts</span>
                <span class="lbLevel">lvl ${r.level_reached}</span>
            </div>`
    }).join('')
}

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
    if (_token && _username) {
        _showPlayGate(_username)
    } else {
        _showAuthGate()
    }

    document.getElementById('tabLogin').addEventListener('click', () => _setTab('login'))
    document.getElementById('tabRegister').addEventListener('click', () => _setTab('register'))

    document.getElementById('authSubmit').addEventListener('click', _handleAuthSubmit)
    document.getElementById('authUsername').addEventListener('keydown', e => {
        if (e.key === 'Enter') _handleAuthSubmit()
    })
    document.getElementById('authPassword').addEventListener('keydown', e => {
        if (e.key === 'Enter') _handleAuthSubmit()
    })

    document.getElementById('guestBtn').addEventListener('click', () => {
        _clearSession()
        _showPlayGate(null)
    })

    document.getElementById('logoutBtn').addEventListener('click', () => {
        _clearSession()
        _showAuthGate()
        document.getElementById('authUsername').value = ''
        document.getElementById('authPassword').value = ''
        _setError('')
    })

    document.getElementById('lbBtn').addEventListener('click', showLeaderboard)
    document.getElementById('lbBtnEnd').addEventListener('click', showLeaderboard)
    document.getElementById('lbClose').addEventListener('click', () => {
        document.getElementById('leaderboard').style.display = 'none'
    })
    document.getElementById('lbTabGlobal').addEventListener('click', () => _switchLbTab('global'))
    document.getElementById('lbTabMe').addEventListener('click', () => _switchLbTab('me'))
}

})()
