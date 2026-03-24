import React from 'react'

export function HomeFooter() {
    return (
        <footer className="home-footer">
            <div className="footer-content layout">
                <div className="footer-links flex space-between">
                    <div className="footer-section">
                        <h4>Navigation</h4>
                        <ul className="clean-list">
                            <li><a href="https://incitedigital.com/about/" target="_blank" rel="noreferrer">About</a></li>
                            <li><a href="https://incitedigital.com/works/" target="_blank" rel="noreferrer">Works</a></li>
                            <li><a href="https://incitedigital.com/services/" target="_blank" rel="noreferrer">Services</a></li>
                            <li><a href="https://incitedigital.com/blog/" target="_blank" rel="noreferrer">Blog</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Social</h4>
                        <ul className="clean-list">
                            <li><a href="https://www.instagram.com/incitedigitalagency/" target="_blank" rel="noreferrer">Instagram</a></li>
                            <li><a href="https://www.linkedin.com/company/incite-digital-llc/" target="_blank" rel="noreferrer">LinkedIn</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Legals</h4>
                        <ul className="clean-list">
                            <li><a href="https://incitedigital.com/privacy-policy/" target="_blank" rel="noreferrer">Privacy Policy</a></li>
                            <li><a href="https://incitedigital.com/terms-and-condition/" target="_blank" rel="noreferrer">Terms of Service</a></li>
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
