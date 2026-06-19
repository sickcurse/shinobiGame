import { useState, useRef } from 'react'
import s from './AuthGate.module.css'

export default function AuthGate({ onLogin, onRegister, onGuest }) {
    const [mode,     setMode]     = useState('login') // null | 'login' | 'register'
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error,    setError]    = useState('')
    const [loading,  setLoading]  = useState(false)
    const userRef = useRef(null)

    function selectTab(m) {
        if (mode === m) { setMode(null); return } // tap active tab again to collapse
        setMode(m)
        setError('')
        setTimeout(() => userRef.current?.focus(), 260) // after the expand animation
    }

    async function submit() {
        if (!mode) return
        if (!username.trim() || !password) { setError('Fill in all fields'); return }
        setLoading(true); setError('')
        const err = mode === 'login'
            ? await onLogin(username.trim(), password)
            : await onRegister(username.trim(), password)
        setLoading(false)
        if (err) setError(err)
    }

    return (
        <div className={s.gate}>
            <div className={s.tabs}>
                <button
                    className={`${s.tab} ${mode === 'login' ? s.active : ''}`}
                    onClick={() => selectTab('login')}
                >LOGIN</button>
                <button
                    className={`${s.tab} ${mode === 'register' ? s.active : ''}`}
                    onClick={() => selectTab('register')}
                >REGISTER</button>
            </div>

            <div className={`${s.fieldsWrap} ${mode ? s.open : ''}`}>
                <div className={s.fieldsInner}>
                    <div className={s.fields}>
                        <input
                            ref={userRef}
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
                            {loading ? '...' : mode === 'login' ? 'LOGIN' : 'REGISTER'}
                        </button>
                    </div>
                </div>
            </div>

            <div className={s.or}>— or —</div>
            <button className={s.guestBtn} onClick={onGuest}>PLAY AS GUEST</button>
        </div>
    )
}