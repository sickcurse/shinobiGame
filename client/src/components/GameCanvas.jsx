import { useEffect, useRef } from 'react'
import { init, startGame, restartGame, onKeyDown, onKeyUp } from '../game/engine.js'

export default function GameCanvas({ phase, onScore, onTimer, onPhase, onTransition, onVictory, onGameOver, onSubmitScore, engineRef }) {
    const canvasRef = useRef(null)
    const ready     = useRef(false)

    // Expose imperative actions to parent
    engineRef.current = { startGame, restartGame }

    useEffect(() => {
        if (ready.current) return
        ready.current = true

        init(canvasRef.current, {
            onScore,
            onTimer,
            onPhase,
            onTransition,
            onVictory,
            onGameOver,
            onSubmitScore,
        })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup',   onKeyUp)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup',   onKeyUp)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                display: 'block',
                filter: 'sepia(0.45) saturate(1.25) hue-rotate(8deg) brightness(1.06) contrast(1.04)',
            }}
        />
    )
}
