// ─────────────────────────────────────────
//  levelManager.js
//  Handles level configs, loading, and transitions
// ─────────────────────────────────────────

const levelConfigs = {
    1: {
        name: 'The Dojo',
        background: { imageSrc: './img/background.png' },
        shop: { imageSrc: './img/shop.png', x: 600, y: 128, scale: 2.75, frameMax: 6 },
        timeLimit: 60,
        player: {
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            imageSrc: './img/samuraiMack/Idle.png',
            frameMax: 8,
            scale: 2.5,
            offset: { x: 215, y: 157 },
            sprites: {
                idle:    { imageSrc: './img/samuraiMack/Idle.png',                        frameMax: 8 },
                run:     { imageSrc: './img/samuraiMack/Run.png',                         frameMax: 8 },
                jump:    { imageSrc: './img/samuraiMack/Jump.png',                        frameMax: 2 },
                fall:    { imageSrc: './img/samuraiMack/Fall.png',                        frameMax: 2 },
                attack1: { imageSrc: './img/samuraiMack/Attack1.png',                     frameMax: 6 },
                takeHit: { imageSrc: './img/samuraiMack/Take Hit - white silhouette.png', frameMax: 4 },
                death:   { imageSrc: './img/samuraiMack/Death.png',                       frameMax: 6 }
            },
            attackBox: { offset: { x: 100, y: 60 }, width: 160, height: 50 }
        },
        enemy: {
            position: { x: 400, y: 100 },
            velocity: { x: 0, y: 0 },
            color: 'blue',
            imageSrc: './img/kenji/Idle.png',
            frameMax: 4,
            scale: 2.5,
            offset: { x: 215, y: 167 },
            sprites: {
                idle:    { imageSrc: './img/kenji/Idle.png',      frameMax: 4 },
                run:     { imageSrc: './img/kenji/Run.png',        frameMax: 8 },
                jump:    { imageSrc: './img/kenji/Jump.png',       frameMax: 2 },
                fall:    { imageSrc: './img/kenji/Fall.png',       frameMax: 2 },
                attack1: { imageSrc: './img/kenji/Attack1.png',    frameMax: 4 },
                takeHit: { imageSrc: './img/kenji/Take Hit.png',   frameMax: 3 },
                death:   { imageSrc: './img/kenji/Death.png',      frameMax: 7 }
            },
            attackBox: { offset: { x: -170, y: 50 }, width: 170, height: 50 }
        }
    },

    // ── Level 2 placeholder ──────────────────
    // Swap in new imageSrc paths when you have assets.
    // Everything else (positions, attackBox, timeLimit) can be tuned per level.
    2: {
        name: 'The Rooftop',
        background: { imageSrc: './img/background.png' },   // replace with rooftop bg
        shop:       { imageSrc: './img/shop.png', x: 600, y: 128, scale: 2.75, frameMax: 6 },
        timeLimit: 45,                                        // tighter time limit
        player: {
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            imageSrc: './img/samuraiMack/Idle.png',
            frameMax: 8,
            scale: 2.5,
            offset: { x: 215, y: 157 },
            sprites: {
                idle:    { imageSrc: './img/samuraiMack/Idle.png',                        frameMax: 8 },
                run:     { imageSrc: './img/samuraiMack/Run.png',                         frameMax: 8 },
                jump:    { imageSrc: './img/samuraiMack/Jump.png',                        frameMax: 2 },
                fall:    { imageSrc: './img/samuraiMack/Fall.png',                        frameMax: 2 },
                attack1: { imageSrc: './img/samuraiMack/Attack1.png',                     frameMax: 6 },
                takeHit: { imageSrc: './img/samuraiMack/Take Hit - white silhouette.png', frameMax: 4 },
                death:   { imageSrc: './img/samuraiMack/Death.png',                       frameMax: 6 }
            },
            attackBox: { offset: { x: 100, y: 60 }, width: 160, height: 50 }
        },
        enemy: {
            position: { x: 400, y: 100 },
            velocity: { x: 0, y: 0 },
            color: 'blue',
            imageSrc: './img/kenji/Idle.png',           // replace with new enemy sprites
            frameMax: 4,
            scale: 2.5,
            offset: { x: 215, y: 167 },
            sprites: {
                idle:    { imageSrc: './img/kenji/Idle.png',      frameMax: 4 },
                run:     { imageSrc: './img/kenji/Run.png',        frameMax: 8 },
                jump:    { imageSrc: './img/kenji/Jump.png',       frameMax: 2 },
                fall:    { imageSrc: './img/kenji/Fall.png',       frameMax: 2 },
                attack1: { imageSrc: './img/kenji/Attack1.png',    frameMax: 4 },
                takeHit: { imageSrc: './img/kenji/Take Hit.png',   frameMax: 3 },
                death:   { imageSrc: './img/kenji/Death.png',      frameMax: 7 }
            },
            attackBox: { offset: { x: -170, y: 50 }, width: 170, height: 50 }
        }
    },

    // ── Level 3 placeholder ──────────────────
    3: {
        name: 'The Shrine',
        background: { imageSrc: './img/background.png' },   // replace with shrine bg
        shop:       { imageSrc: './img/shop.png', x: 600, y: 128, scale: 2.75, frameMax: 6 },
        timeLimit: 30,                                        // hardest - least time
        player: {
            position: { x: 0, y: 0 },
            velocity: { x: 0, y: 0 },
            imageSrc: './img/samuraiMack/Idle.png',
            frameMax: 8,
            scale: 2.5,
            offset: { x: 215, y: 157 },
            sprites: {
                idle:    { imageSrc: './img/samuraiMack/Idle.png',                        frameMax: 8 },
                run:     { imageSrc: './img/samuraiMack/Run.png',                         frameMax: 8 },
                jump:    { imageSrc: './img/samuraiMack/Jump.png',                        frameMax: 2 },
                fall:    { imageSrc: './img/samuraiMack/Fall.png',                        frameMax: 2 },
                attack1: { imageSrc: './img/samuraiMack/Attack1.png',                     frameMax: 6 },
                takeHit: { imageSrc: './img/samuraiMack/Take Hit - white silhouette.png', frameMax: 4 },
                death:   { imageSrc: './img/samuraiMack/Death.png',                       frameMax: 6 }
            },
            attackBox: { offset: { x: 100, y: 60 }, width: 160, height: 50 }
        },
        enemy: {
            position: { x: 400, y: 100 },
            velocity: { x: 0, y: 0 },
            color: 'blue',
            imageSrc: './img/kenji/Idle.png',
            frameMax: 4,
            scale: 2.5,
            offset: { x: 215, y: 167 },
            sprites: {
                idle:    { imageSrc: './img/kenji/Idle.png',      frameMax: 4 },
                run:     { imageSrc: './img/kenji/Run.png',        frameMax: 8 },
                jump:    { imageSrc: './img/kenji/Jump.png',       frameMax: 2 },
                fall:    { imageSrc: './img/kenji/Fall.png',       frameMax: 2 },
                attack1: { imageSrc: './img/kenji/Attack1.png',    frameMax: 4 },
                takeHit: { imageSrc: './img/kenji/Take Hit.png',   frameMax: 3 },
                death:   { imageSrc: './img/kenji/Death.png',      frameMax: 7 }
            },
            attackBox: { offset: { x: -170, y: 50 }, width: 170, height: 50 }
        }
    }
}


