import s from './ComboDisplay.module.css'

export default function ComboDisplay({ name, count }) {
    return (
        <div className={s.wrap}>
            <div className={s.name}>{name}</div>
            <div className={s.count}>x{count}</div>
        </div>
    )
}