import React from 'react'

export function HomeFooter() {
    return (
        <footer className="home-footer">
            <div className="footer-content layout">
                <div className="footer-links flex space-between">
                    <div className="footer-section">
                        <h4>Navigation</h4>
                        <ul className="clean-list">
                            <li>About</li>
                            <li>Works</li>
                            <li>Services</li>
                            <li>Blog</li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Social</h4>
                        <ul className="clean-list">
                            <li>Instagram</li>
                            <li>LinkedIn</li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Legals</h4>
                        <ul className="clean-list">
                            <li>Privacy Policy</li>
                            <li>Terms of Service</li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom flex column items-start">
                    <p>© 2026 workio. All rights reserved.</p>
                    <h1 className="footer-logo-title">workio</h1>
                </div>
            </div>
        </footer>
    )
}
