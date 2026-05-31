class Sprite {
    constructor({position, imageSrc, scale = 1, frameMax = 1, offset = {x: 0, y: 0}}) {
        this.position = position
        this.width = 50
        this.height = 150
        this.image = new Image()
        this.image.src = imageSrc
        this.scale = scale
        this.frameMax = frameMax
        this.frameCurrent = 0
        this.framesElapsed = 0
        this.framesHold = 4
        this.offset = offset
    }
    
    draw(){ 
        c.drawImage(this.image,
            this.frameCurrent * (this.image.width / this.frameMax),
            0,
            this.image.width / this.frameMax,
            this.image.height,
            this.position.x - this.offset.x, this.position.y - this.offset.y, (this.image.width / this.frameMax) * this.scale, this.image.height * this.scale)
    }

    animateFrames(){
        this.framesElapsed++

        if(this.framesElapsed % this.framesHold === 0 ){

        if(this.frameCurrent < this.frameMax - 1){
            this.frameCurrent++
        } else {
            this.frameCurrent = 0
        }
    }}



    update() {
        this.draw()
        this.animateFrames()
   }
        
}


class Fighter extends Sprite {
    constructor({position, velocity, color = 'red',  imageSrc, scale = 1, frameMax = 1, offset = {x: 0, y: 0}, sprites, attackBox = { offset:{}, width: undefined, height: undefined}}) {
        super({
            position,
            imageSrc,
            scale,
            frameMax,
            offset
        })
        
        this.position = position
        this.velocity = velocity
        this.width = 50
        this.height = 150
        this.lastKey 
        this.attackBox = {
            position: {
                x: this.position.x, 
                y: this.position.y
            },
            offset: attackBox.offset,
            width: attackBox.width, 
            height: attackBox.height
        },    
        this.color = color
        this.isAttacking
        this.health = 100
        this.frameCurrent = 0
        this.framesElapsed = 0
        this.framesHold = 4
        this.sprites = sprites
        this.dead = false
        this._aiCooldown = 0
        this._aiJumpTimer = 0

        for (const sprite in sprites) {
            sprites[sprite].image = new Image()
            sprites[sprite].image.src = sprites[sprite].imageSrc
        }
        
    }

    drawHealthBar() {
        const barWidth = 80
        const barHeight = 8
        const x = this.position.x + this.width / 2 - barWidth / 2
        const y = this.position.y - 25

        // outline
        c.fillStyle = 'rgba(0, 0, 0, 0.6)'
        c.fillRect(x - 2, y - 2, barWidth + 4, barHeight + 4)

        // empty track
        c.fillStyle = '#7f1d1d'
        c.fillRect(x, y, barWidth, barHeight)

        // filled portion
        const fillWidth = Math.max(0, (this.health / 100) * barWidth)
        c.fillStyle = this.color === 'blue' ? '#4ade80' : '#818CF8'
        c.fillRect(x, y, fillWidth, barHeight)
    }

    update() {
        this.draw()
        this.drawHealthBar()
        if (!this.dead) this.animateFrames()
      
        this.attackBox.position.x = this.position.x + this.attackBox.offset.x
        this.attackBox.position.y = this.position.y + this.attackBox.offset.y

        // c.fillRect(
        //     this.attackBox.position.x, 
        //     this.attackBox.position.y,
        //     this.attackBox.width,
        //     this.attackBox.height)

        this.position.x += this.velocity.x
        this.position.y += this.velocity.y 

        // gravity
        if (this.position.y + this.height + this.velocity.y >= canvas.height - 96) {
            this.velocity.y = 0
            this.position.y = 330
        } else this.velocity.y += gravity
    }

    attack(){
        this.switchSprite('attack1')
        this.isAttacking = true 
    }

    takeHit(){
        this.health -= 20

        if (this.health <= 0) {
            this.switchSprite('death')
        } else this.switchSprite('takeHit')
    }

    switchSprite(sprite){

        if (this.image === this.sprites.death.image) {
            if (this.frameCurrent === this.sprites.death.frameMax - 1)
            this.dead = true
            return
        }

        // overrides all other animations
        if(this.image === this.sprites.attack1.image && this.frameCurrent < this.sprites.attack1.frameMax - 1)
            return

        if(this.image === this.sprites.takeHit.image && this.frameCurrent < this.sprites.takeHit.frameMax - 1)
            return

        switch (sprite){
            case 'idle':
                if (this.image !== this.sprites.idle.image){
                this.image = this.sprites.idle.image
                this.frameMax = this.sprites.idle.frameMax
                this.frameCurrent = 0
                }
                break
            case 'run':
                if (this.image !== this.sprites.run.image){
                this.image = this.sprites.run.image
                this.frameMax = this.sprites.run.frameMax
                this.frameCurrent = 0
                }
                break
            case 'jump':
                if (this.image !== this.sprites.jump.image) {
                this.image = this.sprites.jump.image
                this.frameMax = this.sprites.jump.frameMax
                this.frameCurrent = 0
                }
                break
            case 'fall':
                if (this.image !== this.sprites.fall.image) {
                this.image = this.sprites.fall.image
                this.frameMax = this.sprites.fall.frameMax
                this.frameCurrent = 0
                }
                break
            case 'attack1':
                if (this.image !== this.sprites.attack1.image) {
                this.image = this.sprites.attack1.image
                this.frameMax = this.sprites.attack1.frameMax
                this.frameCurrent = 0
                }
                break
            case 'takeHit':
                if (this.image !== this.sprites.takeHit.image) {
                this.image = this.sprites.takeHit.image
                this.frameMax = this.sprites.takeHit.frameMax
                this.frameCurrent = 0
                }
                break
            case 'death':
                if (this.image !== this.sprites.death.image) {
                this.image = this.sprites.death.image
                this.frameMax = this.sprites.death.frameMax
                this.frameCurrent = 0
                }
                break
        }
    }

    updateAI(target) {
        if (this.dead) return

        const dx = target.position.x - this.position.x
        const dist = Math.abs(dx)

        this.velocity.x = 0

        if (dist > 120) {
            this.velocity.x = dx > 0 ? 7 : -7
            this.switchSprite('run')
        } else {
            this.switchSprite('idle')
        }

        if (this.velocity.y < 0) {
            this.switchSprite('jump')
        } else if (this.velocity.y > 0) {
            this.switchSprite('fall')
        }

        if (this._aiCooldown > 0) this._aiCooldown--

        if (dist < 160 && !this.isAttacking && this._aiCooldown <= 0) {
            this.attack()
            this._aiCooldown = 45 + Math.floor(Math.random() * 30)
        }

        if (this._aiJumpTimer > 0) this._aiJumpTimer--

        if (this.position.y >= 329 && this._aiJumpTimer <= 0 && Math.random() < 0.008) {
            this.velocity.y = -18
            this._aiJumpTimer = 120
        }
    }
}