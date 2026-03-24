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
                    <a href="https://incitedigital.com/about/" target="_blank" rel="noreferrer">About</a>
                    <a href="https://incitedigital.com/services/" target="_blank" rel="noreferrer">Services</a>
                    <a href="https://incitedigital.com/works/" target="_blank" rel="noreferrer">Case Studies</a>
                    <a href="https://incitedigital.com/blog/" target="_blank" rel="noreferrer">Blog</a>
                </nav>

                <div className='header-btns flex items-center'>
                    <Link to={'/auth/login'} className="btn-client-zone">Client Zone</Link>
                    <a href="https://incitedigital.com/contact/" target="_blank" rel="noreferrer">
                        <button className='btn-contact'>Contact Us</button>
                    </a>
                </div>
            </div>
        </header>
    )
}