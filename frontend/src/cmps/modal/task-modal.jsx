import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"

import { toggleModal, updateTaskAction } from "../../store/board.actions"

import { CgClose } from 'react-icons/cg'
import { GrHomeRounded } from 'react-icons/gr'
import { AiOutlineBold } from 'react-icons/ai'
import { RxUnderline } from 'react-icons/rx'
import { TbAlignRight, TbAlignCenter, TbAlignLeft } from 'react-icons/tb'

import { boardService } from "../../services/board.service"
import { utilService } from "../../services/util.service"
import { loggerService } from "../../services/logger.service"
import { CommentPreview } from "../task/comment-preview"
import { ActivityPreview } from "../activity-preview"
import { socketService, SOCKET_EMIT_SEND_MSG, SOCKET_EMIT_SET_TOPIC, SOCKET_EVENT_ADD_MSG } from "../../services/socket.service"

export function TaskModal({ task, board, groupId, setModalCurrTask }) {
    const user = useSelector(storeState => storeState.userModule.user)
    const [comment, setComment] = useState(boardService.getEmptyComment())
    const [isWriteNewUpdate, setIsWriteNewUpdate] = useState(false)
    const [taskActivities, setTaskActivities] = useState([])
    const [isShowUpdate, setIsShowUpdate] = useState(true)
    const [currTask, setCurrTask] = useState(task)
    const navigate = useNavigate()

    const addComment = useCallback((comment) => {
        currTask.comments.unshift(comment)
        setCurrTask({ ...currTask })
    }, [currTask])

    const loadTaskActivity = useCallback(() => {
        const taskActivities = board.activities.filter(activity => activity.task.id === task.id)
        setTaskActivities(taskActivities)
    }, [board.activities, task.id])

    useEffect(() => {
        loadTaskActivity()
        socketService.emit(SOCKET_EMIT_SET_TOPIC, task.id)
        socketService.on(SOCKET_EVENT_ADD_MSG, addComment)

        return () => {
            socketService.off(SOCKET_EVENT_ADD_MSG, addComment)
        }
    }, [task.id, loadTaskActivity, addComment])

    function onCloseModal() {
        navigate(`/board/${board._id}`)
        toggleModal(true)
        setModalCurrTask(null)
        setComment(boardService.getEmptyComment())
    }

    async function onUpdateTaskTitle(ev) {
        const value = ev.target.innerText
        task.title = value
        try {
            await updateTaskAction(board, groupId, task)
        } catch (err) {
            loggerService.error('Failed to save task title', err)
        }
    }

    async function onAddComment() {
        try {
            comment.id = utilService.makeId()
            if (user) {
                comment.byMember.fullname = user.fullname
                comment.byMember.imgUrl = user.imgUrl
            }
            currTask.comments.unshift(comment)
            socketService.emit(SOCKET_EMIT_SEND_MSG, comment)
            await updateTaskAction(board, groupId, currTask)
            setIsWriteNewUpdate(false)
            setCurrTask({ ...currTask })
            setComment(boardService.getEmptyComment())
        } catch (err) {
            loggerService.error('Failed to add comment', err)
        }
    }

    function close(ev) {
        ev.preventDefault()
        setIsWriteNewUpdate(false)
        setComment(boardService.getEmptyComment())
    }

    async function onRemoveComment(commentId) {
        try {
            currTask.comments = currTask.comments.filter(comment => comment.id !== commentId)
            updateTaskAction(board, groupId, currTask)
            setCurrTask({ ...currTask })
        } catch (err) {
            loggerService.error('Failed to remove comment', err)
        }
    }

    function onChangeTextStyle(ev, styleKey, align) {
        ev.preventDefault()
        const style = { ...comment.style }
        switch (styleKey) {
            case 'fontStyle':
                style.fontStyle = style.fontStyle === 'normal' ? 'italic' : 'normal'
                break;
            case 'fontWeight':
                style.fontWeight = style[styleKey] === 'normal' ? 'bold' : 'normal'
                break;
            case 'textDecoration':
                style[styleKey] = style[styleKey] === 'none' ? 'underline' : 'none'
                break;
            case 'textAlign':
                style[styleKey] = align
                break;
            default: return
        }
        setComment((prevComment) => ({ ...prevComment, style }))
    }

    function handleChange({ target }) {
        let { value, name: field } = target
        setComment((prevComment) => ({ ...prevComment, [field]: value }))
    }

    async function onEditComment(saveComment) {
        try {
            currTask.comments = currTask.comments.map(comment => (comment.id === saveComment.id) ? saveComment : comment)
            updateTaskAction(board, groupId, task)
            setCurrTask({ ...currTask })
        } catch (err) {
            loggerService.error('Failed to edit comment', err)
        }
    }
    return <section className='task-modal'>
        <div className="task-modal-header">
            <div className="header-top flex space-between align-center">
                <CgClose className="close-btn" onClick={onCloseModal} />
                <div className="modal-actions">
                    {/* Add more tools here if needed */}
                </div>
            </div>
            <div className="title">
                <blockquote contentEditable onBlur={onUpdateTaskTitle} suppressContentEditableWarning={true}>
                    {task.title}
                </blockquote>
            </div>
        </div>

        <div className="task-modal-type flex">
            <div onClick={() => setIsShowUpdate(true)} className={`type-tab ${isShowUpdate ? 'active' : ''}`}>
                <GrHomeRounded className="icon" />
                <span>Updates</span>
            </div>
            <div onClick={() => setIsShowUpdate(false)} className={`type-tab ${!isShowUpdate ? 'active' : ''}`}>
                <span>Activity Log</span>
            </div>
        </div>

        {!isShowUpdate && <div className="activity-container">
            <ul className="activities">
                {taskActivities.map((activity, idx) => (
                    <li key={idx}><ActivityPreview activity={activity} /></li>
                ))}
            </ul>
        </div>}

        {isShowUpdate && <section className="update-section">
            <div className="editor-wrapper">
                {!isWriteNewUpdate && (
                    <div className="placeholder-input flex align-center" onClick={() => setIsWriteNewUpdate(true)}>
                        <span className="text">Write an update...</span>
                    </div>
                )}
                {isWriteNewUpdate && (
                    <form className="modern-editor">
                        <div className="toolbar flex align-center">
                            <span onMouseDown={(ev) => onChangeTextStyle(ev, 'fontWeight')} title="Bold"><AiOutlineBold /></span>
                            <span onMouseDown={(ev) => onChangeTextStyle(ev, 'textDecoration')} title="Underline"><RxUnderline /></span>
                            <span onMouseDown={(ev) => onChangeTextStyle(ev, 'fontStyle')} title="Italic" style={{ fontSize: '18px', fontWeight: 500 }}>/</span>
                            <div className="divider"></div>
                            <span onMouseDown={(ev) => onChangeTextStyle(ev, 'textAlign', 'Left')} title="Align Left"><TbAlignLeft /></span>
                            <span onMouseDown={(ev) => onChangeTextStyle(ev, 'textAlign', 'Center')} title="Align Center"><TbAlignCenter /></span>
                            <span onMouseDown={(ev) => onChangeTextStyle(ev, 'textAlign', 'Right')} title="Align Right"><TbAlignRight /></span>
                        </div>
                        <textarea
                            name="txt"
                            placeholder="Share your progress..."
                            autoFocus
                            style={comment.style}
                            value={comment.txt}
                            onBlur={close}
                            onChange={handleChange}></textarea>
                        <div className="footer flex justify-end">
                            <button className="btn-save" onMouseDown={onAddComment}>Update</button>
                        </div>
                    </form>
                )}
            </div>

            <ul className="comments-list">
                {currTask.comments.map(comment => (
                    <li key={comment._id} className="comment-item">
                        <CommentPreview onRemoveComment={onRemoveComment} comment={comment} onEditComment={onEditComment} />
                    </li>
                ))}
            </ul>

            {currTask.comments.length === 0 && (
                <div className="no-updates-modern flex column align-center">
                    <img src={require('../../assets/img/empty_state_modern.png')} alt="Empty" />
                    <div className="msg-box">
                        <h3>No updates yet</h3>
                        <p>Share progress, ask questions, or tag teammates to get the conversation started.</p>
                    </div>
                </div>
            )}
        </section>}
    </section>
}