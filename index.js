const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = 1024
canvas.height = 576

c.fillRect(0, 0, canvas.width, canvas.height)

const gravity = 1.0

// ── State ────────────────────────────────
let background, shop, player, enemy
let roundOver = false
let gameActive = false

// ── Keys ─────────────────────────────────
const keys = {
    a: { pressed: false },
    d: { pressed: false },
    h: { pressed: false },
    k: { pressed: false }
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
    keys.h.pressed = false
    keys.k.pressed = false

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
    enemy = new Fighter(config.enemy)

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

    if (
        enemy.health <= 0 &&
        player.health > 0 &&
        levelManager.hasNextLevel()
    ) {
        levelManager.nextLevel((nextConfig) => {
            loadLevel(nextConfig)
        })
    } else {
        determineWinner({ player, enemy, timerId })
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
    enemy.update()

    player.velocity.x = 0
    enemy.velocity.x = 0

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

    // ── Enemy movement ──
    if (keys.h.pressed && enemy.lastKey === 'h') {
        enemy.velocity.x = -7
        enemy.switchSprite('run')
    } else if (keys.k.pressed && enemy.lastKey === 'k') {
        enemy.velocity.x = 7
        enemy.switchSprite('run')
    } else {
        enemy.switchSprite('idle')
    }

    if (enemy.velocity.y < 0) {
        enemy.switchSprite('jump')
    } else if (enemy.velocity.y > 0) {
        enemy.switchSprite('fall')
    }

    // ── Collision: player hits enemy ──
    if (
        rectangularCollision({
            rectangle1: player,
            rectangle2: enemy
        }) &&
        player.isAttacking &&
        player.frameCurrent === 4
    ) {
        enemy.takeHit()

        player.isAttacking = false
    }

    if (player.isAttacking && player.frameCurrent === 4) {
        player.isAttacking = false
    }

    // ── Collision: enemy hits player ──
    if (
        rectangularCollision({
            rectangle1: enemy,
            rectangle2: player
        }) &&
        enemy.isAttacking &&
        enemy.frameCurrent === 2
    ) {
        enemy.isAttacking = false

        player.takeHit()
    }

    if (enemy.isAttacking && enemy.frameCurrent === 2) {
        enemy.isAttacking = false
    }

    // ── Check round over ──
    if (!roundOver && !levelManager.transitioning) {
        if (enemy.health <= 0 || player.health <= 0) {
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

    // ENEMY
    if (!enemy.dead) {
        switch (event.key) {
            case 'h':
                keys.h.pressed = true
                enemy.lastKey = 'h'
                break

            case 'k':
                keys.k.pressed = true
                enemy.lastKey = 'k'
                break

            case 'u':
                enemy.velocity.y = -18
                break

            case 'n':
                enemy.attack()
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

        case 'h':
            keys.h.pressed = false
            break

        case 'k':
            keys.k.pressed = false
            break
    }
})

// ── Boot ─────────────────────────────────
animate()