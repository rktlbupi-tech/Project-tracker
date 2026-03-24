import { useState, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { BsChevronLeft, BsChevronRight, BsCalendar3, BsPeopleFill } from 'react-icons/bs'
import { MdToday, MdAdd } from 'react-icons/md'
import { IoClose } from 'react-icons/io5'
import { updateOptimisticBoard, addTask, updateTaskAction } from '../../store/board.actions'
import { boardService } from '../../services/board.service'
import { utilService } from '../../services/util.service'
import { userService } from '../../services/user.service'
import { StatusPicker } from '../task/status-picker'
import { PriorityPicker } from '../task/priority-picker'
import { MemberPicker } from '../task/member-picker'

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DISPLAY_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtDate(date) {
    if (!date) return '—'
    const d = new Date(date)
    return `${DISPLAY_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function buildCalendarUpdate({ action, label, taskId, taskTitle, from, to }) {
    const user = userService.getLoggedinUser()
    return {
        id: utilService.makeId(),
        source: 'calendar',
        action,       // 'reschedule' | 'add-task'
        label,        // human-readable sentence
        taskId,
        taskTitle,
        from,
        to,
        createdAt: Date.now(),
        byMember: user || { fullname: 'Guest', imgUrl: '' },
    }
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

const STATUS_COLORS = { Done: '#00c875', Progress: '#fdab3d', Stuck: '#e2445c', default: '#6161ff' }
const PRIORITY_COLORS = { High: '#e2445c', Medium: '#fdab3d', Low: '#00c875', Critical: '#9b51e0', default: '#c4c4c4' }

function getStatusColor(s) { return STATUS_COLORS[s] || STATUS_COLORS.default }
function getPriorityColor(p) { return PRIORITY_COLORS[p] || PRIORITY_COLORS.default }

function parseDate(v) {
    if (!v) return null
    const d = new Date(v)
    return isNaN(d) ? null : d
}

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isToday(d) { return isSameDay(d, new Date()) }

function toDateStr(date) {
    // Returns YYYY-MM-DD string in local time
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function getStatusProgress(status) {
    if (status === 'Done') return 100
    if (status === 'Progress') return 50
    if (status === 'Stuck') return 20
    return 0
}

export function BoardCalendar({ board }) {
    const fullBoard = useSelector(s => s.boardModule.board)
    const today = new Date()
    const [currentYear, setCurrentYear] = useState(today.getFullYear())
    const [currentMonth, setCurrentMonth] = useState(today.getMonth())
    const [selectedTask, setSelectedTask] = useState(null)
    const [showWorkload, setShowWorkload] = useState(false)
    const [draggingTask, setDraggingTask] = useState(null)
    const [dragOverCell, setDragOverCell] = useState(null)
    const [addingToDate, setAddingToDate] = useState(null)
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [addingGroup, setAddingGroup] = useState(null)
    const [expandedDay, setExpandedDay] = useState(null) // { date, tasks }
    const newTaskInputRef = useRef(null)

    // Collect all tasks with dates from full board (real-time store)
    const allTasks = useMemo(() => {
        const tasks = []
        if (!fullBoard?.groups) return tasks
        fullBoard.groups.forEach(group => {
            ;(group.tasks || []).forEach(task => {
                const deadline = parseDate(task.deadline)
                const date = parseDate(task.date)
                if (deadline || date) {
                    tasks.push({
                        ...task,
                        _groupId: group.id,
                        _groupTitle: group.title,
                        _groupColor: group.color || '#6161ff',
                        _deadlineDate: deadline,
                        _dateDate: date,
                    })
                }
            })
        })
        return tasks
    }, [fullBoard])

    // Workload map: memberId -> { name, imgUrl, count }
    const workloadMap = useMemo(() => {
        const map = {}
        if (!fullBoard?.groups) return map
        fullBoard.groups.forEach(group => {
            ;(group.tasks || []).forEach(task => {
                ;(task.memberIds || []).forEach(memberId => {
                    if (!map[memberId]) {
                        let member = fullBoard.members?.find(m => m._id === memberId)
                        if (!member && fullBoard.createdBy?._id === memberId) member = fullBoard.createdBy
                        map[memberId] = { name: member?.fullname || 'Unknown', imgUrl: member?.imgUrl, count: 0 }
                    }
                    map[memberId].count++
                })
            })
        })
        return map
    }, [fullBoard])

    const maxWorkload = useMemo(() => Math.max(1, ...Object.values(workloadMap).map(m => m.count)), [workloadMap])

    // Calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1).getDay()
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()
        const days = []
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - i), isCurrentMonth: false })
        }
        for (let d = 1; d <= daysInMonth; d++) {
            days.push({ date: new Date(currentYear, currentMonth, d), isCurrentMonth: true })
        }
        const remaining = 42 - days.length
        for (let d = 1; d <= remaining; d++) {
            days.push({ date: new Date(currentYear, currentMonth + 1, d), isCurrentMonth: false })
        }
        return days
    }, [currentYear, currentMonth])

    function getTasksForDay(date) {
        return allTasks.filter(task => {
            return (task._deadlineDate && isSameDay(task._deadlineDate, date)) ||
                (task._dateDate && isSameDay(task._dateDate, date))
        })
    }

    function getTaskType(task, date) {
        return (task._deadlineDate && isSameDay(task._deadlineDate, date)) ? 'deadline' : 'due'
    }

    function isOverdue(task) {
        return task._deadlineDate && task._deadlineDate < new Date() && task.status !== 'Done'
    }

    // ─── Navigation ──────────────────────────────────────────
    function prevMonth() {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
        else setCurrentMonth(m => m - 1)
    }
    function nextMonth() {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
        else setCurrentMonth(m => m + 1)
    }
    function goToToday() { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()) }

    // ─── Drag & Drop ─────────────────────────────────────────
    function onDragStart(ev, task) {
        setDraggingTask(task)
        ev.dataTransfer.effectAllowed = 'move'
        ev.dataTransfer.setData('text/plain', task.id)
    }

    function onDragEnd() {
        setDraggingTask(null)
        setDragOverCell(null)
    }

    function onDragOver(ev, date) {
        ev.preventDefault()
        ev.dataTransfer.dropEffect = 'move'
        setDragOverCell(date.toDateString())
    }

    function onDragLeave() {
        setDragOverCell(null)
    }

    async function onDrop(ev, targetDate) {
        ev.preventDefault()
        setDragOverCell(null)
        if (!draggingTask || !fullBoard) return

        const newBoard = structuredClone(fullBoard)
        const group = newBoard.groups.find(g => g.id === draggingTask._groupId)
        if (!group) return
        const task = group.tasks.find(t => t.id === draggingTask.id)
        if (!task) return

        const fromDateRaw = task.deadline || task.date
        const dateStr = toDateStr(targetDate)

        // Update the date field
        if (task.deadline) {
            task.deadline = dateStr
        } else {
            task.date = dateStr
        }

        // ── Log to activities (Activity tab) ──
        const activityEntry = {
            ...boardService.getEmptyActivity(),
            action: 'date',
            task: { id: task.id, title: task.title },
            from: fromDateRaw || '',
            to: dateStr,
        }

        // ── Log to calendarUpdates (Updates tab) ──
        const calUpdate = buildCalendarUpdate({
            action: 'reschedule',
            label: `Moved "${task.title}" ${task.deadline !== undefined ? 'deadline' : 'due date'} from ${fmtDate(fromDateRaw)} → ${fmtDate(dateStr)}`,
            taskId: task.id,
            taskTitle: task.title,
            from: fromDateRaw || '',
            to: dateStr,
        })

        if (!newBoard.calendarUpdates) newBoard.calendarUpdates = []
        newBoard.calendarUpdates.unshift(calUpdate)
        if (newBoard.calendarUpdates.length > 50) newBoard.calendarUpdates.pop()

        if (!newBoard.activities) newBoard.activities = []
        if (newBoard.activities.length >= 30) newBoard.activities.pop()
        newBoard.activities.unshift(activityEntry)

        const prevBoard = fullBoard
        try {
            await updateOptimisticBoard(newBoard, prevBoard)
        } catch (err) {
            console.error('Failed to reschedule task', err)
        }
        setDraggingTask(null)
    }

    // ─── Inline Task Creation ─────────────────────────────────
    function onCellAddClick(ev, date, group) {
        ev.stopPropagation()
        setAddingToDate(date)
        setAddingGroup(group || (fullBoard?.groups?.[0] || null))
        setNewTaskTitle('')
        setTimeout(() => newTaskInputRef.current?.focus(), 50)
    }

    async function onAddTaskConfirm(ev) {
        if (ev.key && ev.key !== 'Enter') return
        const title = newTaskTitle.trim()
        if (!title || !addingGroup || !fullBoard) {
            setAddingToDate(null)
            return
        }
        const dateStr = toDateStr(addingToDate)
        const newTask = boardService.getEmptyTask()
        newTask.title = title
        newTask.deadline = dateStr

        const activity = boardService.getEmptyActivity()
        activity.action = 'create'
        activity.from = { title: addingGroup.title, color: addingGroup.color }

        const calUpdate = buildCalendarUpdate({
            action: 'add-task',
            label: `Created "${title}" with deadline ${fmtDate(dateStr)} in group "${addingGroup.title}"`,
            taskTitle: title,
            from: '',
            to: dateStr,
        })

        try {
            await addTask(newTask, addingGroup, fullBoard, activity, calUpdate)
        } catch (err) {
            console.error('Failed to create task from calendar', err)
        }
        setAddingToDate(null)
        setNewTaskTitle('')
    }


    async function onUpdateTaskField(cmpType, data, activity) {
        if (!selectedTask || !fullBoard) return
        const { task } = selectedTask
        const taskToUpdate = structuredClone(task)
        taskToUpdate[cmpType] = data
        try {
            await updateTaskAction(fullBoard, task._groupId, taskToUpdate, activity, cmpType)
            setSelectedTask(prev => {
                if (!prev) return null
                return { ...prev, task: { ...prev.task, [cmpType]: data } }
            })
        } catch (err) {
            console.error('Failed to update task field from calendar', err)
        }
    }

    function cancelAddTask() {
        setAddingToDate(null)
        setNewTaskTitle('')
    }

    // ─── Today stat ──────────────────────────────────────────
    const todayTaskCount = allTasks.filter(t =>
        (t._deadlineDate && isSameDay(t._deadlineDate, today)) ||
        (t._dateDate && isSameDay(t._dateDate, today))
    ).length

    // ─── Render ──────────────────────────────────────────────
    return (
        <div className="board-calendar">
            {/* Header */}
            <div className="cal-header">
                <div className="cal-header-left">
                    <h2 className="cal-month-title">
                        <BsCalendar3 className="cal-title-icon" />
                        {MONTHS[currentMonth]} {currentYear}
                    </h2>
                    {todayTaskCount > 0 && (
                        <span className="cal-today-badge">
                            {todayTaskCount} task{todayTaskCount > 1 ? 's' : ''} today
                        </span>
                    )}
                </div>
                <div className="cal-header-right">
                    <button
                        className={`cal-workload-btn ${showWorkload ? 'active' : ''}`}
                        onClick={() => setShowWorkload(w => !w)}
                    >
                        <BsPeopleFill /> Workload
                    </button>
                    <button className="cal-today-btn" onClick={goToToday}>
                        <MdToday /> Today
                    </button>
                    <div className="cal-nav">
                        <button className="cal-nav-btn" onClick={prevMonth}><BsChevronLeft /></button>
                        <button className="cal-nav-btn" onClick={nextMonth}><BsChevronRight /></button>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="cal-legend">
                <span className="legend-item"><span className="legend-dot deadline"></span>Deadline</span>
                <span className="legend-item"><span className="legend-dot due"></span>Due Date</span>
                <span className="legend-item"><span className="legend-dot overdue"></span>Overdue</span>
                <span className="legend-item legend-drag">✦ Drag tasks to reschedule · Click + to add</span>
            </div>

            <div className="cal-body">
                {/* Main grid section */}
                <div className="cal-main">
                    {/* Weekdays */}
                    <div className="cal-weekdays">
                        {DAYS_OF_WEEK.map(d => (
                            <div key={d} className="cal-weekday">{d}</div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="cal-grid">
                        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                            const dayTasks = getTasksForDay(date)
                            const todayCell = isCurrentMonth && isToday(date)
                            const isDragOver = dragOverCell === date.toDateString()
                            const isAddingHere = addingToDate && isSameDay(addingToDate, date)

                            return (
                                <div
                                    key={idx}
                                    className={`cal-cell ${!isCurrentMonth ? 'other-month' : ''} ${todayCell ? 'today' : ''} ${isDragOver ? 'drag-over' : ''}`}
                                    onDragOver={(e) => onDragOver(e, date)}
                                    onDragLeave={onDragLeave}
                                    onDrop={(e) => onDrop(e, date)}
                                >
                                    <div className="cal-cell-header">
                                        <span className={`cal-date-num ${todayCell ? 'today-num' : ''}`}>
                                            {date.getDate()}
                                        </span>
                                        {isCurrentMonth && (
                                            <button
                                                className="cal-add-btn"
                                                onClick={(e) => onCellAddClick(e, date)}
                                                title="Add task on this day"
                                            >
                                                <MdAdd />
                                            </button>
                                        )}
                                    </div>

                                    <div className="cal-cell-tasks">
                                        {dayTasks.slice(0, 3).map((task, tIdx) => {
                                            const type = getTaskType(task, date)
                                            const overdue = isOverdue(task)
                                            const color = overdue ? '#e2445c' : (type === 'deadline' ? getStatusColor(task.status) : '#6161ff')
                                            const progress = getStatusProgress(task.status)

                                            return (
                                                <div
                                                    key={tIdx}
                                                    className={`cal-task-pill ${overdue ? 'overdue' : ''} ${draggingTask?.id === task.id ? 'dragging' : ''}`}
                                                    style={{ borderLeftColor: color }}
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, task)}
                                                    onDragEnd={onDragEnd}
                                                    onClick={(e) => { e.stopPropagation(); setSelectedTask({ task, type, overdue, date }) }}
                                                    title={`${task.title} — ${type === 'deadline' ? 'Deadline' : 'Due Date'} · Drag to reschedule`}
                                                >
                                                    <div className="pill-top">
                                                        <span className="cal-task-dot" style={{ background: color }}></span>
                                                        <span className="cal-task-name">{task.title}</span>
                                                        {type === 'deadline' && (
                                                            <span className="cal-task-badge" style={{ background: color }}>
                                                                {overdue ? '⚠' : '⏰'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Progress bar */}
                                                    {progress > 0 && (
                                                        <div className="pill-progress-bar">
                                                            <div
                                                                className="pill-progress-fill"
                                                                style={{ width: `${progress}%`, background: color }}
                                                            ></div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}

                                        {dayTasks.length > 3 && (
                                            <div
                                                className="cal-more-tasks"
                                                onClick={(e) => { e.stopPropagation(); setExpandedDay({ date, tasks: dayTasks }) }}
                                            >
                                                +{dayTasks.length - 3} more
                                            </div>
                                        )}

                                        {/* Inline task creation */}
                                        {isAddingHere && (
                                            <div className="cal-inline-add">
                                                <input
                                                    ref={newTaskInputRef}
                                                    className="cal-inline-input"
                                                    placeholder="Task title..."
                                                    value={newTaskTitle}
                                                    onChange={e => setNewTaskTitle(e.target.value)}
                                                    onKeyDown={onAddTaskConfirm}
                                                    onBlur={cancelAddTask}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Workload Sidebar */}
                {showWorkload && (
                    <div className="cal-workload-sidebar">
                        <div className="workload-header">
                            <h4>Assignee Workload</h4>
                            <button className="workload-close" onClick={() => setShowWorkload(false)}><IoClose /></button>
                        </div>
                        {Object.keys(workloadMap).length === 0 && (
                            <p className="workload-empty">No assigned tasks</p>
                        )}
                        {Object.entries(workloadMap)
                            .sort(([, a], [, b]) => b.count - a.count)
                            .map(([id, member]) => (
                                <div key={id} className="workload-member">
                                    <div className="workload-member-info">
                                        {member.imgUrl
                                            ? <img src={member.imgUrl} alt={member.name} className="workload-avatar" />
                                            : <div className="workload-avatar-placeholder">{member.name[0]?.toUpperCase()}</div>
                                        }
                                        <span className="workload-name">{member.name}</span>
                                        <span className={`workload-count ${member.count / maxWorkload > 0.7 ? 'high' : member.count / maxWorkload > 0.4 ? 'mid' : 'low'}`}>
                                            {member.count}
                                        </span>
                                    </div>
                                    <div className="workload-bar-track">
                                        <div
                                            className={`workload-bar-fill ${member.count / maxWorkload > 0.7 ? 'high' : member.count / maxWorkload > 0.4 ? 'mid' : 'low'}`}
                                            style={{ width: `${(member.count / maxWorkload) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                )}
            </div>

            {/* Task Detail Popup */}
            {selectedTask && (
                <div className="cal-task-popup-overlay" onClick={() => setSelectedTask(null)}>
                    <div className="cal-task-popup" onClick={e => e.stopPropagation()}>
                        <button className="cal-popup-close" onClick={() => setSelectedTask(null)}><IoClose /></button>
                        <div className="cal-popup-header">
                            <span className="cal-popup-type-badge" style={{
                                background: selectedTask.overdue ? '#e2445c22' : selectedTask.type === 'deadline' ? '#6161ff22' : '#00c87522',
                                color: selectedTask.overdue ? '#e2445c' : selectedTask.type === 'deadline' ? '#6161ff' : '#00c875'
                            }}>
                                {selectedTask.overdue ? '⚠ Overdue' : selectedTask.type === 'deadline' ? '⏰ Deadline' : '📅 Due Date'}
                            </span>
                        </div>
                        <h3 
                            className="cal-popup-title" 
                            contentEditable 
                            suppressContentEditableWarning 
                            onBlur={(ev) => onUpdateTaskField('title', ev.target.innerText)}
                            onKeyDown={(ev) => ev.key === 'Enter' && ev.target.blur()}
                        >
                            {selectedTask.task.title}
                        </h3>

                        {/* Progress bar in popup */}
                        <div className="cal-popup-progress">
                            <div className="cal-popup-progress-label">
                                <span>Progress</span>
                                <span>{getStatusProgress(selectedTask.task.status)}%</span>
                            </div>
                            <div className="cal-popup-progress-track">
                                <div
                                    className="cal-popup-progress-fill"
                                    style={{
                                        width: `${getStatusProgress(selectedTask.task.status)}%`,
                                        background: getStatusColor(selectedTask.task.status)
                                    }}
                                ></div>
                            </div>
                        </div>

                        <div className="cal-popup-meta">
                            <div className="cal-popup-row">
                                <span className="cal-popup-label">Group</span>
                                <span className="cal-popup-value" style={{ color: selectedTask.task._groupColor }}>
                                    {selectedTask.task._groupTitle}
                                </span>
                            </div>
                            <div className="cal-popup-row">
                                <span className="cal-popup-label">Status</span>
                                <div className="cal-picker-container">
                                    <StatusPicker info={selectedTask.task} onUpdate={onUpdateTaskField} />
                                </div>
                            </div>
                            <div className="cal-popup-row">
                                <span className="cal-popup-label">Priority</span>
                                <div className="cal-picker-container">
                                    <PriorityPicker info={selectedTask.task} onUpdate={onUpdateTaskField} />
                                </div>
                            </div>
                            <div className="cal-popup-row">
                                <span className="cal-popup-label">Deadline</span>
                                <span className="cal-popup-value">
                                    {selectedTask.task._deadlineDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'No Deadline'}
                                </span>
                            </div>
                            <div className="cal-popup-row align-start">
                                <span className="cal-popup-label" style={{ marginTop: '8px' }}>Assignees</span>
                                <div className="cal-picker-container">
                                    <MemberPicker info={selectedTask.task} onUpdate={onUpdateTaskField} board={fullBoard} />
                                </div>
                            </div>
                        </div>
                        <p className="cal-popup-drag-hint">💡 Drag the task on the calendar to reschedule it</p>
                    </div>
                </div>
            )}

            {/* Expanded Day Popup */}
            {expandedDay && (
                <div className="cal-task-popup-overlay" onClick={() => setExpandedDay(null)}>
                    <div className="cal-task-popup cal-expanded-day" onClick={e => e.stopPropagation()}>
                        <button className="cal-popup-close" onClick={() => setExpandedDay(null)}><IoClose /></button>
                        <div className="cal-popup-header">
                            <h3 className="cal-popup-title" style={{ marginBottom: 4 }}>
                                {expandedDay.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h3>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {expandedDay.tasks.length} task{expandedDay.tasks.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="cal-expanded-list">
                            {expandedDay.tasks.map((task, i) => {
                                const type = getTaskType(task, expandedDay.date)
                                const overdue = isOverdue(task)
                                const color = overdue ? '#e2445c' : (type === 'deadline' ? getStatusColor(task.status) : '#6161ff')
                                const progress = getStatusProgress(task.status)
                                return (
                                    <div
                                        key={i}
                                        className={`cal-expanded-item ${overdue ? 'overdue' : ''}`}
                                        style={{ borderLeftColor: color }}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, task)}
                                        onDragEnd={onDragEnd}
                                        onClick={() => { setExpandedDay(null); setSelectedTask({ task, type, overdue, date: expandedDay.date }) }}
                                    >
                                        <div className="expanded-item-top">
                                            <span className="cal-task-dot" style={{ background: color }}></span>
                                            <span className="expanded-item-title">{task.title}</span>
                                            <span className="cal-popup-chip" style={{
                                                background: getStatusColor(task.status) + '22',
                                                color: getStatusColor(task.status),
                                                fontSize: 11, padding: '2px 8px', borderRadius: 20
                                            }}>
                                                {task.status || 'No Status'}
                                            </span>
                                            {overdue && <span className="cal-task-badge" style={{ background: '#e2445c' }}>⚠</span>}
                                        </div>
                                        {progress > 0 && (
                                            <div className="pill-progress-bar">
                                                <div className="pill-progress-fill" style={{ width: `${progress}%`, background: color }}></div>
                                            </div>
                                        )}
                                        <div className="expanded-item-meta">
                                            <span style={{ color: task._groupColor, fontSize: 11 }}>{task._groupTitle}</span>
                                            {task._deadlineDate && (
                                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                                    ⏰ {task._deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <p className="cal-popup-drag-hint">💡 Click a task for full details · Drag to reschedule</p>
                    </div>
                </div>
            )}
        </div>
    )
}
