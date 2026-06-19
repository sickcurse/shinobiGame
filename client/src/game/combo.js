// ── combo.js ──────────────────────────────────────────────────────────────────
// Tracks attack sequences and timing windows for combo chains.
// ─────────────────────────────────────────────────────────────────────────────

const COMBO_WINDOW = 45        // frames to land the next hit before chain resets
const JUGGLE_PUSH  = 120       // px — how far enemies are pushed inward during combo

// combo definitions: sequence of 'L' (light) and 'H' (heavy)
const COMBOS = [
    { sequence: ['L', 'L', 'L'],     name: 'Thrash',       bonusMult: 1.0 },
    { sequence: ['L', 'L', 'H'],     name: 'Slam Finish',  bonusMult: 1.6 },
    { sequence: ['L', 'H', 'L'],     name: 'Stab Loop',    bonusMult: 1.4 },
    { sequence: ['H', 'H'],          name: 'Double Slam',  bonusMult: 1.8 },
    { sequence: ['L', 'L', 'L', 'H'],name: 'Shred Finale', bonusMult: 2.2 },
]

class ComboTracker {
    constructor() {
        this.reset()
    }

    reset() {
        this._sequence  = []      // current input sequence e.g. ['L', 'L']
        this._timer     = 0       // frames since last hit
        this._hitCount  = 0       // total hits in current chain
        this._lastCombo = null    // last matched combo name
        this._mult      = 1.0     // current damage multiplier
    }

    // Call every game loop frame
    tick() {
        if (this._timer > 0) {
            this._timer--
            if (this._timer === 0) this.reset()
        }
    }

    // Call when a hit connects. type = 'L' | 'H'
    // Returns { mult, comboName, hitCount }
    registerHit(type) {
        this._sequence.push(type)
        this._timer   = COMBO_WINDOW
        this._hitCount++

        // check for longest matching combo
        let matched = null
        for (const combo of COMBOS) {
            const len = combo.sequence.length
            const tail = this._sequence.slice(-len)
            if (tail.length === len && tail.every((t, i) => t === combo.sequence[i])) {
                if (!matched || len > matched.sequence.length) {
                    matched = combo
                }
            }
        }

        if (matched) {
            this._mult      = matched.bonusMult
            this._lastCombo = matched.name
        } else {
            this._mult = 1.0
        }

        return {
            mult:      this._mult,
            comboName: matched ? matched.name : null,
            hitCount:  this._hitCount,
        }
    }

    get active()   { return this._hitCount > 1 }
    get hitCount() { return this._hitCount }
    get mult()     { return this._mult }

    // Returns how far to push enemies inward so they stay in juggle range.
    // Pass the player's facing direction.
    jugglePush(playerFacing) {
        return playerFacing === 'right' ? -JUGGLE_PUSH : JUGGLE_PUSH
    }
}

export const comboTracker = new ComboTracker()