import { useState, useEffect } from 'react'
import s from './Leaderboard.module.css'

export default function Leaderboard({ onClose, fetchGlobal, fetchMine, hasAccount }) {
    const [tab,    setTab]    = useState('global')
    const [global, setGlobal] = useState(null)
    const [mine,   setMine]   = useState(null)

    useEffect(() => {
        fetchGlobal().then(setGlobal)
        if (hasAccount) fetchMine().then(setMine)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        function handler(e) { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    function renderRows(rows, showName) {
        if (!rows) return <div className={s.empty}>loading...</div>
        if (!rows.length) return <div className={s.empty}>no runs yet</div>
        return rows.map((r, i) => (
            <div key={i} className={s.row}>
                {showName
                    ? <span className={s.rank}>#{i + 1}</span>
                    : <span className={s.date}>{new Date(r.played_at * 1000).toLocaleDateString()}</span>
                }
                {showName && <span className={s.player}>{r.username}</span>}
                <span className={s.score}>{r.score} pts</span>
                <span className={s.level}>lvl {r.level_reached}</span>
            </div>
        ))
    }

    return (
        <div className={s.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className={s.panel}>
                <div className={s.title}>LEADERBOARD</div>

                <div className={s.tabs}>
                    <button className={`${s.tab} ${tab === 'global' ? s.active : ''}`} onClick={() => setTab('global')}>GLOBAL</button>
                    <button className={`${s.tab} ${tab === 'mine'   ? s.active : ''}`} onClick={() => setTab('mine')}>MY RUNS</button>
                </div>

                <div className={s.content}>
                    {tab === 'global'
                        ? renderRows(global, true)
                        : hasAccount
                            ? renderRows(mine, false)
                            : <div className={s.empty}>log in to see your runs</div>
                    }
                </div>

                <button className={s.close} onClick={onClose}>CLOSE</button>
            </div>
        </div>
    )
}
