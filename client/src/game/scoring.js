// ── scoring.js ────────────────────────────────────────────────────────────────
//  Per-level stat tracking and grade calculation.
//  Import and call these from engine.js; results are passed to LevelTransition.
// ─────────────────────────────────────────────────────────────────────────────

let _levelStartTime = 0
let _damageDone     = 0
let _hitsTaken      = 0
let _killStyles     = []

export function startLevelTracking() {
    _levelStartTime = performance.now()
    _damageDone     = 0
    _hitsTaken      = 0
    _killStyles     = []
}

export function recordDamageDealt(damage) {
    _damageDone += damage
}

export function recordHitTaken() {
    _hitsTaken++
}

export function recordEnemyKill(enemyMaxHealth, timeToKillMs, levelTimeLimitMs) {
    const quickThreshold = levelTimeLimitMs * 0.35
    let style = 'normal'
    if (_hitsTaken === 0 && _killStyles.length === 0) style = 'flawless'
    else if (timeToKillMs < quickThreshold)            style = 'quick'
    _killStyles.push(style)
}

export function computeLevelGrade(timeLimitSec) {
    const elapsedSec = (performance.now() - _levelStartTime) / 1000

    const combatScore   = Math.round(_damageDone)
    const survivalScore = Math.max(0, Math.round(100 - _hitsTaken * 10))
    const speedRatio    = Math.min(1, elapsedSec / timeLimitSec)
    const speedScore    = Math.round(Math.max(0, (1 - speedRatio / 0.9) * 100))
    const styleKills    = _killStyles.filter(s => s !== 'normal').length
    const styleScore    = Math.min(100, styleKills * 35)
    const totalPoints   = combatScore + survivalScore + speedScore + styleScore

    const pct = totalPoints / 400 * 100
    let letter
    if (pct >= 90)      letter = 'S'
    else if (pct >= 75) letter = 'A'
    else if (pct >= 60) letter = 'B'
    else if (pct >= 45) letter = 'C'
    else if (pct >= 30) letter = 'D'
    else                letter = 'F'

    return {
        elapsedSec:    Math.round(elapsedSec),
        hitsTaken:     _hitsTaken,
        damageDone:    Math.round(_damageDone),
        combatScore,
        survivalScore,
        speedScore,
        styleScore,
        totalPoints,
        letter,
        styleKills:    _killStyles.filter(s => s !== 'normal'),
    }
}

export function elapsedSeconds() {
    if (_levelStartTime === 0) return 0
    return (performance.now() - _levelStartTime) / 1000
}