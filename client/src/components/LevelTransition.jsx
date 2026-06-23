import s from './LevelTransition.module.css'

export default function LevelTransition({ level, name, grade }) {
    if (!level) return null
    return (
        <div className={s.overlay}>
            <div className={s.title}>
                Level {level} — <span>{name}</span>
            </div>

            {grade && (
                <div className={s.grade}>
                    <div className={s.letter} data-letter={grade.letter}>
                        {grade.letter}
                    </div>
                    <div className={s.breakdown}>
                        <div className={s.row}>
                            <span>combat</span>
                            <span>{grade.combatScore}</span>
                        </div>
                        <div className={s.row}>
                            <span>survival</span>
                            <span>{grade.survivalScore}</span>
                        </div>
                        <div className={s.row}>
                            <span>speed</span>
                            <span>{grade.speedScore}</span>
                        </div>
                        <div className={s.row}>
                            <span>style</span>
                            <span>{grade.styleScore}</span>
                        </div>
                        <div className={`${s.row} ${s.total}`}>
                            <span>total</span>
                            <span>{grade.totalPoints} pts</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

