import React, { useState } from "react"
import { boardService } from "../../services/board.service"

export function CustomPicker({ info, onUpdate, columnId }) {
    const [isEditing, setIsEditing] = useState(false)
    const [val, setVal] = useState(info[columnId] || "")

    const activity = boardService.getEmptyActivity()
    activity.action = 'text'
    activity.from = info[columnId] || ""
    activity.task = { id: info.id, title: info.title }

    function onBlur() {
        setIsEditing(false)
        if (val === info[columnId]) return
        activity.to = val
        onUpdate(columnId, val, activity)
    }

    return (
        <section className="picker custom-picker">
            {isEditing ? (
                <input
                    type="text"
                    value={val}
                    onChange={(ev) => setVal(ev.target.value)}
                    onBlur={onBlur}
                    autoFocus
                    onKeyDown={(ev) => ev.key === 'Enter' && onBlur()}
                />
            ) : (
                <div className="custom-content" onClick={() => setIsEditing(true)}>
                    {val || ""}
                </div>
            )}
        </section>
    )
}
