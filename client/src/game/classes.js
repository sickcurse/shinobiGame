import ctx from './ctx.js'

export const FIGHTER_BASE_SCALE = 2.5
export const SHOP_BASE_SCALE    = 2.75
export const FLOOR_Y            = 576 - 96

export class Sprite {
    constructor({ position, imageSrc, scale = 1, frameMax = 1, offset = { x: 0, y: 0 }, anchorBottom = false }) {
        this.position      = position
        this.width         = 50
        this.height        = 150
        this.image         = new Image()
        this.image.src     = imageSrc
        this.scale         = scale
        this.frameMax      = frameMax
        this.frameCurrent  = 0
        this.framesElapsed = 0
        this.framesHold    = 4
        this.offset        = offset
        this.anchorBottom  = anchorBottom

        if (anchorBottom) {
            this.image.onload = () => this._snapToFloor()
        }
    }

    _snapToFloor() {
        const frameHeight = this.image.height * this.scale
        this.position.y   = FLOOR_Y - frameHeight
    }

    draw() {
        ctx.c.drawImage(
            this.image,
            this.frameCurrent * (this.image.width / this.frameMax),
            0,
            this.image.width / this.frameMax,
            this.image.height,
            this.position.x - this.offset.x,
            this.position.y - this.offset.y,
            (this.image.width / this.frameMax) * this.scale,
            this.image.height * this.scale
        )
    }

    animateFrames() {
        this.framesElapsed++
        if (this.framesElapsed % this.framesHold === 0) {
            if (this.frameCurrent < this.frameMax - 1) {
                this.frameCurrent++
            } else {
                this.frameCurrent = 0
            }
        }
    }

    update() {
        this.draw()
        this.animateFrames()
    }
}

export class Platform {
    constructor({ x, y, width, height }) {
        this.x = x; this.y = y; this.width = width; this.height = height
    }

    draw() {
        ctx.c.fillStyle = '#5c4033'
        ctx.c.fillRect(this.x, this.y, this.width, this.height)
        ctx.c.fillStyle = '#8b6914'
        ctx.c.fillRect(this.x, this.y, this.width, 4)
    }
}

export class Fighter extends Sprite {
    constructor({
        position, velocity, color = 'red', imageSrc, scale = 1, frameMax = 1,
        offset = { x: 0, y: 0 }, sprites,
        attackBox = { offset: {}, width: undefined, height: undefined },
        facing = 'right', healthBarWidth = 80, maxHealth = 100, hitDamage = 20,
        aiProfile = {}, homePosition, spriteDefaultFacing = 'right'
    }) {
        const layoutScale  = scale / FIGHTER_BASE_SCALE
        const scaledOffset = { x: offset.x * layoutScale, y: offset.y * layoutScale }

        super({ position, imageSrc, scale, frameMax, offset: scaledOffset })

        this.position  = { ...position }
        this.velocity  = { ...velocity }
        this.width     = 50  * layoutScale
        this.height    = 150 * layoutScale
        this.lastKey   = null

        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            offset: {
                x: attackBox.offset.x * layoutScale,
                y: attackBox.offset.y * layoutScale,
            },
            width:  attackBox.width  * layoutScale,
            height: attackBox.height * layoutScale,
        }

        // tight block box — small square around body center
        // updated every frame in update()
        this.blockBox = {
            position: { x: 0, y: 0 },
            width:    this.width  * 1.1,
            height:   this.height * 0.7,
        }

        this.color             = color
        this.isAttacking       = false
        this.isAttackingLight  = false
        this.isAttackingHeavy  = false
        this.isBlocking        = false
        this.maxHealth         = maxHealth
        this.health            = maxHealth
        this.hitDamage         = hitDamage
        this._damageNumbers    = []

