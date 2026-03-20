import React, { useEffect, useRef } from 'react'
import { respondToInvitation, markNotificationsRead, clearNotifications } from "../../store/user.actions"
import { loadBoards } from "../../store/board.actions"
import { utilService } from "../../services/util.service"
import { loggerService } from "../../services/logger.service"

import { useNavigate } from 'react-router-dom'

export function NotificationList({ user, onClose }) {
    const notificationRef = useRef()
    const navigate = useNavigate()

    useEffect(() => {
        function handleClickOutside(ev) {
            if (notificationRef.current && !notificationRef.current.contains(ev.target) && !ev.target.closest('.notification-icon')) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [onClose])
    const invitations = user.invitations || []
    const pendingInvitations = invitations.filter(inv => inv.status === 'pending')
    const notifications = user.notifications || []

    async function onAction(invitationId, status) {
        try {
            await respondToInvitation(invitationId, status)
            if (status === 'accepted') {
                loadBoards()
            }
        } catch (err) {
            loggerService.error('Had issues responding to invitation', err)
        }
    }

    function onNotificationClick(boardId) {
        navigate(`/board/${boardId}`)
        onClose()
    }

    return (
        <section className="notification-list" ref={notificationRef}>
            <div className="notification-header flex space-between align-center">
                <h3>Notifications</h3>
                <div className="header-actions flex">
                    <button className="mark-read-btn" onClick={markNotificationsRead}>Mark all as read</button>
                    <button className="clear-all-btn" onClick={clearNotifications}>Clear all</button>
                </div>
                <button className="close-btn" onClick={onClose}>&times;</button>
            </div>
            <div className="notification-content">
                {pendingInvitations.length === 0 && notifications.length === 0 && <p className="empty-msg">No new notifications</p>}
                
                {pendingInvitations.map(inv => (
                    <div key={inv.id} className="notification-item flex column inv-item">
                        <div className="inv-info flex align-center">
                            <img src={inv.from.imgUrl} alt={inv.from.fullname} className="user-img" />
                            <p>
                                <strong>{inv.from.fullname}</strong> invited you to join the board <strong>{inv.board.title}</strong>
                            </p>
                        </div>
                        <div className="inv-actions flex">
                            <button className="accept-btn" onClick={() => onAction(inv.id, 'accepted')}>Accept</button>
                            <button className="reject-btn" onClick={() => onAction(inv.id, 'rejected')}>Reject</button>
                        </div>
                        <span className="time">{utilService.calculateTime(inv.createdAt)}</span>
                    </div>
                ))}

                {notifications.map(notification => (
                    <div 
                        key={notification.id} 
                        className={`notification-item flex column task-item ${!notification.isRead ? 'unread' : ''}`} 
                        onClick={() => onNotificationClick(notification.board._id)}
                    >
                        <div className="inv-info flex align-center">
                            <img src={notification.from.imgUrl} alt={notification.from.fullname} className="user-img" />
                            <p>
                                <strong>{notification.from.fullname}</strong> assigned you a task <strong>{notification.task.title}</strong> on board <strong>{notification.board.title}</strong>
                            </p>
                        </div>
                        <span className="time">{utilService.calculateTime(notification.createdAt)}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}
