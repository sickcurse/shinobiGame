import s from './HUD.module.css'

function formatTime(totalSec) {
    const m = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return `${m}:${String(sec).padStart(2, '0')}`
}

export default function HUD({ timer, score }) {
    return (
        <>
            <div className={s.timerWrap}>
                <div className={s.timerLabel}>TIME</div>
                <div className={s.timer}>{formatTime(timer)}</div>
            </div>
            <div className={s.score}>{score} pts</div>
        </>
    )
}