import React, { Suspense, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { HomeHeader } from '../cmps/home-header'
import { loadBoards } from '../store/board.actions'
import { Loader } from '../cmps/loader'
import { useNavigate } from 'react-router-dom'
import { SlantedMarquee } from '../cmps/slanted-marquee'
import { HomeFooter } from '../cmps/home-footer'

const founder1 = require('../assets/img/founder_1.png')
const founder2 = require('../assets/img/founder_2.png')
const heroGadget = require('../assets/img/hero_gadget.png')
const clientLogos = require('../assets/img/client_logos_strip.png')
const heroWork = require('../assets/img/hero_work.png')

export default function HomePage() {
    const boards = useSelector(storeState => storeState.boardModule.boards)
    const user = useSelector(storeState => storeState.userModule.user)
    const navigate = useNavigate()

    useEffect(() => {
        if (user) {
            if (boards.length) navigate(`/board/${boards[0]._id}`)
            else navigate('/board')
        }
    }, [user, boards, navigate])

    useEffect(() => {
        loadBoards()
    }, [])

    return (
        <Suspense fallback={<Loader />}>
            <HomeHeader boards={boards} />
            <section className='home-page'>

                {/* Hero Section */}
                <div className="hero-section layout">
                    <div className="trusted-badge">
                        <div className="founder-imgs">
                            <img src={founder1} alt="founder" />
                            <img src={founder2} alt="founder" />
                        </div>
                        <span>Join 50,000+ happy teams</span>
                    </div>

                    <h1 className="main-title">
                        A Platform Built for a <img className="inline-img circle" src={heroGadget} alt="gadget" /> New Way of Working
                        & <img className="inline-img person" src={heroWork} alt="work" /> <span className="highlight-inline">Productivity</span> Together.
                    </h1>

                    <p className="sub-title">
                        Everything you need to manage your team, track results, and scale effortlessly.
                        From simple tasks to complex roadmaps.
                    </p>

                    <button className="btn-start-project" onClick={() => navigate('/auth/signup')}>
                        Get Started for Free →
                    </button>
                </div>

                {/* Features Curvy Cards Section */}
                <div className="features-section layout">
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="card-icon">🏗️</div>
                            <h3>Project Planning</h3>
                            <p>Map out your roadmaps and track every milestone with ease.</p>
                        </div>
                        <div className="feature-card">
                            <div className="card-icon">⚡</div>
                            <h3>Agile Workflow</h3>
                            <p>Speed up deployment with Kanban boards and automated task flows.</p>
                        </div>
                        <div className="feature-card">
                            <div className="card-icon">📊</div>
                            <h3>Real-time Insights</h3>
                            <p>Make data-driven decisions with built-in analytics and reports.</p>
                        </div>
                    </div>
                </div>

                {/* Clients Section */}
                <div className="client-logos layout">
                    <p>Powering teams at</p>
                    <div className="logos-strip">
                        <img src={clientLogos} alt="clients" />
                    </div>
                </div>

                {/* Marquee Section */}
                <div className="marquee-section">
                    <SlantedMarquee
                        items={['Task Management', 'Agile Boards', 'Timeline View', 'Workload Distribution', 'Gantt Charts']}
                        direction="left"
                        color="blue"
                    />
                    <SlantedMarquee
                        items={['Team Collaboration', 'File Sharing', 'Real-time Updates', 'Custom Automations', 'Integrations']}
                        direction="right"
                        color="black"
                    />
                </div>

                {/* Curved CTA Section */}
                <div className="cta-section layout">
                    <h2>Work Smarter</h2>
                    <div className="cta-content">
                        <h3>Break silos and move faster as a team.</h3>
                        <p>Join thousands of organizations using workio to deliver faster results.</p>
                        <button onClick={() => navigate('/auth/login')}>Start managing</button>
                    </div>
                </div>

                <HomeFooter />
            </section>
        </Suspense>
    )
}
