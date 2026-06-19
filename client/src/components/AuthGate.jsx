import { useState } from 'react'
import s from './AuthGate.module.css'

export default function AuthGate({ onLogin, onRegister, onGuest }) {
    const [mode,     setMode]     = useState('login')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error,    setError]    = useState('')
    const [loading,  setLoading]  = useState(false)

    async function submit() {
        if (!username.trim() || !password) { setError('Fill in all fields'); return }
        setLoading(true); setError('')
        const err = mode === 'login'
            ? await onLogin(username.trim(), password)
            : await onRegister(username.trim(), password)
        setLoading(false)
        if (err) setError(err)
    }

    function switchMode(m) { setMode(m); setError('') }

    return (
        <div className={s.gate}>
            <div className={s.tabs}>
                <button className={`${s.tab} ${mode === 'login'    ? s.active : ''}`} onClick={() => switchMode('login')}>Back Again</button>
                <button className={`${s.tab} ${mode === 'register' ? s.active : ''}`} onClick={() => switchMode('register')}>Sign in Blood</button>
            </div>

            <div className={s.fields}>
                <input
                    className={s.input}
                    type="text"
                    placeholder="username"
                    maxLength={20}
                    autoComplete="off"
                    spellCheck={false}
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                />
                <input
                    className={s.input}
                    type="password"
                    placeholder="password"
                    maxLength={64}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                />
                <div className={s.error}>{error}</div>
                <button className={s.btn} onClick={submit} disabled={loading}>
                    {loading ? '...' : mode === 'login' ? 'Back Again' : 'Sign in Blood'}
                </button>
            </div>

            <div className={s.or}>— or —</div>
            <button className={s.guestBtn} onClick={onGuest}>Play as a Guest</button>
        </div>
    )
}
