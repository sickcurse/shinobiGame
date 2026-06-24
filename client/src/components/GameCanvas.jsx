import { useEffect, useRef, useState } from 'react'
import { init, startGame, restartGame, onKeyDown, onKeyUp } from '../game/engine.js'

const CANVAS_W = 1024
const CANVAS_H = 576

function computeScale() {
    return Math.min(
        window.innerWidth  / CANVAS_W,
        window.innerHeight / CANVAS_H
    )
}

export default function GameCanvas({ phase, onScore, onTimer, onPhase, onTransition, onVictory, onGameOver, onSubmitScore, onCombo, engineRef }) {
    const canvasRef = useRef(null)
    const ready     = useRef(false)
    const [scale, setScale] = useState(computeScale)

    engineRef.current = { startGame, restartGame }

    useEffect(() => {
        if (ready.current) return
        ready.current = true
        init(canvasRef.current, { onScore, onTimer, onPhase, onTransition, onVictory, onGameOver, onSubmitScore, onCombo })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup',   onKeyUp)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup',   onKeyUp)
        }
    }, [])

    useEffect(() => {
        function update() { setScale(computeScale()) }
        window.addEventListener('resize', update)
        window.addEventListener('orientationchange', () => setTimeout(update, 100))
        return () => {
            window.removeEventListener('resize', update)
            window.removeEventListener('orientationchange', update)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                display: 'block',
                width:  scale * CANVAS_W,
                height: scale * CANVAS_H,
                touchAction: 'none',
                filter: 'sepia(0.45) saturate(1.25) hue-rotate(8deg) brightness(1.06) contrast(1.04)',
            }}
        />
    )
}