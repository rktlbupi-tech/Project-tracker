import React from 'react'
import { respondToInvitation } from "../../store/user.actions"
import { loadBoards } from "../../store/board.actions"
import { utilService } from "../../services/util.service"
import { loggerService } from "../../services/logger.service"

export function NotificationList({ user, onClose }) {
    const invitations = user.invitations || []
    const pendingInvitations = invitations.filter(inv => inv.status === 'pending')

    async function onAction(invitationId, status) {
        try {
            await respondToInvitation(invitationId, status)
            if (status === 'accepted') {
                // Refresh boards to show the new one
                loadBoards()
            }
        } catch (err) {
            loggerService.error('Had issues responding to invitation', err)
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
            </div>
        </section>
    )
}
