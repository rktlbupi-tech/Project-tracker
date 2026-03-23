import { useEffect, useMemo, useState } from "react"
import { CgClose } from "react-icons/cg"
import { useNavigate } from "react-router-dom"
import { toggleModal, updateTaskAction } from "../../store/board.actions"
import { ActivityPreview } from "../activity-preview"
import { LastViewed } from "../last-viewed"
import { CommentPreview } from "../task/comment-preview"
import { BsCalendar3, BsArrowRight } from "react-icons/bs"
import { MdOutlineAddTask } from "react-icons/md"
import { IoTimeOutline } from "react-icons/io5"
import { utilService } from "../../services/util.service"

const guest = "https://res.cloudinary.com/du63kkxhl/image/upload/v1675013009/guest_f8d60j.png"

export function BoardActivityModal({ board, activityLog }) {
    const navigate = useNavigate()
    const [view, setView] = useState(activityLog)
    const [updatesTab, setUpdatesTab] = useState('calendar') // 'calendar' | 'comments'

    const tasks = useMemo(() => {
        return board.groups.reduce((acc, group) => {
            acc.push(...group.tasks)
            return acc
        }, [])
    }, [board])

    function onCloseModal() {
        navigate(`/board/${board._id}`)
        toggleModal(true)
    }
    async function onRemoveComment(commentId, taskId) {
        try {
            const task = tasks.find(t => t.id === taskId)
            const group = board.groups.find(g => g.tasks.some(t => t.id === taskId))
            task.comments = task.comments.filter(c => c.id !== commentId)
            updateTaskAction(board, group.id, task)
        } catch (err) {
            console.log('err:', err)
        }
    }

    async function onEditComment(saveComment, taskId) {
        try {
            const task = tasks.find(t => t.id === taskId)
            const group = board.groups.find(g => g.tasks.some(t => t.id === taskId))
            task.comments = task.comments.map(c => (c.id === saveComment.id) ? saveComment : c)
            updateTaskAction(board, group.id, task)
        } catch (err) {
            console.log('err:', err)
        }
    }

    const calendarUpdates = (board.calendarUpdates || []).slice().sort((a, b) => b.createdAt - a.createdAt)

    return (
        <section className="board-activity-modal">
            <div className="board-activity-header">
                <CgClose className="close-btn" onClick={onCloseModal} />
                <h3 className="board-title">{board.title} <span>Log</span></h3>
                <div className="views flex">
                    <span className={view === 'activity' ? 'active' : ''} onClick={() => setView('activity')}>Activity</span>
                    <span className={view === 'last-viewed' ? 'active' : ''} onClick={() => setView('last-viewed')}>Last Viewed</span>
                    <span className={view === 'updates' ? 'active' : ''} onClick={() => setView('updates')}>Updates</span>
                </div>
            </div>

            <div className="board-activity-content">

                {/* ── Activity tab ── */}
                {view === 'activity' &&
                    board.activities.map((activity, idx) => (
                        <li key={idx}><ActivityPreview activity={activity} /></li>
                    ))
                }

                {/* ── Last Viewed tab ── */}
                {view === 'last-viewed' &&
                    <section className="last-viewed">
                        <div className="title flex space-between">
                            <span>Name</span>
                            <span>Last viewed</span>
                        </div>
                        {(() => {
                            const usersMap = {}
                            board.members.forEach(m => usersMap[m._id] = { ...m, lastViewed: null })
                            board.activities.forEach(activity => {
                                if (activity.byMember) {
                                    const uid = activity.byMember._id
                                    if (!usersMap[uid]) {
                                        usersMap[uid] = { ...activity.byMember, lastViewed: activity.createdAt }
                                    } else if (!usersMap[uid].lastViewed || activity.createdAt > usersMap[uid].lastViewed) {
                                        usersMap[uid].lastViewed = activity.createdAt
                                    }
                                }
                            })
                            return Object.values(usersMap).map(member => (
                                <li key={member._id}><LastViewed member={member} /></li>
                            ))
                        })()}
                    </section>
                }

                {/* ── Updates tab ── */}
                {view === 'updates' &&
                    <section className="update">

                        {/* Sub-toggle */}
                        <div className="updates-sub-tabs">
                            <button
                                className={`updates-sub-btn ${updatesTab === 'calendar' ? 'active' : ''}`}
                                onClick={() => setUpdatesTab('calendar')}
                            >
                                <BsCalendar3 /> Calendar
                            </button>
                            <button
                                className={`updates-sub-btn ${updatesTab === 'comments' ? 'active' : ''}`}
                                onClick={() => setUpdatesTab('comments')}
                            >
                                Comments
                            </button>
                        </div>

                        {/* Calendar Changes Log */}
                        {updatesTab === 'calendar' && (
                            <div className="calendar-updates-list">
                                {calendarUpdates.length === 0 ? (
                                    <div className="cal-updates-empty">
                                        <BsCalendar3 className="cal-updates-empty-icon" />
                                        <p>No calendar changes yet.</p>
                                        <span>Drag tasks or add tasks from the Calendar view to see logs here.</span>
                                    </div>
                                ) : (
                                    calendarUpdates.map((entry, idx) => (
                                        <div key={entry.id || idx} className="cal-update-entry">
                                            <div className="cal-update-avatar">
                                                {/* Fallback initials behind the image */}
                                                <div className="avatar-fallback" style={{ backgroundColor: utilService.getLabelColor(entry.byMember?.fullname || 'Guest') }}>
                                                    {(entry.byMember?.fullname || 'G').charAt(0).toUpperCase()}
                                                </div>
                                                <img
                                                    src={entry.byMember?.imgUrl || guest}
                                                    alt=""
                                                    title={entry.byMember?.fullname}
                                                />
                                                <div className={`cal-update-icon-badge ${entry.action}`}>
                                                    {entry.action === 'reschedule'
                                                        ? <BsArrowRight />
                                                        : <MdOutlineAddTask />
                                                    }
                                                </div>
                                            </div>
                                            <div className="cal-update-body">
                                                <div className="cal-update-label">{entry.label}</div>
                                                <div className="cal-update-meta">
                                                    <IoTimeOutline />
                                                    <span>{utilService.calculateTime(entry.createdAt)}</span>
                                                    <span className="cal-update-dot">·</span>
                                                    <span>{new Date(entry.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Comments */}
                        {updatesTab === 'comments' && (
                            <div className="comments-list">
                                {tasks.map(task =>
                                    task.comments.map(comment => (
                                        <li key={comment._id}>
                                            <CommentPreview
                                                onRemoveComment={onRemoveComment}
                                                comment={comment}
                                                onEditComment={onEditComment}
                                                taskId={task.id}
                                            />
                                        </li>
                                    ))
                                )}
                            </div>
                        )}
                    </section>
                }
            </div>
        </section>
    )
}