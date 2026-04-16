import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { HiMenu, HiX } from 'react-icons/hi'
import Logo from './logo'

export function HomeHeader ({ boards }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    function toggleMenu() {
        setIsMenuOpen(!isMenuOpen)
    }

    return (
        <header className="home-header">
            <div className="header-content layout">
                <div className="header-logo-container">
                    <Logo />
                </div>
                
                <nav className={`header-nav items-center ${isMenuOpen ? 'mobile-open' : ''}`}>
                    <a href="https://incitedigital.com/about/" target="_blank" rel="noreferrer" onClick={() => setIsMenuOpen(false)}>About</a>
                    <a href="https://incitedigital.com/services/" target="_blank" rel="noreferrer" onClick={() => setIsMenuOpen(false)}>Services</a>
                    <a href="https://incitedigital.com/works/" target="_blank" rel="noreferrer" onClick={() => setIsMenuOpen(false)}>Case Studies</a>
                    <a href="https://incitedigital.com/blog/" target="_blank" rel="noreferrer" onClick={() => setIsMenuOpen(false)}>Blog</a>
                    
                    <Link to={'/auth/login'} className="mobile-only btn-client-zone" onClick={() => setIsMenuOpen(false)}>Client Zone</Link>
                </nav>

                <div className='header-btns flex items-center'>
                    <Link to={'/auth/login'} className="btn-client-zone">Client Zone</Link>
                    <a href="https://incitedigital.com/contact/" target="_blank" rel="noreferrer">
                        <button className='btn-contact'>Contact Us</button>
                    </a>
                </div>

                <div className="mobile-toggle-btn" onClick={toggleMenu}>
                    {isMenuOpen ? <HiX /> : <HiMenu />}
                </div>
            </div>

            {isMenuOpen && <div className="mobile-menu-overlay" onClick={toggleMenu}></div>}
        </header>
    )
}