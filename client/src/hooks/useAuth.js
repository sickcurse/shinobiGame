import { useState, useCallback } from 'react'

const API = '/api'

async function apiFetch(path, { method = 'GET', body, token } = {}) {
    const res = await fetch(API + path, {
        method,
        headers: {
            ...(body  ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: 'Bearer ' + token }   : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    })
    return res.json()
}

export default function useAuth() {
    const [token,    setToken]    = useState(() => localStorage.getItem('shinobiToken') || null)
    const [username, setUsername] = useState(() => localStorage.getItem('shinobiUser')  || null)

    const saveSession = useCallback((t, u) => {
        setToken(t); setUsername(u)
        localStorage.setItem('shinobiToken', t)
        localStorage.setItem('shinobiUser',  u)
    }, [])

    const clearSession = useCallback(() => {
        setToken(null); setUsername(null)
        localStorage.removeItem('shinobiToken')
        localStorage.removeItem('shinobiUser')
    }, [])

    const login = useCallback(async (u, p) => {
        const data = await apiFetch('/auth/login', { method: 'POST', body: { username: u, password: p } })
        if (data.error) return data.error
        saveSession(data.token, data.username)
        return null
    }, [saveSession])

    const register = useCallback(async (u, p) => {
        const data = await apiFetch('/auth/register', { method: 'POST', body: { username: u, password: p } })
        if (data.error) return data.error
        saveSession(data.token, data.username)
        return null
    }, [saveSession])

    const logout = useCallback(() => clearSession(), [clearSession])

    const submitScore = useCallback(async (score, levelReached) => {
        try {
            await apiFetch('/scores', { method: 'POST', body: { score, levelReached }, token })
        } catch { /* silent */ }
    }, [token])

    const fetchLeaderboard = useCallback(() =>
        apiFetch('/scores/leaderboard').catch(() => []), [])

    const fetchMyRuns = useCallback(() => token
        ? apiFetch('/scores/me', { token }).catch(() => [])
        : Promise.resolve([]),
    [token])

    return { token, username, login, register, logout, submitScore, fetchLeaderboard, fetchMyRuns }
}
