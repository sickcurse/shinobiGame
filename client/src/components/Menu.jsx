import { useEffect } from 'react'
import AuthGate from './AuthGate.jsx'
import PlayGate from './PlayGate.jsx'
import s from './Menu.module.css'

export default function Menu({ username, onLogin, onRegister, onGuest, onPlay, onLogout, onLeaderboard }) {
    const authed = username !== null  // null = not decided; string = logged in; '' = guest

    // Enter key starts the game when play gate is visible
    useEffect(() => {
        if (authed) {
            function handler(e) { if (e.key === 'Enter') onPlay() }
            window.addEventListener('keydown', handler)
            return () => window.removeEventListener('keydown', handler)
        }
    }, [authed, onPlay])

    return (
        <div className={s.overlay}>
            <div className={s.title}>Butterfly Nightmare</div>
            <div className={s.subtitle}>1 player vs ai</div>
            <hr className={s.divider} />

            {authed
                ? <PlayGate
                    username={username}
                    onPlay={onPlay}
                    onLogout={onLogout}
                    onLeaderboard={onLeaderboard}
                  />
                : <AuthGate
                    onLogin={onLogin}
                    onRegister={onRegister}
                    onGuest={onGuest}
                  />
            }
        </div>
    )
}
