import { pressKey, releaseKey, touchJump, touchAttack } from '../game/engine.js'
import s from './MobileControls.module.css'

function makeHandlers(onPress, onRelease) {
    return {
        onPointerDown:   (e) => { e.currentTarget.setPointerCapture(e.pointerId); onPress() },
        onPointerUp:     ()  => onRelease?.(),
        onPointerCancel: ()  => onRelease?.(),
        onPointerLeave:  ()  => onRelease?.(),
    }
}

export default function MobileControls() {
    return (
        <div className={s.pad}>
            <div className={s.left}>
                <button className={s.dpad} {...makeHandlers(() => pressKey('a'), () => releaseKey('a'))}>◀</button>
                <button className={s.dpad} {...makeHandlers(() => pressKey('d'), () => releaseKey('d'))}>▶</button>
            </div>
            <div className={s.right}>
                <button className={`${s.action} ${s.jump}`} {...makeHandlers(touchJump)}>JUMP</button>
                <button className={`${s.action} ${s.atk}`}  {...makeHandlers(touchAttack)}>ATK</button>
            </div>
        </div>
    )
}
