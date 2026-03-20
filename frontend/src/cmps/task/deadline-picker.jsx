import React from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { boardService } from "../../services/board.service"

export function DeadlinePicker({ info, onUpdate }) {
    const activity = boardService.getEmptyActivity()
    activity.action = 'deadline'
    activity.from = info.deadline
    activity.task = { id: info.id, title: info.title }

    const deadlineDate = info.deadline ? new Date(info.deadline) : null

    function onChange(date) {
        if (!date) return
        activity.to = date.getTime()
        onUpdate('deadline', date.getTime(), activity)
    }

    // Dynamic color based on proximity (Neutral if status is Done)
    const getDeadlineClass = () => {
        if (!info.deadline || info.status === 'Done') return ""
        const now = Date.now()
        const diff = info.deadline - now
        if (diff < 0) return "overdue"
        if (diff < 24 * 60 * 60 * 1000) return "soon"
        return ""
    }

    return (
        <section className={`picker date-picker deadline-picker ${getDeadlineClass()}`}>
            <DatePicker
                popperClassName="date-picker-input"
                dateFormat="MMM d"
                placeholderText="Set deadline"
                selected={deadlineDate}
                onChange={onChange}
            />
        </section>
    )
}
