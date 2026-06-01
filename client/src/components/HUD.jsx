import s from './HUD.module.css'

export default function HUD({ timer, score }) {
    return (
        <>
            <div className={s.timerWrap}>
                <div className={s.timer}>{timer}</div>
            </div>
            <div className={s.score}>{score} pts</div>
        </>
    )
}
