import { useState, useRef, useCallback } from 'react'
import useAuth from './hooks/useAuth.js'
import GameCanvas       from './components/GameCanvas.jsx'
import Menu             from './components/Menu.jsx'
import HUD              from './components/HUD.jsx'
import LevelTransition  from './components/LevelTransition.jsx'
import EndScreen        from './components/EndScreen.jsx'
import EndGame          from './components/EndGame.jsx'
import Leaderboard      from './components/Leaderboard.jsx'
import MobileControls   from './components/MobileControls.jsx'

// phase: 'menu' | 'playing' | 'gameover' | 'victory'

export default function App() {
    const auth = useAuth()

    const [menuUser,    setMenuUser]    = useState(() =>
        localStorage.getItem('shinobiToken') ? localStorage.getItem('shinobiUser') : null
    )

    const [phase,       setPhase]       = useState('menu')
    const [score,       setScore]       = useState(0)
    const [timer,       setTimer]       = useState(60)
    const [transition,  setTransition]  = useState(null)
    const [gameResult,  setGameResult]  = useState(null)
    const [showLb,      setShowLb]      = useState(false)

    const engineRef = useRef({})

    const handleLogin = useCallback(async (u, p) => {
        const err = await auth.login(u, p)
        if (!err) setMenuUser(u)
        return err
    }, [auth])

    const handleRegister = useCallback(async (u, p) => {
        const err = await auth.register(u, p)
        if (!err) setMenuUser(u)
        return err
    }, [auth])

    const handleGuest = useCallback(() => setMenuUser(''), [])

    const handleLogout = useCallback(() => {
        auth.logout()
        setMenuUser(null)
    }, [auth])

    const handlePlay = useCallback(() => {
        setScore(0)
        engineRef.current.startGame?.()
    }, [])

    const handleMenu = useCallback(() => setPhase('menu'), [])

    const onScore  = useCallback((s) => setScore(s),  [])
    const onTimer  = useCallback((t) => setTimer(t),  [])
    const onPhase  = useCallback((p) => setPhase(p),  [])

    const onTransition = useCallback((level, name, done) => {
        setTransition({ level, name })
        setTimeout(() => {
            setTransition(null)
            done()
        }, 2400)
    }, [])

    const onVictory = useCallback((finalScore) => {
        setScore(finalScore)
        setPhase('victory')
    }, [])

    const onGameOver = useCallback((result) => {
        setGameResult(result)
        setPhase('gameover')
    }, [])

    const onSubmitScore = useCallback((s, lvl) => {
        auth.submitScore(s, lvl)
    }, [auth])

    return (
        // Full-viewport stage. Everything UI (menus, overlays, controls) is
        // positioned against THIS, not the canvas — so it has real room to
        // breathe and scroll regardless of how small/letterboxed the canvas
        // renders at a given orientation.
        <div
            style={{
                position: 'relative',
                width: '100vw',
                height: '100dvh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'black',
                overflow: 'hidden',
            }}
        >
            {/* Canvas + the overlays that are visually "painted on" the scene */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
                <GameCanvas
                    phase={phase}
                    onScore={onScore}
                    onTimer={onTimer}
                    onPhase={onPhase}
                    onTransition={onTransition}
                    onVictory={onVictory}
                    onGameOver={onGameOver}
                    onSubmitScore={onSubmitScore}
                    engineRef={engineRef}
                />

                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: 'rgba(255,196,80,0.12)', mixBlendMode: 'soft-light', zIndex: 5,
                }} />

                {phase === 'playing' && <HUD timer={timer} score={score} />}
            </div>

            {/* Touch controls are pinned to the physical screen edges (not the
                canvas), so they stay thumb-reachable whether the canvas is
                full-bleed (landscape) or letterboxed (portrait). */}
            {phase === 'playing' && <MobileControls />}

            {transition && <LevelTransition level={transition.level} name={transition.name} />}

            {phase === 'menu' && (
                <Menu
                    username={menuUser}
                    onLogin={handleLogin}
                    onRegister={handleRegister}
                    onGuest={handleGuest}
                    onPlay={handlePlay}
                    onLogout={handleLogout}
                    onLeaderboard={() => setShowLb(true)}
                />
            )}

            {phase === 'gameover' && (
                <EndScreen result={gameResult} onMenu={handleMenu} />
            )}

            {phase === 'victory' && (
                <EndGame
                    score={score}
                    onMenu={handleMenu}
                    onLeaderboard={() => setShowLb(true)}
                />
            )}

            {showLb && (
                <Leaderboard
                    onClose={() => setShowLb(false)}
                    fetchGlobal={auth.fetchLeaderboard}
                    fetchMine={auth.fetchMyRuns}
                    hasAccount={!!auth.token}
                />
            )}
        </div>
    )
}