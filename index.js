const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

c.fillRect(0, 0, canvas.width, canvas.height)

const gravity = 1.0

// ── State ────────────────────────────────
let background, shop, player, enemies, platforms = []
let roundOver = false
let gameActive = false
let score = 0

// ── Keys ─────────────────────────────────
const keys = {
    a: { pressed: false },
    d: { pressed: false }
}

// ── Menu ─────────────────────────────────
function showMenu() {
    gameActive = false

    clearTimeout(timerId)

    document.getElementById('mainMenu').style.display = 'flex'

    document.getElementById('displayText').style.display = 'none'
}

function startGame() {
    document.getElementById('mainMenu').style.display = 'none'
    document.getElementById('endGame').style.display = 'none'

    gameActive = true
    score = 0

    levelManager.reset()

    loadLevel(levelManager.getConfig())
}

function restartGame() {
    if (!gameActive) return

    clearTimeout(timerId)
    levelManager.transitioning = false
    levelManager.reset()
    score = 0
    loadLevel(levelManager.getConfig())
}

function showEndGame() {
    gameActive = false
    clearTimeout(timerId)
    document.getElementById('endScore').textContent = score + ' pts'
    document.getElementById('endGame').style.display = 'flex'
}

// ── Load a level from a config object ────
function loadLevel(config) {
    roundOver = false

    document.querySelector('#timer').innerHTML = config.timeLimit

    keys.a.pressed = false
    keys.d.pressed = false

    background = new Sprite({
        position: { x: 0, y: 0 },
        imageSrc: config.background.imageSrc
    })

    shop = new Sprite({
        position: {
            x: config.shop.x * (config.shop.scale / SHOP_BASE_SCALE),
            y: config.shop.y
        },
        imageSrc: config.shop.imageSrc,
        scale: config.shop.scale,
        frameMax: config.shop.frameMax,
        anchorBottom: true
    })

    player = new Fighter({ ...config.player, healthBarWidth: 140 })
    enemies = config.enemies.map((cfg, i) => {
        const defaults = config.enemyDefaults || {}
        const e = new Fighter({
            ...defaults,
            ...cfg,
            aiProfile: {
                ...(defaults.aiProfile || {}),
                ...(cfg.aiProfile || {})
            },
            homePosition: cfg.homePosition ?? { x: cfg.position.x, y: cfg.position.y },
            spriteDefaultFacing: cfg.spriteDefaultFacing ?? 'left',
            facing: cfg.facing ?? 'left'
        })
        e._aiCooldown = i * 20
        return e
    })

    platforms = (config.platforms || []).map(p => new Platform(p))

    const displayText = document.querySelector('#displayText')

    displayText.style.display = 'none'

    displayText.innerHTML = `
        Tie
        <div id="restartHint">press R for main menu</div>
    `

    decreaseTimer(config.timeLimit)
}

// ── Win / loss handler ───────────────────
function onRoundEnd() {
    if (roundOver || levelManager.transitioning) return

    roundOver = true

    clearTimeout(timerId)

    const allDead = enemies.every(e => e.health <= 0)

    if (allDead && player.health > 0 && levelManager.hasNextLevel()) {
        levelManager.nextLevel((nextConfig) => {
            loadLevel(nextConfig)
        })
    } else if (allDead && player.health > 0) {
        showEndGame()
    } else {
        determineWinner({ player, enemies, timerId })
    }
}

// ── Game loop ────────────────────────────
function animate() {
    window.requestAnimationFrame(animate)

    if (!gameActive) return

    c.fillStyle = 'black'
    c.fillRect(0, 0, canvas.width, canvas.height)

    background.update()
    shop.update()

    c.fillStyle = 'rgba(255, 255, 255, 0.17)'
    c.fillRect(0, 0, canvas.width, canvas.height)

    for (const platform of platforms) platform.draw()

    player.update()
    for (const e of enemies) e.update()

    player.velocity.x = 0

    // ── Player movement ──
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

    if (player.velocity.y < 0) {
        player.switchSprite('jump')
    } else if (player.velocity.y > 0) {
        player.switchSprite('fall')
    }

    // ── AI update ──
    for (const e of enemies) {
        if (!e.dead) e.updateAI(player)
    }

    // ── Collision: player hits an enemy ──
    if (player.isAttacking && player.image === player.sprites.attack1.image && player.frameCurrent === 4) {
        for (const e of enemies) {
            if (!e.dead && rectangularCollision({ rectangle1: player, rectangle2: e })) {
                const dmg = Math.min(player.hitDamage, Math.max(0, e.health))
                e.takeHit(player.hitDamage)
                score += dmg
                document.getElementById('score').textContent = score + ' pts'
            }
        }
        player.isAttacking = false
    }

    // ── Collision: each enemy hits player ──
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
        const allDead = enemies.every(e => e.health <= 0)
        if (allDead || player.health <= 0) {
            onRoundEnd()
        }
    }
}

// ── Input ────────────────────────────────
window.addEventListener('keydown', (event) => {

    // ENTER → start game from menu
    if (event.key === 'Enter') {
        if (!gameActive) {
            startGame()
            return
        }
    }

    // R → restart during game, or return to menu from end screen
    if (event.key === 'r' || event.key === 'R') {
        const displayText = document.querySelector('#displayText')
        const endGame = document.getElementById('endGame')

        if (endGame.style.display === 'flex') {
            endGame.style.display = 'none'
            showMenu()
            return
        }

        if (displayText.style.display === 'flex') {
            showMenu()
            return
        }

        if (gameActive) {
            restartGame()
            return
        }
    }

    // Block gameplay input if game inactive
    if (!gameActive) return

    // PLAYER
    if (!player.dead) {
        switch (event.key) {
            case 'd':
                keys.d.pressed = true
                player.lastKey = 'd'
                break

            case 'a':
                keys.a.pressed = true
                player.lastKey = 'a'
                break

            case 'w':
                player.velocity.y = -18
                break

            case ' ':
                player.attack()
                break
        }
    }

})

window.addEventListener('keyup', (event) => {

    if (!gameActive) return

    switch (event.key) {
        case 'd':
            keys.d.pressed = false
            break

        case 'a':
            keys.a.pressed = false
            break
    }
})

// ── Boot ─────────────────────────────────
animate()