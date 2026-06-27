const kenjiSprites = {
    idle:    { imageSrc: '/img/kenji/Idle.png',     frameMax: 4 },
    run:     { imageSrc: '/img/kenji/Run.png',      frameMax: 8 },
    jump:    { imageSrc: '/img/kenji/Jump.png',     frameMax: 2 },
    fall:    { imageSrc: '/img/kenji/Fall.png',     frameMax: 2 },
    attack1: { imageSrc: '/img/kenji/Attack1.png',  frameMax: 4 },
    takeHit: { imageSrc: '/img/kenji/Take Hit.png', frameMax: 3 },
    death:   { imageSrc: '/img/kenji/Death.png',    frameMax: 7 },
}

function kenjiAt(x, extras = {}) {
    return {
        position:            { x, y: 360 },
        homePosition:        { x, y: 360 },
        velocity:            { x: 0, y: 0 },
        color:               'blue',
        imageSrc:            '/img/kenji/Idle.png',
        frameMax:            4,
        scale:               2,
        offset:              { x: 215, y: 167 },
        spriteDefaultFacing: 'left',
        facing:              'left',
        sprites:             kenjiSprites,
        attackBox:           { offset: { x: -170, y: 50 }, width: 170, height: 50 },
        ...extras,
    }
}

const playerBase = {
    position: { x: 150, y: 360 },
    velocity: { x: 0, y: 0 },
    imageSrc: '/img/samuraiMack/Idle.png',
    frameMax: 8,
    scale:    2,
    offset:   { x: 75, y: 350 },
    sprites: {
        idle:    { imageSrc: '/img/samuraiMack/Idle.png',                        frameMax: 8 },
        run:     { imageSrc: '/img/samuraiMack/Run.png',                         frameMax: 8 },
        jump:    { imageSrc: '/img/samuraiMack/Jump.png',                        frameMax: 2 },
        fall:    { imageSrc: '/img/samuraiMack/Fall.png',                        frameMax: 2 },
        attack1: { imageSrc: '/img/samuraiMack/Attack1.png',                     frameMax: 6 },
        takeHit: { imageSrc: '/img/samuraiMack/Take Hit - white silhouette.png', frameMax: 4 },
        death:   { imageSrc: '/img/samuraiMack/Death.png',                       frameMax: 6 },
    },
    attackBox: { offset: { x: 100, y: 60 }, width: 160, height: 50 },
}

const levelConfigs = {
    1: {
        name:       'The Dojo',
        background: { imageSrc: '/img/background.png' },
        shop:       { imageSrc: '/img/shop.png', x: 600, y: 128, scale: 2.2, frameMax: 6 },
        timeLimit:  60,
        player:     playerBase,
        enemies: [
            kenjiAt(400, { aiProfile: { thinkInterval: 5, attackRange: 105, wakeDistance: 210 } }),
        ],
    },

    2: {
        name:       'The Rooftop',
        background: { imageSrc: '/img/background.png' },
        shop:       { imageSrc: '/img/shop.png', x: 600, y: 128, scale: 2.2, frameMax: 6 },
        timeLimit:  45,
        player:     playerBase,
        enemies: [
            kenjiAt(280, { aiProfile: { thinkInterval: 5, attackRange: 105, wakeDistance: 210 } }),
            kenjiAt(720, { aiProfile: { thinkInterval: 5, attackRange: 105, wakeDistance: 210 } }),
        ],
    },

    3: {
        name:       'The Shrine',
        background: { imageSrc: '/img/background.png' },
        shop:       { imageSrc: '/img/shop.png', x: 600, y: 128, scale: 2.2, frameMax: 6 },
        timeLimit:  30,
        platforms:  [{ x: 350, y: 250, width: 320, height: 20 }],
        enemyDefaults: {
            maxHealth:  60,
            hitDamage:  12,
            aiProfile: {
                moveSpeed:         4,
                attackRange:       95,
                attackCooldownMin: 90,
                attackCooldownMax: 140,
                thinkInterval:     6,
                jumpChance:        0.002,
            },
        },
        player:  playerBase,
        enemies: [
            kenjiAt(200, { aiProfile: { wakeDistance: 200 } }),
            kenjiAt(500, { aiProfile: { wakeDistance: 200 } }),
            kenjiAt(800, { aiProfile: { wakeDistance: 200 } }),
        ],
    },
}

class LevelManager {
    constructor() {
        this.currentLevel  = 1
        this.totalLevels   = Object.keys(levelConfigs).length
        this.transitioning = false
    }

    getConfig() { return levelConfigs[this.currentLevel] }

    hasNextLevel() { return this.currentLevel < this.totalLevels }

    nextLevel(onComplete, onTransition) {
        if (!this.hasNextLevel()) return
        this.transitioning = true
        this.currentLevel++
        const config = this.getConfig()

        // onTransition(level, name, done) — provided by engine.js, bridges to React
        if (onTransition) {
            onTransition(this.currentLevel, config.name, () => {
                this.transitioning = false
                onComplete(config)
            })
        } else {
            this.transitioning = false
            onComplete(config)
        }
    }

    reset() {
        this.currentLevel  = 1
        this.transitioning = false
    }
}

export const levelManager = new LevelManager()