        this.aiProfile = {
            moveSpeed:          aiProfile.moveSpeed          ?? 5,
            chaseDistance:      aiProfile.chaseDistance      ?? 140,
            attackRange:        aiProfile.attackRange        ?? 110,
            attackCooldownMin:  aiProfile.attackCooldownMin  ?? 70,
            attackCooldownMax:  aiProfile.attackCooldownMax  ?? 110,
            thinkInterval:      aiProfile.thinkInterval      ?? 4,
            jumpChance:         aiProfile.jumpChance         ?? 0.003,
            wakeDistance:       aiProfile.wakeDistance       ?? 220,
            homeRadius:         aiProfile.homeRadius         ?? 12,
        }

        this.frameCurrent        = 0
        this.framesElapsed       = 0
        this.framesHold          = 4
        this.sprites             = sprites
        this.dead                = false
        this.dying               = false
        this._aiCooldown         = 0
        this._aiJumpTimer        = 0
        this._aiThinkTimer       = 0
        this.facing              = facing
        this.spriteDefaultFacing = spriteDefaultFacing
        this.homePosition        = homePosition
            ? { ...homePosition }
            : { x: position.x, y: position.y }
        this.healthBarWidth      = healthBarWidth

        for (const key in sprites) {
            sprites[key].image     = new Image()
            sprites[key].image.src = sprites[key].imageSrc
        }
    }

    shouldFlipSprite() {
        if (this.spriteDefaultFacing === 'left') return this.facing === 'right'
        return this.facing === 'left'
    }

    draw() {
        const frameWidth = this.image.width / this.frameMax
        const drawWidth  = frameWidth * this.scale
        const drawHeight = this.image.height * this.scale
        const drawX      = this.position.x - this.offset.x
        const drawY      = this.position.y - this.offset.y

        ctx.c.save()
        if (this.shouldFlipSprite()) {
            ctx.c.translate(drawX + drawWidth, drawY)
            ctx.c.scale(-1, 1)
            ctx.c.drawImage(this.image, this.frameCurrent * frameWidth, 0, frameWidth, this.image.height, 0, 0, drawWidth, drawHeight)
        } else {
            ctx.c.drawImage(this.image, this.frameCurrent * frameWidth, 0, frameWidth, this.image.height, drawX, drawY, drawWidth, drawHeight)
        }
        ctx.c.restore()

        // block flash overlay — only over the tight block box
        if (this.isBlocking) {
            ctx.c.save()
            ctx.c.globalAlpha = 0.35
            ctx.c.fillStyle   = '#facc15'
            ctx.c.fillRect(
                this.blockBox.position.x,
                this.blockBox.position.y,
                this.blockBox.width,
                this.blockBox.height
            )
            ctx.c.globalAlpha = 1
            ctx.c.restore()
        }
    }

    getAttackOffsetX() {
        const { x: ox } = this.attackBox.offset
        const w = this.attackBox.width
        if (this.facing === 'right') return ox >= 0 ? ox : -ox - w
        return ox >= 0 ? -ox - w : ox
    }

    // Whether an incoming attack box overlaps this fighter's block box
    isBlockingHit(incomingAttackBox) {
        if (!this.isBlocking) return false
        const b = this.blockBox
        return (
            incomingAttackBox.position.x + incomingAttackBox.width  >= b.position.x &&
            incomingAttackBox.position.x                             <= b.position.x + b.width &&
            incomingAttackBox.position.y + incomingAttackBox.height >= b.position.y &&
            incomingAttackBox.position.y                             <= b.position.y + b.height
        )
    }

    drawHealthBar() {
        const barWidth  = this.healthBarWidth
        const barHeight = 8
        const x = this.position.x + this.width / 2 - barWidth / 2
        const y = this.position.y - 25

        ctx.c.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.c.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4)

        ctx.c.fillStyle = '#7f1d1d'
        ctx.c.fillRect(x, y, barWidth, barHeight)

        const fillWidth = Math.max(0, (this.health / this.maxHealth) * barWidth)
        ctx.c.fillStyle = this.color === 'blue' ? '#4ade80' : '#818CF8'
        ctx.c.fillRect(x, y, fillWidth, barHeight)

        ctx.c.fillStyle = 'white'
        ctx.c.font      = '700 9px monospace'
        ctx.c.textAlign = 'center'
        ctx.c.fillText(
            `${Math.max(0, Math.ceil(this.health))} / ${this.maxHealth}`,
            x + barWidth / 2,
            y - 4
        )
        ctx.c.textAlign = 'left'
    }

    spawnDamageNumber(amount, isChip = false) {
        this._damageNumbers.push({
            value:  Math.ceil(amount),
            x:      this.position.x + this.width / 2 + (Math.random() * 20 - 10),
            y:      this.position.y,
            vy:     -2.5,
            life:   45,
            isChip,
        })
    }

    drawDamageNumbers() {
        this._damageNumbers = this._damageNumbers.filter(n => n.life > 0)
        for (const n of this._damageNumbers) {
            const alpha = Math.min(1, n.life / 20)
            ctx.c.save()
            ctx.c.globalAlpha = alpha
            ctx.c.font        = n.isChip ? 'bold 10px monospace' : 'bold 14px monospace'
            ctx.c.fillStyle   = n.isChip ? '#94a3b8' : (n.value >= 30 ? '#ffd700' : '#f87171')
            ctx.c.textAlign   = 'center'
            ctx.c.fillText(`-${n.value}`, n.x, n.y)
            ctx.c.restore()
            n.y  += n.vy
            n.vy *= 0.92
            n.life--
        }
        ctx.c.textAlign = 'left'
    }

    update() {
        this.draw()
        this.drawHealthBar()
        this.drawDamageNumbers()

        if (!this.dead) {
            this.animateFrames()
            if (
                this.sprites?.death &&
                this.image === this.sprites.death.image &&
                this.frameCurrent === this.sprites.death.frameMax - 1
            ) {
                this.dead = true
                this.velocity.x = 0
                this.velocity.y = 0
            }
        }

        if (this.dead) {
            this.attackBox.position.x = -9999
            this.attackBox.position.y = -9999
            return
        }

        this.attackBox.position.x = this.position.x + this.getAttackOffsetX()
        this.attackBox.position.y = this.position.y + this.attackBox.offset.y

        // update tight block box — centered horizontally, upper 70% of body
        this.blockBox.position.x = this.position.x + this.width / 2 - this.blockBox.width / 2
        this.blockBox.position.y = this.position.y + this.height * 0.15

        this.position.x += this.velocity.x

        const floorY     = ctx.canvas.height - 96
        const prevBottom = this.position.y + this.height
        this.position.y += this.velocity.y
        const currBottom = this.position.y + this.height

        let landed = false

        if (this.velocity.y >= 0) {
            for (const platform of ctx.platforms) {
                const onPlatform =
                    currBottom >= platform.y &&
                    prevBottom <= platform.y &&
                    this.position.x + this.width > platform.x &&
                    this.position.x < platform.x + platform.width

                if (onPlatform) {
                    this.position.y = platform.y - this.height
                    this.velocity.y = 0
                    landed = true
                    break
                }
            }
        }

        if (!landed && this.position.y + this.height >= floorY) {
            this.velocity.y = 0
            this.position.y = floorY - this.height
        } else if (!landed) {
            this.velocity.y += ctx.gravity
        }
    }

    attack() {
        if (this.dying || this.dead) return
        if (this.switchSprite('attack1')) {
            this.isAttacking      = true
            this.isAttackingLight = true
        }
    }

    lightAttack() {
        if (this.dying || this.dead) return
        if (this.switchSprite('attack1')) {
            this.isAttacking      = true
            this.isAttackingLight = true
        }
    }

    heavyAttack() {
        if (this.dying || this.dead) return
        const target = this.sprites.attack2 ? 'attack2' : 'attack1'
        if (this.switchSprite(target)) {
            this.isAttacking      = true
            this.isAttackingHeavy = true
        }
    }

    blockStart() {
        if (this.dying || this.dead || this.isAttacking) return
        if (this.switchSprite('block')) {
            this.isBlocking = true
        }
    }

    blockEnd() {
        this.isBlocking = false
    }

    takeHit(damage = 20, isChip = false) {
        if (this.dying || this.dead) return
        this.health -= damage
        this.spawnDamageNumber(damage, isChip)
        if (this.health <= 0) {
            this.health            = 0
            this.dying             = true
            this.velocity.x        = 0
            this.isAttacking       = false
            this.isAttackingLight  = false
            this.isAttackingHeavy  = false
            this.isBlocking        = false
            this.switchSprite('death')
        } else {
            this.isAttacking      = false
            this.isAttackingLight = false
            this.isAttackingHeavy = false
            this.switchSprite('takeHit')
        }
    }

    switchSprite(sprite) {
        if (this.image === this.sprites.death.image) return false

        if (this.image === this.sprites.takeHit.image && this.frameCurrent < this.sprites.takeHit.frameMax - 1) {
            if (sprite !== 'death') return false
        }
        if (this.image === this.sprites.attack1.image && this.frameCurrent < this.sprites.attack1.frameMax - 1) {
            if (sprite !== 'takeHit' && sprite !== 'death') return false
        }
        if (this.sprites.attack2 && this.image === this.sprites.attack2.image && this.frameCurrent < this.sprites.attack2.frameMax - 1) {
            if (sprite !== 'takeHit' && sprite !== 'death') return false
        }

        const def = this.sprites[sprite]
        if (!def || this.image === def.image) return false

        this.image = def.image
        this.frameMax = def.frameMax
        this.frameCurrent = 0
        this.framesElapsed = 0
        return true
    }

    updateAI(target) {
        if (this.dead || this.dying || this.health <= 0) return

        if (this._aiThinkTimer > 0) { this._aiThinkTimer--; return }
        this._aiThinkTimer = this.aiProfile.thinkInterval

        const dx      = target.position.x - this.position.x
        const dist    = Math.abs(dx)
        const profile = this.aiProfile
        const awake   = dist <= profile.wakeDistance

        this.velocity.x = 0

        if (!awake) {
            const homeDx = this.homePosition.x - this.position.x
            if (Math.abs(homeDx) > profile.homeRadius) {
                this.velocity.x = homeDx > 0 ? profile.moveSpeed * 0.55 : -profile.moveSpeed * 0.55
                this.facing = homeDx > 0 ? 'right' : 'left'
                this.switchSprite('run')
            } else {
                this.facing = this.homePosition.x < ctx.canvas.width / 2 ? 'left' : 'right'
                this.switchSprite('idle')
            }
        } else if (dist > profile.chaseDistance) {
            this.velocity.x = dx > 0 ? profile.moveSpeed : -profile.moveSpeed
            this.facing = dx > 0 ? 'right' : 'left'
            this.switchSprite('run')
        } else {
            this.facing = dx > 0 ? 'right' : 'left'
            this.switchSprite('idle')
        }

        if (this.velocity.y < 0) this.switchSprite('jump')
        else if (this.velocity.y > 0) this.switchSprite('fall')

        if (!awake) return

        if (this._aiCooldown > 0) this._aiCooldown--

        if (dist < profile.attackRange && !this.isAttacking && this._aiCooldown <= 0) {
            this.attack()
            this._aiCooldown = profile.attackCooldownMin + Math.floor(Math.random() * (profile.attackCooldownMax - profile.attackCooldownMin))
        }

        if (this._aiJumpTimer > 0) this._aiJumpTimer--

        const floorY = ctx.canvas.height - 96
        if (this.position.y >= floorY - this.height - 1 && this._aiJumpTimer <= 0 && Math.random() < profile.jumpChance) {
            this.velocity.y = -18
            this._aiJumpTimer = 120
        }
    }
}

export function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width  >= rectangle2.position.x &&
        rectangle1.attackBox.position.x                                <= rectangle2.position.x + rectangle2.width &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
        rectangle1.attackBox.position.y                                <= rectangle2.position.y + rectangle2.height
    )
}