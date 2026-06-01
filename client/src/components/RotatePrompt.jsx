import s from './RotatePrompt.module.css'

export default function RotatePrompt() {
    return (
        <div className={s.overlay}>
            <div className={s.icon}>↺</div>
            <div className={s.msg}>rotate for best experience</div>
        </div>
    )
}
