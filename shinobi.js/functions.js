function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x &&
        rectangle1.attackBox.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
        rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
    )
}

function determineWinner({ player, enemies, timerId }) {
    clearTimeout(timerId)
    const displayText = document.querySelector('#displayText')
    displayText.style.display = 'flex'

    const maxEnemyHealth = Math.max(...enemies.map(e => e.health))
    const hint = '<div id="restartHint">press R for main menu</div>'

    if (player.health === maxEnemyHealth) {
        displayText.innerHTML = 'Tie' + hint
    } else if (player.health > maxEnemyHealth) {
        displayText.innerHTML = 'Player Wins' + hint
    } else {
        displayText.innerHTML = 'Enemies Win' + hint
    }
}

// timerId is global so onRoundEnd in index.js can clear it
let timerId

function decreaseTimer(startTime) {
    // Clear any existing timer before starting a new one
    clearTimeout(timerId)

    let timer = startTime !== undefined ? startTime : 90
    document.querySelector('#timer').innerHTML = timer

    function tick() {
        // Stop ticking if a level transition is happening
        if (levelManager.transitioning) return

        if (timer > 0) {
            timerId = setTimeout(tick, 1000)
            timer--
            document.querySelector('#timer').innerHTML = timer
        }
        if (timer === 0) {
            // Time ran out — treat as round loss, no level advance
            determineWinner({ player, enemies, timerId })
        }
    }

    tick()
}