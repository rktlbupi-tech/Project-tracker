import { Link } from 'react-router-dom'
import Logo from './logo'

export function HomeHeader ({ boards }) {
    return (
        <header className="home-header">
            <div className="header-content layout">
                <div className="header-logo-container">
                    <Logo />
                </div>
                
                <nav className="header-nav items-center">
                    <Link to="#">About</Link>
                    <Link to="#">Services</Link>
                    <Link to="#">Case Studies</Link>
                    <Link to="#">Blog</Link>
                </nav>

                <div className='header-btns flex items-center'>
                    <Link to={'/auth/login'} className="btn-client-zone">Client Zone</Link>
                    <Link to={boards?.length ? `/board/${boards[0]._id}` : '/auth/login'}>
                        <button className='btn-contact'>Contact Us</button>
                    </Link>
                </div>
            </div>
        </header>
    )
}