// ─────────────────────────────────────────
//  LevelManager class
// ─────────────────────────────────────────
class LevelManager {
    constructor() {
        this.currentLevel = 1
        this.totalLevels  = Object.keys(levelConfigs).length
        this.transitioning = false
    }

    // Returns the config object for the current level
    getConfig() {
        return levelConfigs[this.currentLevel]
    }

    // Call this after a level is won. Returns true if there's a next level.
    hasNextLevel() {
        return this.currentLevel < this.totalLevels
    }

    // Advance to next level and trigger the transition screen
    // onComplete is called once the transition finishes and the game should reload
    nextLevel(onComplete) {
        if (!this.hasNextLevel()) return

        this.transitioning = true
        this.currentLevel++

        const config = this.getConfig()
        this._showTransition(config.name, () => {
            this.transitioning = false
            onComplete(config)
        })
    }

    // Resets back to level 1 (for game over / restart)
    reset() {
        this.currentLevel = 1
        this.transitioning = false
    }

    // ── Private: renders the "Level X - Name" overlay ──
    _showTransition(levelName, onComplete) {
        const overlay = document.getElementById('levelTransition')
        const title   = document.getElementById('levelTitle')

        title.innerHTML  = `Level ${this.currentLevel}<br><span>${levelName}</span>`
        overlay.style.display = 'flex'

        // Fade in
        overlay.style.opacity = '0'
        overlay.style.transition = 'opacity 0.4s ease'
        requestAnimationFrame(() => {
            overlay.style.opacity = '1'
        })

        // Hold for 2s then fade out and call onComplete
        setTimeout(() => {
            overlay.style.opacity = '0'
            setTimeout(() => {
                overlay.style.display = 'none'
                onComplete()
            }, 400)
        }, 2000)
    }
}

// Single global instance used by index.js
const levelManager = new LevelManager()