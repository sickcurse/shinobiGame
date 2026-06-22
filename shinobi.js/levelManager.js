// ─────────────────────────────────────────
//  levelManager.js
//  Handles level configs, loading, and transitions
// ─────────────────────────────────────────

const levelConfigs = {
    1: {
        name: 'The Dojo',
        background: { imageSrc: './img/background.png' },
        shop: { imageSrc: './img/shop.png', x: 600, y: 128, scale: 2.2, frameMax: 6 },
        timeLimit: 60,
        player: createPlayerConfig(),
        enemies: [
            createKenji(400, { aiProfile: { thinkInterval: 5, attackRange: 105, wakeDistance: 210 } })
        ]
    },

    2: {
        name: 'The Rooftop',
        background: { imageSrc: './img/background.png' },
        shop:       { imageSrc: './img/shop.png', x: 600, y: 128, scale: 2.2, frameMax: 6 },
        timeLimit: 45,
        player: createPlayerConfig(),
        enemies: [
            createKenji(280, { aiProfile: { thinkInterval: 5, attackRange: 105, wakeDistance: 210 } }),
            createKenji(720, { aiProfile: { thinkInterval: 5, attackRange: 105, wakeDistance: 210 } })
        ]
    },

    3: {
        name: 'The Shrine',
        background: { imageSrc: './img/background.png' },
        shop:       { imageSrc: './img/shop.png', x: 600, y: 128, scale: 2.2, frameMax: 6 },
        timeLimit: 30,
        platforms: [
            { x: 350, y: 250, width: 320, height: 20 }
        ],
        enemyDefaults: {
            maxHealth: 60,
            hitDamage: 12,
            aiProfile: {
                moveSpeed: 4,
                attackRange: 95,
                attackCooldownMin: 90,
                attackCooldownMax: 140,
                thinkInterval: 6,
                jumpChance: 0.002
            }
        },
        player: createPlayerConfig(),
        enemies: [
            createKenji(200, { aiProfile: { wakeDistance: 200 } }),
            createKenji(500, { aiProfile: { wakeDistance: 200 } }),
            createKenji(800, { aiProfile: { wakeDistance: 200 } })
        ]
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
