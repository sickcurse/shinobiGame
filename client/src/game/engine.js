import ctx, { setupCanvas } from './ctx.js'
import { Sprite, Fighter, Platform, rectangularCollision, SHOP_BASE_SCALE } from './classes.js'
import { levelManager } from './levelManager.js'
import {
    startLevelTracking,
    recordDamageDealt,
    recordHitTaken,
    recordEnemyKill,
    computeLevelGrade,
    elapsedSeconds,
} from './scoring.js'

let cb = {}

let background, shop, player, enemies
let roundOver   = false
let gameActive  = false
let score       = 0

const _killedEnemies = new WeakSet()
let _hudInterval = null

const keys = {
    a:     { pressed: false },
    d:     { pressed: false },
    up:    { pressed: false },
    down:  { pressed: false },
    block: { pressed: false },
}

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
    _stopHud()
    levelManager.transitioning = false
    levelManager.reset()
    score = 0
    cb.onScore?.(0)
    loadLevel(levelManager.getConfig())
}

function loadLevel(config) {
    roundOver = false
    keys.a.pressed     = false
    keys.d.pressed     = false
    keys.up.pressed    = false
    keys.down.pressed  = false
    keys.block.pressed = false

    background = new Sprite({ position: { x: 0, y: 0 }, imageSrc: config.background.imageSrc })

    shop = new Sprite({
        position:    { x: config.shop.x * (config.shop.scale / SHOP_BASE_SCALE), y: config.shop.y },
        imageSrc:    config.shop.imageSrc,
        scale:       config.shop.scale,
        frameMax:    config.shop.frameMax,
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

    startLevelTracking()
    _startHud()

    cb.onPhase?.('playing')
    cb.onTimer?.(0)
}

function _startHud() {
    _stopHud()
    _hudInterval = setInterval(() => {
        if (!gameActive || roundOver || levelManager.transitioning) return
        cb.onTimer?.(Math.floor(elapsedSeconds()))
    }, 250)
}

function _stopHud() {
    if (_hudInterval) { clearInterval(_hudInterval); _hudInterval = null }
}

function endRound() {
    if (roundOver || levelManager.transitioning) return
    roundOver = true
    _stopHud()

    const allDead   = enemies.every(e => e.health <= 0)
    const playerWon = allDead && player.health > 0

    const grade = computeLevelGrade(levelManager.getConfig().timeLimit)
    score += grade.totalPoints
    cb.onScore?.(score)

    if (playerWon && levelManager.hasNextLevel()) {
        levelManager.nextLevel(
            (nextConfig) => loadLevel(nextConfig),
            (level, name, done) => cb.onTransition?.(level, name, grade, done)
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
    if (!player.isBlocking) {
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
    } else {
        player.switchSprite('block')
    }

    if (player.velocity.y < 0) player.switchSprite('jump')
    else if (player.velocity.y > 0) player.switchSprite('fall')

    // ── Block state ──
    player.isBlocking = keys.block.pressed && !player.isAttacking

    // ── AI ──
    for (const e of enemies) { if (!e.dead) e.updateAI(player) }

    // ── Player light attack (A button) hits enemy ──
    if (player.isAttackingLight && player.frameCurrent === 4) {
        for (const e of enemies) {
            if (!e.dead && rectangularCollision({ rectangle1: player, rectangle2: e })) {
                if (!e.isBlocking) {
                    const dmg = Math.min(player.hitDamage, Math.max(0, e.health))
                    e.takeHit(player.hitDamage)
                    recordDamageDealt(dmg)
                    if (e.health <= 0 && !_killedEnemies.has(e)) {
                        _killedEnemies.add(e)
                        recordEnemyKill(e.maxHealth, elapsedSeconds() * 1000, levelManager.getConfig().timeLimit * 1000)
                    }
                } else {
                    // blocked — small chip damage
                    e.takeHit(Math.floor(player.hitDamage * 0.1))
                }
            }
        }
        player.isAttackingLight = false
    }

    // ── Player heavy attack (B button) hits enemy ──
    if (player.isAttackingHeavy && player.frameCurrent === 4) {
        for (const e of enemies) {
            if (!e.dead && rectangularCollision({ rectangle1: player, rectangle2: e })) {
                if (!e.isBlocking) {
                    const dmg = Math.min(player.hitDamage * 1.8, Math.max(0, e.health))
                    e.takeHit(player.hitDamage * 1.8)
                    recordDamageDealt(dmg)
                    // heavy attacks knock back
                    e.velocity.x = e.position.x < player.position.x ? 8 : -8
                    if (e.health <= 0 && !_killedEnemies.has(e)) {
                        _killedEnemies.add(e)
                        recordEnemyKill(e.maxHealth, elapsedSeconds() * 1000, levelManager.getConfig().timeLimit * 1000)
                    }
                } else {
                    // heavy breaks block — deal half damage anyway
                    e.isBlocking = false
                    e.takeHit(Math.floor(player.hitDamage * 0.5))
                }
            }
        }
        player.isAttackingHeavy = false
    }

    // ── Enemy hits player ──
    for (const e of enemies) {
        if (e.isAttacking && e.image === e.sprites.attack1.image && e.frameCurrent === 2) {
            if (rectangularCollision({ rectangle1: e, rectangle2: player })) {
                if (!player.isBlocking) {
                    player.takeHit(e.hitDamage)
                    recordHitTaken()
                } else {
                    // blocked — still chip
                    player.takeHit(Math.floor(e.hitDamage * 0.1))
                }
            }
            e.isAttacking = false
        }
    }

    // ── Check round over ──
    if (!roundOver && !levelManager.transitioning) {
        if (enemies.every(e => e.health <= 0) || player.health <= 0) endRound()
    }
}

// ── Keyboard input ────────────────────────────────────────────────────────────
export function onKeyDown(e) {
    if (!gameActive || !player) return

    if (!player.dead) {
        switch (e.key) {
            case 'd':           keys.d.pressed = true;     player.lastKey = 'd'; break
            case 'a':           keys.a.pressed = true;     player.lastKey = 'a'; break
            case 'w':           player.velocity.y = -18;   break
            case 'ArrowUp':     keys.up.pressed = true;    break
            case 'ArrowDown':   keys.down.pressed = true;  break
            case 'j':           // A button — light attack
                e.preventDefault()
                player.lightAttack()
                break
            case 'k':           // B button — heavy attack
                e.preventDefault()
                player.heavyAttack()
                break
            case 'l':           // block
                keys.block.pressed = true
                break
            case ' ':           // keep space as light for keyboard players
                e.preventDefault()
                player.lightAttack()
                break
        }
    }

    if ((e.key === 'r' || e.key === 'R') && gameActive) restartGame()
}

export function onKeyUp(e) {
    if (!gameActive) return
    switch (e.key) {
        case 'd':         keys.d.pressed     = false; break
        case 'a':         keys.a.pressed     = false; break
        case 'ArrowUp':   keys.up.pressed    = false; break
        case 'ArrowDown': keys.down.pressed  = false; break
        case 'l':         keys.block.pressed = false; break
    }
}

// ── Touch / mobile ────────────────────────────────────────────────────────────
export function pressKey(key) {
    if (!gameActive || !player || player.dead) return
    if (key === 'a') { keys.a.pressed = true; player.lastKey = 'a' }
    if (key === 'd') { keys.d.pressed = true; player.lastKey = 'd' }
}

export function releaseKey(key) {
    if (key === 'a') keys.a.pressed = false
    if (key === 'd') keys.d.pressed = false
}

export function touchJump() {
    if (!gameActive || !player || player.dead) return
    player.velocity.y = -18
}

export function touchLightAttack() {
    if (!gameActive || !player || player.dead) return
    player.lightAttack()
}

export function touchHeavyAttack() {
    if (!gameActive || !player || player.dead) return
    player.heavyAttack()
}

export function touchBlockStart() {
    if (!gameActive || !player || player.dead) return
    keys.block.pressed = true
}

export function touchBlockEnd() {
    keys.block.pressed = false
}