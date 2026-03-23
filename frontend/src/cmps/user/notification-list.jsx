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
        <section className="notification-list-sidebar">
            <div className="notification-header flex space-between align-center">
                <h3>Notifications</h3>
                <div className="header-actions flex">
                    <span className="action-link" onClick={markNotificationsRead}>Mark read</span>
                    <span className="action-link danger" onClick={clearNotifications}>Clear all</span>
                </div>
            </div>
            <div className="notification-content">
                {pendingInvitations.length === 0 && notifications.length === 0 && (
                    <div className="empty-notifications flex column align-center">
                        <p>No new notifications</p>
                    </div>
                )}
                
                {pendingInvitations.map(inv => (
                    <div key={inv.id} className="notification-item flex column inv-item">
                        <div className="inv-info flex align-center">
                            {inv.from.imgUrl ? <img src={inv.from.imgUrl} alt={inv.from.fullname} className="user-img" /> : <div className="user-avatar">{inv.from.fullname.substring(0,1)}</div>}
                            <p>
                                <strong>{inv.from.fullname}</strong> invited you to join <strong>{inv.board.title}</strong>
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
                            {notification.from.imgUrl ? <img src={notification.from.imgUrl} alt={notification.from.fullname} className="user-img" /> : <div className="user-avatar">{notification.from.fullname.substring(0,1)}</div>}
                            <p>
                                {notification.txt || (
                                    <>
                                        <strong>{notification.from.fullname}</strong> assigned you <strong>{notification.task.title}</strong>
                                    </>
                                )}
                            </p>
                        </div>
                        <span className="time">{utilService.calculateTime(notification.createdAt)}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}
