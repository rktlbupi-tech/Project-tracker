import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useState } from 'react'

import { AiOutlineStar } from 'react-icons/ai'
import { BsSun, BsMoon } from 'react-icons/bs'
import { VscTriangleLeft } from 'react-icons/vsc'
import { IoNotificationsOutline } from 'react-icons/io5'
import { TbLayoutGrid, TbLayoutSidebarLeftExpand } from 'react-icons/tb'
import { closeDynamicModal } from '../../store/board.actions'
import { setUser } from '../../store/user.actions'
import { socketService } from '../../services/socket.service'
import { Tooltip } from '@mui/material'
import { NotificationList } from '../user/notification-list'
import { useEffect } from 'react'

import { loggerService } from '../../services/logger.service'

const logo = require('../../assets/img/logo.png')
const guest = "https://res.cloudinary.com/du63kkxhl/image/upload/v1675013009/guest_f8d60j.png"

export function MainSidebar({ isWorkspaceOpen, setIsLoginModalOpen, setWorkspaceDisplay, setIsWorkspaceOpen }) {
    const [display, setDisplay] = useState('board')
    const [isNotificationOpen, setIsNotificationOpen] = useState(false)
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
    const user = useSelector(storeState => storeState.userModule.user)

    useEffect(() => {
        document.documentElement.className = theme === 'dark' ? 'theme-dark' : ''
        localStorage.setItem('theme', theme)
    }, [theme])

    function toggleTheme() {
        setTheme(prev => prev === 'light' ? 'dark' : 'light')
    }

    const pendingInvitationsCount = user?.invitations?.filter(inv => inv.status === 'pending').length || 0
    const pendingNotificationsCount = user?.notifications?.filter(noti => !noti.isRead && noti.createdAt > (user.lastSeenNotifications || 0)).length || 0
    const pendingCount = pendingInvitationsCount + pendingNotificationsCount

    useEffect(() => {
        const onInviteReceived = (invitation) => {
            loggerService.debug('Invitation received!', invitation)
            const updatedInvitations = [invitation, ...(user?.invitations || [])]
            const updatedUser = { ...user, invitations: updatedInvitations }
            setUser(updatedUser)
        }

        const onNotificationReceived = (notification) => {
            loggerService.info('Notification received!', notification)
            const updatedNotifications = [notification, ...(user?.notifications || [])]
            const updatedUser = { ...user, notifications: updatedNotifications }
            setUser(updatedUser)

            // Show a visual alert
            const toastContent = notification.txt || `New Notification: ${notification.type}`
            console.log('FLASHING NOTIFICATION:', toastContent)
        }

        socketService.on('invitation-received', onInviteReceived)
        socketService.on('notification-received', onNotificationReceived)

        return () => {
            socketService.off('invitation-received', onInviteReceived)
            socketService.off('notification-received', onNotificationReceived)
        }
    }, [user])

    function onChooseIcon(icon) {
        if (display === icon && isWorkspaceOpen) {
            setIsWorkspaceOpen(false)
        } else {
            setDisplay(icon)
            setWorkspaceDisplay(icon)
            setIsWorkspaceOpen(true)
        }
        setIsNotificationOpen(false)
    }

    const { updateLastSeenNotifications, markNotificationsRead, clearNotifications } = require('../../store/user.actions')

    function onToggleNotification(ev) {
        ev.stopPropagation()
        if (!isNotificationOpen) {
            // Update last seen to clear badge
            updateLastSeenNotifications()
        }
        setIsNotificationOpen(!isNotificationOpen)
    }

    return (
        <section className="main-sidebar flex">
            <span className='open-workspace-btn'>
                {/* <TbLayoutSidebarLeftExpand onClick={() => setIsWorkspaceOpen(prev => !prev)} /> */}
            </span>
            <Link to={'/'} className='icon-link'>
                <Tooltip title="Home" arrow>
                    <img className='home-img' src={logo} alt="logo" onClick={closeDynamicModal} />
                </Tooltip>
            </Link>
            <div className='tools-container flex column align-center'>
                <Tooltip title="Workspaces" placement="right" arrow>
                    <div className={`icon-container ${display === 'board' ? 'active' : ''}`} onClick={() => onChooseIcon('board')} >
                        <TbLayoutGrid />
                    </div>
                </Tooltip>

                <Tooltip title="Favorites" placement="right" arrow>
                    <div className={`icon-container ${display === 'starred' ? 'active' : ''}`} onClick={() => onChooseIcon('starred')}>
                        < AiOutlineStar />
                    </div>
                </Tooltip>

                <Tooltip title="Notifications" placement="right" arrow>
                    <div className={`icon-container notification-icon ${display === 'notifications' ? 'active' : ''}`} onClick={() => onChooseIcon('notifications')}>
                        <IoNotificationsOutline />
                        {user?.notifications?.some(n => !n.isRead) && <span className="notification-badge">{user.notifications.filter(n => !n.isRead).length}</span>}
                    </div>
                </Tooltip>
            </div>

            <div className='sidebar-bottom flex column align-center'>
                <Tooltip title={`${theme === 'light' ? 'Dark' : 'Light'} mode`} placement="right" arrow>
                    <div className="theme-toggle-btn" onClick={toggleTheme}>
                        {theme === 'light' ? <BsMoon /> : <BsSun />}
                    </div>
                </Tooltip>

                <div className="user-profile-section" onClick={() => setIsLoginModalOpen(prev => !prev)}>
                    <Tooltip
                        title={
                            <div className="user-tooltip-content">
                                <p className="name">{user?.fullname || 'Guest'}</p>
                                <p className="email">{user?.username || 'Click to log in'}</p>
                            </div>
                        }
                        placement="right"
                        arrow
                    >
                        <div className="avatar-wrapper">
                            <img
                                className='logged-user-img'
                                src={(user && user.imgUrl) ? user.imgUrl : guest}
                                alt={user?.fullname}
                            />
                            {user && <span className="online-indicator"></span>}
                        </div>
                    </Tooltip>
                </div>
            </div>
        </section>
    )
}
