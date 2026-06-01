import { useEffect } from 'react'
import s from './EndScreen.module.css'

export default function EndScreen({ result, onMenu }) {
    useEffect(() => {
        function handler(e) { if (e.key === 'r' || e.key === 'R') onMenu() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onMenu])

    const label = result === 'loss' ? 'You Lose' : result === 'win' ? 'Player Wins' : 'Tie'

    return (
        <div className={s.overlay}>
            <div className={s.label}>{label}</div>
            <div className={s.hint} onClick={onMenu}>press R for main menu</div>
        </div>
    )
}
