import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useState, useEffect } from 'react'

import { AiOutlineStar } from 'react-icons/ai'
import { BsSun, BsMoon } from 'react-icons/bs'
import { IoNotificationsOutline } from 'react-icons/io5'
import { TbLayoutGrid } from 'react-icons/tb'
import { closeDynamicModal } from '../../store/board.actions'
import { setUser } from '../../store/user.actions'
import { socketService } from '../../services/socket.service'
import { Tooltip } from '@mui/material'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { loggerService } from '../../services/logger.service'

const logo = require('../../assets/img/logo.png')
const guest = "https://res.cloudinary.com/du63kkxhl/image/upload/v1675013009/guest_f8d60j.png"

export function MainSidebar({ isWorkspaceOpen, setIsLoginModalOpen, setWorkspaceDisplay, setIsWorkspaceOpen }) {
    const [display, setDisplay] = useState('board')
    const [isNotificationOpen, setIsNotificationOpen] = useState(false)
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
    const user = useSelector(storeState => storeState.userModule.user)

    function toggleTheme() {
        setTheme(prev => prev === 'light' ? 'dark' : 'light')
    }

    useEffect(() => {
        // Request permission for native browser notifications on mount
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    useEffect(() => {
        document.documentElement.className = theme === 'dark' ? 'theme-dark' : ''
        localStorage.setItem('theme', theme)
    }, [theme])

    const showNativeNotification = (title, body, url = null) => {
        console.log('--- SHOWING NATIVE NOTIFICATION ---', { title, body })
        
        if (!('Notification' in window)) return

        if (Notification.permission === 'granted') {
            try {
                const n = new Notification(title, {
                    body: body,
                    tag: 'workio-alert'
                })

                n.onclick = () => {
                    window.focus()
                    if (url) window.location.href = url
                    n.close()
                }
            } catch (err) {
                console.error('Error in new Notification:', err)
            }
        } else {
            console.log('Notification permission state:', Notification.permission)
        }
    }

    useEffect(() => {
        const onInviteReceived = (invitation) => {
            loggerService.debug('Invitation received!', invitation)
            const updatedInvitations = [invitation, ...(user?.invitations || [])]
            const updatedUser = { ...user, invitations: updatedInvitations }
            setUser(updatedUser)

            const msg = `You were invited to: ${invitation.board.title}`
            toast.info(msg, { icon: '🔔' })

            // Showing it always for now so you can see it works
            showNativeNotification('Workio: New Invitation', msg, `/board/${invitation.board._id}`)
        }

        const onNotificationReceived = (notification) => {
            loggerService.info('Notification received!', notification)
            const updatedNotifications = [notification, ...(user?.notifications || [])]
            const updatedUser = { ...user, notifications: updatedNotifications }
            setUser(updatedUser)

            const msg = notification.txt || `New Alert: ${notification.type}`
            toast.success(msg)

            // Showing it always for now so you can see it works
            showNativeNotification('Workio Notification', msg)
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

    const { updateLastSeenNotifications } = require('../../store/user.actions')

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
