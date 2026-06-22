# Shinobi Game

A 2D side-scroller beat'em up game with multiplayer leaderboards, built with vanilla JavaScript Canvas.

## Features

- **Responsive Combat**: Attack, jump, and defend against AI enemies
- **Multiple Levels**: Progressive difficulty with different enemies and platforms
- **AI Enemies**: Smart enemy behavior with configurable profiles
- **User Accounts**: Register, login, and track scores on a leaderboard
- **Guest Play**: Play without creating an account
- **Retro Aesthetic**: Press Start 2P font and pixel-perfect animations

## Project Structure

```
shinobiGame/
├── index.html              # Main game HTML
├── index.js                # Game loop & core logic
├── shinobi.js/
│   ├── classes.js          # Sprite, Fighter, Platform classes
│   ├── functions.js        # Utility functions (collision, timer, winner logic)
│   ├── levelManager.js     # Level configs and progression
│   ├── sprites.js          # Centralized sprite definitions
│   └── auth.js             # Authentication & leaderboard
├── server/
│   ├── index.js            # Express server entry point
│   ├── db.js               # Database initialization
│   ├── routes/
│   │   ├── auth.js         # /api/auth/login, /api/auth/register
│   │   └── scores.js       # /api/scores/*
│   └── package.json
├── img/                    # Game sprite assets
└── render.yaml             # Render.com deployment config
```

## Setup

### Frontend (Client)

1. Ensure assets are in `img/` folder:
   - `background.png`
   - `shop.png`
   - `samuraiMack/` (Idle, Run, Jump, Fall, Attack1, Take Hit, Death)
   - `kenji/` (same animations as above)

2. Open `index.html` in a browser (or serve via HTTP)

### Backend (Server)

1. Navigate to `server/` directory:
   ```bash
   cd server
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL and JWT_SECRET
   ```

3. Start the server:
   ```bash
   npm run dev    # Development with auto-reload
   npm start      # Production
   ```

The server runs on `http://localhost:3000` by default.

## Controls

| Action | Key |
|--------|-----|
| Move Left | **A** |
| Move Right | **D** |
| Jump | **W** |
| Attack | **SPACE** |
| Restart Level | **R** |
| Start Game | **ENTER** |

## Game States

1. **Main Menu**: Login, register, or play as guest
2. **Game**: Fight enemies across multiple levels
3. **Level Transition**: Fade-in overlay showing next level
4. **Victory/Defeat**: End screen with score
5. **Leaderboard**: View global scores or personal bests

## Development Notes

### Adding New Levels

Edit `shinobi.js/levelManager.js`:

```javascript
levelConfigs[4] = {
    name: 'New Level',
    background: { imageSrc: './img/new-bg.png' },
    shop: { imageSrc: './img/shop.png', x: 600, y: 128, scale: 2.2, frameMax: 6 },
    timeLimit: 60,
    player: createPlayerConfig(),
    enemies: [
        createKenji(300),
        createKenji(700)
    ]
}
```

### Customizing AI Behavior

Adjust enemy profiles in level configs:

```javascript
createKenji(400, {
    aiProfile: {
        moveSpeed: 5,           // How fast enemies move
        chaseDistance: 140,     // Distance at which they start chasing
        attackRange: 110,       // Distance at which they attack
        attackCooldownMin: 70,  // Min frames between attacks
        attackCooldownMax: 110, // Max frames between attacks
        wakeDistance: 220,      // Distance at which they "wake up"
        jumpChance: 0.003       // Probability to jump per frame
    }
})
```

### Adding New Sprites

Add sprite definitions to `shinobi.js/sprites.js` and update sprite switching in `classes.js`.

## Deployment

### Render.com

The project includes `render.yaml` for easy deployment:

1. Push to GitHub
2. Connect repository to Render.com
3. Render auto-deploys on push

## Future Enhancements

- [ ] Combo system (multiple attacks in sequence)
- [ ] Boss battles
- [ ] Story/cutscenes using level transitions
- [ ] Sound effects & music
- [ ] More enemy types
- [ ] Power-ups system
- [ ] Mobile touch controls

## License

MIT
