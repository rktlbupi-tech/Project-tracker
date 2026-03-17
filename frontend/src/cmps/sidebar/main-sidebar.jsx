import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useState } from 'react'

import { AiOutlineStar, AiOutlineMenu } from 'react-icons/ai'
import { BsSun, BsMoon } from 'react-icons/bs'
import { VscTriangleLeft } from 'react-icons/vsc'
import { IoNotificationsOutline } from 'react-icons/io5'
import { closeDynamicModal } from '../../store/board.actions'
import { setUser } from '../../store/user.actions'
import { socketService } from '../../services/socket.service'
import WorkspaceIcon from './workspace-icon'
import { Tooltip } from '@mui/material'
import { NotificationList } from '../user/notification-list'
import { useEffect } from 'react'

const logo = require('../../assets/img/logo.png')
const guest = "https://res.cloudinary.com/du63kkxhl/image/upload/v1675013009/guest_f8d60j.png"

export function MainSidebar ({ setIsLoginModalOpen, setWorkspaceDisplay, setIsWorkspaceOpen }) {
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
    
    const pendingCount = user?.invitations?.filter(inv => inv.status === 'pending').length || 0

    useEffect(() => {
        const onInviteReceived = (invitation) => {
            console.log('Invitation received!', invitation)
            const updatedInvitations = [...(user?.invitations || []), invitation]
            const updatedUser = { ...user, invitations: updatedInvitations }
            setUser(updatedUser)
        }
        socketService.on('invitation-received', onInviteReceived)
        
        return () => {
             socketService.off('invitation-received', onInviteReceived)
        }
    }, [user]) // Re-bind whenever user changes to ensure latest user object in listener

    function onChooseIcon (icon) {
        setDisplay(icon)
        setWorkspaceDisplay(icon)
        setIsWorkspaceOpen(true)
        setIsNotificationOpen(false)
    }

    return (
        <section className="main-sidebar flex">
            <span className='open-workspace-btn'>
                <AiOutlineMenu onClick={() => setIsWorkspaceOpen(prev => !prev)} />
            </span>
            <Link to={'/'} className='icon-link'>
                <Tooltip title="Home" arrow>
                    <img className='home-img' src={logo} alt="logo" onClick={closeDynamicModal} />
                </Tooltip>
            </Link>
            <div className='tools-container flex column align-center'>
                <Tooltip title="Workspaces" arrow>
                    <div className="icon-container" onClick={() => onChooseIcon('board')} >
                        <WorkspaceIcon />
                        {display === 'board' && <VscTriangleLeft className="triangle-icon" />}
                    </div>
                </Tooltip>
                <Tooltip title="Favorites" arrow>
                    <div className='icon-container' onClick={() => onChooseIcon('starred')}>
                        < AiOutlineStar />
                        {display === 'starred' && <VscTriangleLeft className="triangle-icon" />}
                    </div>
                </Tooltip>
                
                <Tooltip title="Notifications" arrow>
                    <div 
                        className={`icon-container notification-icon ${isNotificationOpen ? 'active' : ''}`} 
                        onClick={(ev) => {
                            ev.stopPropagation()
                            setIsNotificationOpen(!isNotificationOpen)
                        }}
                    >
                        <IoNotificationsOutline />
                        {pendingCount > 0 && <span className="notification-badge">{pendingCount}</span>}
                    </div>
                </Tooltip>
            </div>

            {isNotificationOpen && user && (
                <NotificationList user={user} onClose={() => setIsNotificationOpen(false)} />
            )}

            <div className='bottom flex column align-center' style={{ gap: '16px' }}>
                <Tooltip title={`${theme === 'light' ? 'Dark' : 'Light'} mode`} arrow>
                    <div className="theme-toggle-btn icon-container" onClick={toggleTheme}>
                        {theme === 'light' ? <BsMoon /> : <BsSun />}
                    </div>
                </Tooltip>
                <Tooltip title="Login & Logout" arrow>
                    <img className='logged-user-img' src={(user && user.imgUrl) ? user.imgUrl : guest} alt="" onClick={() => setIsLoginModalOpen(prev => !prev)} />
                </Tooltip>
            </div>
        </section>
    )
}