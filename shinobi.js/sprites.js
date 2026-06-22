// ─────────────────────────────────────────
// sprites.js
// Centralized sprite definitions to avoid duplication
// ─────────────────────────────────────────

const PLAYER_SPRITES = {
    idle:    { imageSrc: './img/samuraiMack/Idle.png',                        frameMax: 8 },
    run:     { imageSrc: './img/samuraiMack/Run.png',                         frameMax: 8 },
    jump:    { imageSrc: './img/samuraiMack/Jump.png',                        frameMax: 2 },
    fall:    { imageSrc: './img/samuraiMack/Fall.png',                        frameMax: 2 },
    attack1: { imageSrc: './img/samuraiMack/Attack1.png',                     frameMax: 6 },
    takeHit: { imageSrc: './img/samuraiMack/Take Hit - white silhouette.png', frameMax: 4 },
    death:   { imageSrc: './img/samuraiMack/Death.png',                       frameMax: 6 }
}

const KENJI_SPRITES = {
    idle:    { imageSrc: './img/kenji/Idle.png',    frameMax: 4 },
    run:     { imageSrc: './img/kenji/Run.png',     frameMax: 8 },
    jump:    { imageSrc: './img/kenji/Jump.png',    frameMax: 2 },
    fall:    { imageSrc: './img/kenji/Fall.png',    frameMax: 2 },
    attack1: { imageSrc: './img/kenji/Attack1.png', frameMax: 4 },
    takeHit: { imageSrc: './img/kenji/Take Hit.png',frameMax: 3 },
    death:   { imageSrc: './img/kenji/Death.png',   frameMax: 7 }
}

// Helper to create a Kenji enemy at a specific X position
function createKenji(x, extras = {}) {
    return {
        position: { x, y: 0 },
        homePosition: { x, y: 0 },
        velocity: { x: 0, y: 0 },
        color: 'blue',
        imageSrc: './img/kenji/Idle.png',
        frameMax: 4,
        scale: 2,
        offset: { x: 215, y: 167 },
        spriteDefaultFacing: 'left',
        facing: 'left',
        sprites: KENJI_SPRITES,
        attackBox: { offset: { x: -170, y: 50 }, width: 170, height: 50 },
        ...extras
    }
}

// Helper to create a player config with standard sprites
function createPlayerConfig(extras = {}) {
    return {
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        imageSrc: './img/samuraiMack/Idle.png',
        frameMax: 8,
        scale: 2,
        offset: { x: 215, y: 157 },
        sprites: PLAYER_SPRITES,
        attackBox: { offset: { x: 100, y: 60 }, width: 160, height: 50 },
        ...extras
    }
}
