import ctx, { setupCanvas } from './ctx.js'
import { Sprite, Fighter, Platform, rectangularCollision, SHOP_BASE_SCALE } from './classes.js'
import { levelManager } from './levelManager.js'

// ── Callbacks wired in by GameCanvas ─────────────────────────────────────────
let cb = {}

// ── Game state ────────────────────────────────────────────────────────────────
let background, shop, player, enemies, timerId
let roundOver   = false
let gameActive  = false
let score       = 0
const keys      = { a: { pressed: false }, d: { pressed: false } }

// ── Public API ────────────────────────────────────────────────────────────────
export function init(canvasEl, callbacks) {
    setupCanvas(canvasEl)
    cb = callbacks
    requestAnimationFrame(loop)
}

export function startGame() {
    gameActive = true
    score      = 0
    cb.onScore?.(0)
    levelManager.reset()
    loadLevel(levelManager.getConfig())
}

export function restartGame() {
    if (!gameActive) return
    clearTimeout(timerId)
    levelManager.transitioning = false
    levelManager.reset()
    score = 0
    cb.onScore?.(0)
    loadLevel(levelManager.getConfig())
}

// ── Level loading ─────────────────────────────────────────────────────────────
function loadLevel(config) {
    roundOver = false
    keys.a.pressed = false
    keys.d.pressed = false

    background = new Sprite({ position: { x: 0, y: 0 }, imageSrc: config.background.imageSrc })

    shop = new Sprite({
        position:  { x: config.shop.x * (config.shop.scale / SHOP_BASE_SCALE), y: config.shop.y },
        imageSrc:  config.shop.imageSrc,
        scale:     config.shop.scale,
        frameMax:  config.shop.frameMax,
        anchorBottom: true,
    })

    player  = new Fighter({ ...config.player, healthBarWidth: 140 })
    enemies = config.enemies.map((cfg, i) => {
        const defaults = config.enemyDefaults || {}
        const e = new Fighter({
            ...defaults,
            ...cfg,
            aiProfile: { ...(defaults.aiProfile || {}), ...(cfg.aiProfile || {}) },
            homePosition:        cfg.homePosition        ?? { x: cfg.position.x, y: cfg.position.y },
            spriteDefaultFacing: cfg.spriteDefaultFacing ?? 'left',
            facing:              cfg.facing              ?? 'left',
        })
        e._aiCooldown = i * 20
        return e
    })

    ctx.platforms = (config.platforms || []).map(p => new Platform(p))

    cb.onPhase?.('playing')
    startTimer(config.timeLimit)
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer(startTime) {
    clearTimeout(timerId)
    let t = startTime
    cb.onTimer?.(t)

    function tick() {
        if (levelManager.transitioning) return
        if (t > 0) {
            timerId = setTimeout(tick, 1000)
            t--
            cb.onTimer?.(t)
        }
        if (t === 0) endRound()
    }
    tick()
}

// ── Round end ─────────────────────────────────────────────────────────────────
function endRound() {
    if (roundOver || levelManager.transitioning) return
    roundOver = true
    clearTimeout(timerId)

    const allDead   = enemies.every(e => e.health <= 0)
    const playerWon = allDead && player.health > 0

    if (playerWon && levelManager.hasNextLevel()) {
        levelManager.nextLevel(
            (nextConfig) => loadLevel(nextConfig),
            (level, name, done) => cb.onTransition?.(level, name, done)
        )
    } else if (playerWon) {
        gameActive = false
        cb.onVictory?.(score)
        cb.onSubmitScore?.(score, levelManager.currentLevel)
    } else {
        gameActive = false
        const result = player.health <= 0 ? 'loss' : 'tie'
        cb.onGameOver?.(result)
        cb.onSubmitScore?.(score, levelManager.currentLevel)
    }
}

// ── Game loop ─────────────────────────────────────────────────────────────────
function loop() {
    requestAnimationFrame(loop)
    if (!gameActive) return

    const { c, canvas } = ctx

    c.fillStyle = 'black'
    c.fillRect(0, 0, canvas.width, canvas.height)

    background.update()
    shop.update()

    c.fillStyle = 'rgba(255,255,255,0.17)'
    c.fillRect(0, 0, canvas.width, canvas.height)

    for (const p of ctx.platforms) p.draw()

    player.update()
    for (const e of enemies) e.update()

    // ── Player movement ──
    player.velocity.x = 0
    if (keys.a.pressed && player.lastKey === 'a') {
        player.velocity.x = -7
        player.facing = 'left'
        player.switchSprite('run')
    } else if (keys.d.pressed && player.lastKey === 'd') {
        player.velocity.x = 7
        player.facing = 'right'
        player.switchSprite('run')
    } else {
        player.switchSprite('idle')
    }
    if (player.velocity.y < 0) player.switchSprite('jump')
    else if (player.velocity.y > 0) player.switchSprite('fall')

    // ── AI ──
    for (const e of enemies) { if (!e.dead) e.updateAI(player) }

    // ── Player hits enemy ──
    if (player.isAttacking && player.image === player.sprites.attack1.image && player.frameCurrent === 4) {
        for (const e of enemies) {
            if (!e.dead && rectangularCollision({ rectangle1: player, rectangle2: e })) {
                const dmg = Math.min(player.hitDamage, Math.max(0, e.health))
                e.takeHit(player.hitDamage)
                score += dmg
                cb.onScore?.(score)
            }
        }
        player.isAttacking = false
    }

    // ── Enemy hits player ──
    for (const e of enemies) {
        if (e.isAttacking && e.image === e.sprites.attack1.image && e.frameCurrent === 2) {
            if (rectangularCollision({ rectangle1: e, rectangle2: player })) {
                player.takeHit(e.hitDamage)
            }
            e.isAttacking = false
        }
    }

    // ── Check round over ──
    if (!roundOver && !levelManager.transitioning) {
        if (enemies.every(e => e.health <= 0) || player.health <= 0) endRound()
    }
}

// ── Input handlers (called by GameCanvas) ─────────────────────────────────────
export function onKeyDown(e) {
    if (!gameActive || !player) return
    if (!player.dead) {
        switch (e.key) {
            case 'd': keys.d.pressed = true;  player.lastKey = 'd'; break
            case 'a': keys.a.pressed = true;  player.lastKey = 'a'; break
            case 'w': player.velocity.y = -18; break
            case ' ': e.preventDefault(); player.attack(); break
        }
    }
    if ((e.key === 'r' || e.key === 'R') && gameActive) restartGame()
}

export function onKeyUp(e) {
    if (!gameActive) return
    if (e.key === 'd') keys.d.pressed = false
    if (e.key === 'a') keys.a.pressed = false
}
