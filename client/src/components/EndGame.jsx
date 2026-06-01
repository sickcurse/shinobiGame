import { useEffect } from 'react'
import s from './EndGame.module.css'

export default function EndGame({ score, onMenu, onLeaderboard }) {
    useEffect(() => {
        function handler(e) { if (e.key === 'r' || e.key === 'R') onMenu() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onMenu])

    return (
        <div className={s.overlay}>
            <div className={s.title}>VICTORY</div>
            <div className={s.label}>total score</div>
            <div className={s.score}>{score} pts</div>
            <button className={s.lbBtn} onClick={onLeaderboard}>LEADERBOARD</button>
            <div className={s.hint} onClick={onMenu}>press R for main menu</div>
        </div>
    )
}
