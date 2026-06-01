import s from './PlayGate.module.css'

const isTouch = typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0)

export default function PlayGate({ username, onPlay, onLogout, onLeaderboard }) {
    return (
        <div className={s.gate}>
            <div className={s.name}>{username ? username.toUpperCase() : 'GUEST'}</div>

            <div className={s.controls}>
                {isTouch ? (
                    <>
                        <span>◀ ▶</span> move &nbsp; <span>JUMP</span> jump &nbsp; <span>ATK</span> attack
                    </>
                ) : (
                    <>
                        <span>PLAYER</span> &nbsp; A / D move &nbsp; W jump &nbsp; SPACE attack
                        <br />
                        <span>R</span> restart during game
                    </>
                )}
            </div>

            <div className={s.prompt} onClick={onPlay}>
                {isTouch ? 'tap to play' : 'press enter to play'}
            </div>

            <div className={s.actions}>
                <button className={s.lbBtn} onClick={onLeaderboard}>LEADERBOARD</button>
                <button className={s.logoutBtn} onClick={onLogout}>
                    logout / switch user
                </button>
            </div>
        </div>
    )
}
