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
import { comboTracker } from './combo.js'

let cb = {}

let background, shop, player, enemies
let roundOver  = false
let gameActive = false
let score      = 0

// combo display state
let _comboDisplay = null   // { name, count, timer }

const _killedEnemies = new WeakSet()
let _hudInterval = null

const keys = { a: { pressed: false }, d: { pressed: false } }

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
    _stopHud()
    levelManager.transitioning = false
    levelManager.reset()
    score = 0
    cb.onScore?.(0)
    comboTracker.reset()
    loadLevel(levelManager.getConfig())
}

// ── Level loading ─────────────────────────────────────────────────────────────
function loadLevel(config) {
    roundOver = false
    keys.a.pressed = false
    keys.d.pressed = false
    comboTracker.reset()
    _comboDisplay = null

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

// ── HUD stopwatch ─────────────────────────────────────────────────────────────
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

// ── Process a player hit on an enemy ─────────────────────────────────────────
function processPlayerHit(enemy, type) {
    const baseDmg    = type === 'H' ? player.hitDamage * 1.8 : player.hitDamage
    const blocked    = enemy.isBlockingHit(player.attackBox)

    const { mult, comboName, hitCount } = comboTracker.registerHit(type)

    if (blocked && type !== 'H') {
        // light blocked — chip only
        enemy.takeHit(Math.floor(baseDmg * 0.1), true)
        return
    }

    if (blocked && type === 'H') {
        // heavy breaks block
        enemy.isBlocking = false
        enemy.takeHit(Math.floor(baseDmg * 0.5), true)
        return
    }

    const finalDmg = baseDmg * mult
    const dmg      = Math.min(finalDmg, Math.max(0, enemy.health))
    enemy.takeHit(finalDmg)
    recordDamageDealt(dmg)

    // juggle — pull enemy inward so they stay in combo range
    if (hitCount > 1 && !enemy.dying && !enemy.dead) {
        const pull = comboTracker.jugglePush(player.facing)
        enemy.velocity.x = pull * 0.18   // gentle constant pull each frame
    }

    // heavy knockback (only if not in a combo chain)
    if (type === 'H' && hitCount <= 1) {
        enemy.velocity.x = enemy.position.x < player.position.x ? 8 : -8
    }

    if (comboName) {
        _comboDisplay = { name: comboName, count: hitCount, timer: 90 }
        cb.onCombo?.({ name: comboName, count: hitCount })
    }

    if (enemy.health <= 0 && !_killedEnemies.has(enemy)) {
        _killedEnemies.add(enemy)
        recordEnemyKill(
            enemy.maxHealth,
            elapsedSeconds() * 1000,
            levelManager.getConfig().timeLimit * 1000
        )
    }

    score += Math.round(dmg)
    cb.onScore?.(score)
}

// ── Draw combo name on canvas ─────────────────────────────────────────────────
function drawComboDisplay() {
    if (!_comboDisplay) return
    _comboDisplay.timer--
    if (_comboDisplay.timer <= 0) { _comboDisplay = null; return }

    const alpha = Math.min(1, _comboDisplay.timer / 20)
    const { c }  = ctx

    c.save()
    c.globalAlpha = alpha
    c.font        = 'bold 20px monospace'
    c.fillStyle   = '#ffd700'
    c.textAlign   = 'center'
    c.fillText(
        `${_comboDisplay.name}  x${_comboDisplay.count}`,
        ctx.canvas.width / 2,
        80
    )
    c.restore()
}

// ── Round end ─────────────────────────────────────────────────────────────────
function endRound() {
    if (roundOver || levelManager.transitioning) return
    roundOver = true
    _stopHud()
    comboTracker.reset()

    const allEnemiesDown = enemies.every(e => e.dying || e.dead)
    const playerDown     = player.dying || player.dead
    const playerWon      = allEnemiesDown && !playerDown

    const grade = computeLevelGrade(levelManager.getConfig().timeLimit)
    score += grade.totalPoints
    cb.onScore?.(score)

    if (playerWon && levelManager.hasNextLevel()) {
        waitForDeathAnims(enemies, () => {
            levelManager.nextLevel(
                (nextConfig) => loadLevel(nextConfig),
                (level, name, done) => cb.onTransition?.(level, name, grade, done)
            )
        })
    } else if (playerWon) {
        waitForDeathAnims(enemies, () => {
            gameActive = false
            cb.onVictory?.(score)
            cb.onSubmitScore?.(score, levelManager.currentLevel)
        })
    } else {
        waitForDeathAnims([player], () => {
            gameActive = false
            const result = playerDown && !allEnemiesDown ? 'loss' : 'tie'
            cb.onGameOver?.(result)
            cb.onSubmitScore?.(score, levelManager.currentLevel)
        })
    }
}

function waitForDeathAnims(fighters, callback) {
    const dying = fighters.filter(f => f.dying || f.dead)
    if (dying.length === 0) { callback(); return }
    function check() {
        if (dying.every(f => f.dead)) callback()
        else requestAnimationFrame(check)
    }
    requestAnimationFrame(check)
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

    comboTracker.tick()
    drawComboDisplay()

    // ── Player movement ──
    if (!player.dying && !player.dead) {
        if (!player.isBlocking) {
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
        } else {
            player.velocity.x = 0
        }
    }

    // ── AI ──
    for (const e of enemies) { if (!e.dead && !e.dying) e.updateAI(player) }

    // ── Player light attack ──
    if (player.isAttackingLight && player.frameCurrent === 4 &&
        player.image === player.sprites.attack1.image) {
        player.isAttackingLight = false
        player.isAttacking      = false
        for (const e of enemies) {
            if (!e.dying && !e.dead && rectangularCollision({ rectangle1: player, rectangle2: e })) {
                processPlayerHit(e, 'L')
            }
        }
    }

    // ── Player heavy attack ──
    const heavyImage = player.sprites.attack2
        ? player.sprites.attack2.image
        : player.sprites.attack1.image
    if (player.isAttackingHeavy && player.frameCurrent === 4 &&
        player.image === heavyImage) {
        player.isAttackingHeavy = false
        player.isAttacking      = false
        for (const e of enemies) {
            if (!e.dying && !e.dead && rectangularCollision({ rectangle1: player, rectangle2: e })) {
                processPlayerHit(e, 'H')
            }
        }
    }

    // ── Enemy hits player ──
    for (const e of enemies) {
        if (e.isAttacking && e.frameCurrent === 2 &&
            e.image === e.sprites.attack1.image) {
            e.isAttacking = false
            if (!player.dying && !player.dead &&
                rectangularCollision({ rectangle1: e, rectangle2: player })) {
                if (!player.isBlockingHit(e.attackBox)) {
                    player.takeHit(e.hitDamage)
                    recordHitTaken()
                    comboTracker.reset()   // taking a hit breaks your combo
                } else {
                    player.takeHit(Math.floor(e.hitDamage * 0.1), true)
                }
            }
        }
    }

    // ── Check round over ──
    if (!roundOver && !levelManager.transitioning) {
        const allEnemiesDown = enemies.every(e => e.dying || e.dead)
        const playerDown     = player.dying || player.dead
        if (allEnemiesDown || playerDown) endRound()
    }
}

// ── Keyboard input ────────────────────────────────────────────────────────────
export function onKeyDown(e) {
    if (!gameActive || !player) return
    if (!player.dead && !player.dying) {
        switch (e.key) {
            case 'd': keys.d.pressed = true;  player.lastKey = 'd'; break
            case 'a': keys.a.pressed = true;  player.lastKey = 'a'; break
            case 'w': player.velocity.y = -18; break
            case 'j': e.preventDefault(); player.lightAttack(); break
            case 'k': e.preventDefault(); player.heavyAttack(); break
            case 'l': player.blockStart(); break
            case ' ': e.preventDefault(); player.lightAttack(); break
        }
    }
    if ((e.key === 'r' || e.key === 'R') && gameActive) restartGame()
}

export function onKeyUp(e) {
    if (!gameActive) return
    if (e.key === 'd') keys.d.pressed = false
    if (e.key === 'a') keys.a.pressed = false
    if (e.key === 'l' && player) player.blockEnd()
}

// ── Touch / mobile ────────────────────────────────────────────────────────────
export function pressKey(key) {
    if (!gameActive || !player || player.dead || player.dying) return
    if (key === 'a') { keys.a.pressed = true; player.lastKey = 'a' }
    if (key === 'd') { keys.d.pressed = true; player.lastKey = 'd' }
}

export function releaseKey(key) {
    if (key === 'a') keys.a.pressed = false
    if (key === 'd') keys.d.pressed = false
}

export function touchJump() {
    if (!gameActive || !player || player.dead || player.dying) return
    player.velocity.y = -18
}

export function touchLightAttack() {
    if (!gameActive || !player || player.dead || player.dying) return
    player.lightAttack()
}

export function touchHeavyAttack() {
    if (!gameActive || !player || player.dead || player.dying) return
    player.heavyAttack()
}

export function touchBlockStart() {
    if (!gameActive || !player || player.dead || player.dying) return
    player.blockStart()
}

export function touchBlockEnd() {
    if (!gameActive || !player) return
    player.blockEnd()
}