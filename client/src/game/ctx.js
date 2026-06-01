// Mutable singleton that all game modules share.
// Properties are mutated in place so ES module live bindings work correctly.
const ctx = {
    canvas: null,
    c: null,
    gravity: 1.0,
    platforms: [],
}

export function setupCanvas(el) {
    el.width  = 1024
    el.height = 576
    ctx.canvas = el
    ctx.c = el.getContext('2d')
}

export default ctx
