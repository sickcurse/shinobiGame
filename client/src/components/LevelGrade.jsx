import { useEffect, useState } from 'react'
import s from './LevelGrade.module.css'

const GRADE_COLORS = {
    S: '#ffd700',
    A: '#818CF8',
    B: '#4ade80',
    C: '#facc15',
    D: '#fb923c',
    F: '#f87171',
}

function Bar({ label, value, max = 100, delay = 0 }) {
    const [width, setWidth] = useState(0)
    const pct = Math.round((value / max) * 100)

    useEffect(() => {
        const t = setTimeout(() => setWidth(pct), delay)
        return () => clearTimeout(t)
    }, [pct, delay])

    return (
        <div className={s.barRow}>
            <span className={s.barLabel}>{label}</span>
            <div className={s.barTrack}>
                <div className={s.barFill} style={{ width: `${width}%` }} />
            </div>
            <span className={s.barVal}>{value}</span>
        </div>
    )
}

function formatTime(sec) {
    const m = Math.floor(sec / 60)
    const ss = sec % 60
    return `${m}:${String(ss).padStart(2, '0')}`
}

export default function LevelGrade({ level, name, grade, onContinue }) {
    const [visible, setVisible] = useState(false)
    const color = GRADE_COLORS[grade?.letter] ?? '#fff'

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 60)
        return () => clearTimeout(t)
    }, [])

    useEffect(() => {
        function handler(e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onContinue() }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onContinue])

    if (!grade) return null

    const styleTagline = grade.styleKills.length > 0
        ? grade.styleKills.map(k => k === 'flawless' ? 'FLAWLESS' : 'QUICK KILL').join(' · ')
        : null

    return (
        <div className={`${s.overlay} ${visible ? s.visible : ''}`}>
            <div className={s.panel}>

                <div className={s.header}>
                    <div className={s.levelTag}>LEVEL {level} COMPLETE</div>
                    <div className={s.levelName}>{name}</div>
                </div>

                <div className={s.gradeWrap}>
                    <div className={s.gradeLetter} style={{ color, textShadow: `0 0 30px ${color}88` }}>
                        {grade.letter}
                    </div>
                    <div className={s.gradeTotal}>{grade.totalPoints} pts</div>
                </div>

                <div className={s.statsRow}>
                    <div className={s.stat}>
                        <span className={s.statVal}>{formatTime(grade.elapsedSec)}</span>
                        <span className={s.statLabel}>CLEAR TIME</span>
                    </div>
                    <div className={s.statDivider} />
                    <div className={s.stat}>
                        <span className={s.statVal}>{grade.hitsTaken}</span>
                        <span className={s.statLabel}>HITS TAKEN</span>
                    </div>
                    <div className={s.statDivider} />
                    <div className={s.stat}>
                        <span className={s.statVal}>{grade.damageDone}</span>
                        <span className={s.statLabel}>DMG DEALT</span>
                    </div>
                </div>

                <div className={s.bars}>
                    <Bar label="COMBAT"   value={grade.combatScore}   delay={200} />
                    <Bar label="SURVIVAL" value={grade.survivalScore} delay={360} />
                    <Bar label="SPEED"    value={grade.speedScore}    delay={520} />
                    <Bar label="STYLE"    value={grade.styleScore}    delay={680} />
                </div>

                {styleTagline && (
                    <div className={s.styleTag}>{styleTagline}</div>
                )}

                <div className={s.continue} onClick={onContinue}>
                    press enter to continue
                </div>

            </div>
        </div>
    )
}