const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

c.fillRect(0, 0, canvas.width, canvas.height)

const gravity = 1.0

// ── State ────────────────────────────────
let background, shop, player, enemies
let roundOver = false
let gameActive = false

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

    gameActive = true

    levelManager.reset()

    loadLevel(levelManager.getConfig())
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
        position: { x: config.shop.x, y: config.shop.y },
        imageSrc: config.shop.imageSrc,
        scale: config.shop.scale,
        frameMax: config.shop.frameMax
    })

    player = new Fighter(config.player)
    enemies = config.enemies.map((cfg, i) => {
        const e = new Fighter(cfg)
        e._aiCooldown = i * 20
        return e
    })

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

    player.update()
    for (const e of enemies) e.update()

    player.velocity.x = 0

    // ── Player movement ──
    if (keys.a.pressed && player.lastKey === 'a') {
        player.velocity.x = -7
        player.switchSprite('run')
    } else if (keys.d.pressed && player.lastKey === 'd') {
        player.velocity.x = 7
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
    if (player.isAttacking && player.frameCurrent === 4) {
        for (const e of enemies) {
            if (rectangularCollision({ rectangle1: player, rectangle2: e })) {
                e.takeHit()
            }
        }
        player.isAttacking = false
    }

    // ── Collision: each enemy hits player ──
    for (const e of enemies) {
        if (e.isAttacking && e.frameCurrent === 2) {
            if (rectangularCollision({ rectangle1: e, rectangle2: player })) {
                player.takeHit()
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

    // R → return to menu
    if (event.key === 'r' || event.key === 'R') {
        const displayText = document.querySelector('#displayText')

        if (displayText.style.display === 'flex') {
            showMenu()
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