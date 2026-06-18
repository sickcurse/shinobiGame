import { useState, useRef, useCallback } from 'react'
import useAuth from './hooks/useAuth.js'
import GameCanvas       from './components/GameCanvas.jsx'
import Menu             from './components/Menu.jsx'
import HUD              from './components/HUD.jsx'
import LevelGrade       from './components/LevelGrade.jsx'
import EndScreen        from './components/EndScreen.jsx'
import EndGame          from './components/EndGame.jsx'
import Leaderboard      from './components/Leaderboard.jsx'
import MobileControls   from './components/MobileControls.jsx'
import RotatePrompt     from './components/RotatePrompt.jsx'

// phase: 'menu' | 'playing' | 'gameover' | 'victory'

export default function App() {
    const auth = useAuth()

    // null = auth gate; string (incl. '') = play gate ('' = guest)
    const [menuUser,    setMenuUser]    = useState(() =>
        localStorage.getItem('shinobiToken') ? localStorage.getItem('shinobiUser') : null
    )

    const [phase,       setPhase]       = useState('menu')
    const [score,       setScore]       = useState(0)
    const [timer,       setTimer]       = useState(0)
    const [transition,  setTransition]  = useState(null)   // { level, name, grade, done } | null
    const [gameResult,  setGameResult]  = useState(null)   // 'win'|'loss'|'tie'
    const [showLb,      setShowLb]      = useState(false)

    const engineRef = useRef({})

    // ── Auth actions ──────────────────────────────────────────────────────────
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

    // ── Game actions ──────────────────────────────────────────────────────────
    const handlePlay = useCallback(() => {
        setScore(0)
        setTimer(0)
        engineRef.current.startGame?.()
    }, [])

    const handleMenu = useCallback(() => setPhase('menu'), [])

    // ── Engine callbacks ──────────────────────────────────────────────────────
    const onScore = useCallback((s) => setScore(s), [])
    const onTimer = useCallback((t) => setTimer(t), [])
    const onPhase = useCallback((p) => setPhase(p), [])

    const onTransition = useCallback((level, name, grade, done) => {
        setTransition({ level, name, grade, done })
    }, [])

    const handleGradeContinue = useCallback(() => {
        const done = transition?.done
        setTransition(null)
        done?.()
    }, [transition])

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
        <div style={{ position: 'relative', display: 'inline-block', background: 'black' }}>
            {/* Always-visible canvas — game loop runs here */}
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

            {/* Amber overlay for atmosphere */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'rgba(255,196,80,0.12)', mixBlendMode: 'soft-light', zIndex: 5,
            }} />

            {/* HUD — visible while playing, hidden during grade card */}
            {phase === 'playing' && !transition && <HUD timer={timer} score={score} />}

            {/* Mobile touch controls — hidden during grade card */}
            {phase === 'playing' && !transition && <MobileControls />}

            {/* Level grade card — shown between levels */}
            {transition && (
                <LevelGrade
                    level={transition.level}
                    name={transition.name}
                    grade={transition.grade}
                    onContinue={handleGradeContinue}
                />
            )}

            {/* Main menu */}
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

            {/* Game over (loss / tie) */}
            {phase === 'gameover' && (
                <EndScreen result={gameResult} onMenu={handleMenu} />
            )}

            {/* Victory */}
            {phase === 'victory' && (
                <EndGame
                    score={score}
                    onMenu={handleMenu}
                    onLeaderboard={() => setShowLb(true)}
                />
            )}

            {/* Leaderboard modal */}
            {showLb && (
                <Leaderboard
                    onClose={() => setShowLb(false)}
                    fetchGlobal={auth.fetchLeaderboard}
                    fetchMine={auth.fetchMyRuns}
                    hasAccount={!!auth.token}
                />
            )}

            {/* Portrait nudge — CSS shows this only on touch + portrait */}
            <RotatePrompt />
        </div>
    )
}