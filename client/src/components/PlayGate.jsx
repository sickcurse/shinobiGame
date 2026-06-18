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
                        <span>◀ ▶</span> move &nbsp; <span>JUMP</span> jump &nbsp; <span>A</span> light &nbsp; <span>B</span> heavy &nbsp; <span>BLK</span> block
                    </>
                ) : (
                    <>
                        <span>A / D</span> move &nbsp; <span>W</span> jump
                        <br />
                        <span>J</span> light attack &nbsp; <span>K</span> heavy attack &nbsp; <span>L</span> block
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