import React from 'react'
import { respondToInvitation } from "../../store/user.actions"
import { loadBoards } from "../../store/board.actions"
import { utilService } from "../../services/util.service"
import { UserAvatar } from "../user-avatar"

export function NotificationList({ user, onClose }) {
    const invitations = user.invitations || []
    const pendingInvitations = invitations.filter(inv => {
        const isPending = inv.status === 'pending'
        const isExpired = inv.expiresAt && inv.expiresAt < Date.now()
        return isPending && !isExpired
    })

    function getExpiryText(expiresAt) {
        if (!expiresAt) return ''
        const diff = expiresAt - Date.now()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        if (hours > 0) return `Expires in ${hours}h`
        const minutes = Math.floor(diff / (1000 * 60))
        return `Expires in ${minutes}m`
    }

    async function onAction(invitationId, status) {
        try {
            await respondToInvitation(invitationId, status)
            if (status === 'accepted') {
                // Refresh boards to show the new one
                loadBoards()
            }
        } catch (err) {
            console.log('Had issues responding to invitation', err)
        }
    }

    return (
        <section className="notification-list">
            <div className="notification-header flex space-between align-center">
                <h3>Notifications</h3>
                <button className="close-btn" onClick={onClose}>&times;</button>
            </div>
            <div className="notification-content">
                {pendingInvitations.length === 0 && <p className="empty-msg">No new notifications</p>}
                {pendingInvitations.map(inv => (
                    <div key={inv.id} className="notification-item flex column">
                        <div className="inv-info flex align-center">
                            <UserAvatar user={inv.from} />
                            <p>
                                {inv.type === 'task-assigned' ? (
                                    <>
                                        <strong>{inv.from.fullname}</strong> assigned you to task <strong>{inv.task.title}</strong> on board <strong>{inv.board.title}</strong>
                                    </>
                                ) : (
                                    <>
                                        <strong>{inv.from.fullname}</strong> invited you to join the board <strong>{inv.board.title}</strong>
                                    </>
                                )}
                            </p>
                        </div>
                        <div className="inv-actions flex align-center space-between" style={{ width: '100%', marginLeft: '0', paddingLeft: '44px' }}>
                            <div className="flex gap-8">
                                {inv.type === 'task-assigned' ? (
                                    <button className="accept-btn" style={{ backgroundColor: '#6161FF', borderColor: '#6161FF' }} onClick={() => onAction(inv.id, 'cleared')}>Got it!</button>
                                ) : (
                                    <>
                                        <button className="accept-btn" onClick={() => onAction(inv.id, 'accepted')}>Accept</button>
                                        <button className="reject-btn" onClick={() => onAction(inv.id, 'rejected')}>Reject</button>
                                    </>
                                )}
                            </div>
                            <span className="expiry-timer" style={{ fontSize: '10px', color: '#d73a49' }}>
                                {getExpiryText(inv.expiresAt)}
                            </span>
                        </div>
                        <span className="time">{utilService.calculateTime(inv.createdAt)}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}
