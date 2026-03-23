import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { logout } from "../../store/user.actions"
import { BiLogIn } from 'react-icons/bi'
import { TbLogout } from 'react-icons/tb'
import { closeDynamicModal } from "../../store/board.actions"

export function LoginLogoutModal({ setIsLoginModalOpen }) {
    const user = useSelector(storeState => storeState.userModule.user)
    const guestImg = "https://res.cloudinary.com/du63kkxhl/image/upload/v1675013009/guest_f8d60j.png"

    function onLogout() {
        setIsLoginModalOpen(false)
        closeDynamicModal()
        logout()
    }

    return (
        <section className="login-logout-modal user-profile-card">
            {user ? (
                <div className="profile-container flex column">
                    <div className="user-header flex align-center">
                        <img src={user.imgUrl || guestImg} alt={user.fullname} className="profile-avatar" />
                        <div className="user-info flex column">
                            <span className="fullname">{user.fullname}</span>
                            <span className="username">{user.username}</span>
                        </div>
                    </div>
                    <div className="divider"></div>
                    <button className="logout-btn flex align-center" onClick={onLogout}>
                        <TbLogout className="icon" />
                        <span>Log out</span>
                    </button>
                </div>
            ) : (
                <div className="guest-container flex column">
                    <p className="guest-msg">You are not logged in</p>
                    <Link to={'/auth/login'} className="login-btn-link" onClick={() => setIsLoginModalOpen(false)}>
                        <button className="login-btn flex align-center">
                            <span>Log in</span>
                            <BiLogIn className="icon" />
                        </button>
                    </Link>
                </div>
            )}
        </section>
    )
}