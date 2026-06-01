import s from './LevelTransition.module.css'

export default function LevelTransition({ level, name }) {
    if (!level) return null
    return (
        <div className={s.overlay}>
            <div className={s.title}>
                Level {level}
                <br />
                <span>{name}</span>
            </div>
        </div>
    )
}
