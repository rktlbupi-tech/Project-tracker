import axios from 'axios'
import { useState, useEffect, useCallback } from 'react'
import { ImgUploader } from '../cmps/login/img-uploader'
import { MiniLoader } from '../cmps/loader'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { loadUsers, login, signup } from '../store/user.actions'
import { loadBoards } from '../store/board.actions'
import { boardService } from '../services/board.service'
import { useGoogleLogin } from '@react-oauth/google'
import { loggerService } from '../services/logger.service'
import Logo from '../cmps/logo'

export function LoginSignup() {
    const [credentials, setCredentials] = useState({ username: '', password: '', fullname: '' })
    const [googleUser, setGoogleUser] = useState(null)
    const [isSignup, setIsSignup] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const navigate = useNavigate()
    const location = useLocation()
    const returnTo = location.state?.returnTo
    const boards = useSelector(storeState => storeState.boardModule.boards)
    const users = useSelector(storeState => storeState.userModule.users)

    // Sync isSignup with URL path (/auth/signup vs /auth/login)
    useEffect(() => {
        setIsSignup(location.pathname.includes('signup'))
    }, [location.pathname])

    const googleLogin = useGoogleLogin({
        onSuccess: codeResponse => {
            setGoogleUser(codeResponse)
        },
        onError: errorResponse => loggerService.error('Google login error', errorResponse)
    })

    const checkGoogleCredentials = useCallback(async (credentials) => {
        setIsLoading(true)
        setErrorMsg('')
        try {
            const user = Array.isArray(users) 
                ? users.find(currUser => currUser.fullname === credentials.name && currUser.username === credentials.email)
                : null;
            if (user) {
                await login(user)
            } else {
                await signup({
                    username: credentials.email,
                    password: credentials.id,
                    fullname: credentials.name,
                    imgUrl: credentials.picture
                })
            }

            if (returnTo) {
                navigate(returnTo)
                return
            }

            const pendingBoardId = sessionStorage.getItem('pendingInviteBoardId')
            if (pendingBoardId) {
                await boardService.acceptInvite(pendingBoardId)
                sessionStorage.removeItem('pendingInviteToken')
                sessionStorage.removeItem('pendingInviteBoardId')
                navigate(`/board/${pendingBoardId}`)
                return;
            }

            const fetchedBoards = await loadBoards()
            if (fetchedBoards && fetchedBoards.length > 0) {
                navigate(`/board/${fetchedBoards[0]._id}`)
            } else {
                navigate(`/board/`)
            }
        } catch (err) {
            loggerService.error('Error with Google credentials:', err)
            setErrorMsg('Google authentication failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [users, navigate, returnTo])

    const onGoogleLogin = useCallback(async () => {
        try {
            if (googleUser) {
                const user = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${googleUser.access_token}`, {
                    headers: {
                        Authorization: `Bearer ${googleUser.access_token}`,
                        Accept: 'application/json'
                    }
                })
                await checkGoogleCredentials(user.data)
            }
        } catch (error) {
            loggerService.error('Signup Error:', error)
        }
    }, [googleUser, checkGoogleCredentials])

    useEffect(() => {
        if (!Array.isArray(users) || !users.length) loadUsers()
        if (!boards.length) loadBoards()
        onGoogleLogin()
    }, [googleUser, onGoogleLogin, users, boards.length])


    function handleChange(ev) {
        const field = ev.target.name
        const value = ev.target.value
        setCredentials({ ...credentials, [field]: value })
    }

    async function onSubmit(ev, isSignup) {
        ev.preventDefault()
        if (!credentials.username || !credentials.password) return
        setIsLoading(true)
        setErrorMsg('')
        try {
            if(isSignup) {
                if(!credentials.fullname) {
                    setErrorMsg('Full name is required')
                    setIsLoading(false)
                    return
                }
                await signup(credentials)
            } else {
                await login(credentials)
            }

            if (returnTo) {
                navigate(returnTo)
                return
            }

            const pendingBoardId = sessionStorage.getItem('pendingInviteBoardId')
            if (pendingBoardId) {
                await boardService.acceptInvite(pendingBoardId)
                sessionStorage.removeItem('pendingInviteToken')
                sessionStorage.removeItem('pendingInviteBoardId')
                navigate(`/board/${pendingBoardId}`)
                return;
            }

            const fetchedBoards = await loadBoards()
            if (fetchedBoards && fetchedBoards.length > 0) {
                navigate(`/board/${fetchedBoards[0]._id}`)
            } else {
                navigate(`/board/`)
            }
        } catch (err) {
            loggerService.error('Error in login/signup:', err)
            const msg = err.response?.data?.msg || err.response?.data || 'Failed to authenticate. Please check your credentials.'
            setErrorMsg(typeof msg === 'string' ? msg : 'An unexpected error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    function toggleSignup() {
        setIsSignup(!isSignup)
    }

    function onUploaded(imgUrl) {
        setCredentials({ ...credentials, imgUrl })
    }

    return (
        <div className="login-signup">
            <header className="login-header">
                <Logo />
            </header>
            <main className="main-content">
                <form className="form-container" onSubmit={(ev) => onSubmit(ev, isSignup)}>
                    <h1>{isSignup ? 'Create Account' : 'Log in to Workio'}</h1>
                    <p className="login-explain">
                        {isSignup ? 'Get started for free today.' : 'Enter your details to access your dashboard.'}
                    </p>

                    {errorMsg && <div className="error-message">{errorMsg}</div>}
                    
                    {isSignup && <div className="uploader-stack"><ImgUploader onUploaded={onUploaded} /></div>}
                    
                    <div className="inputs-container">
                        {isSignup && 
                        <input
                            type="text"
                            name="fullname"
                            value={credentials.fullname}
                            placeholder="Full name"
                            onChange={handleChange}
                            required
                            autoFocus
                        />}
                        <input
                            type="text"
                            name="username"
                            value={credentials.username}
                            placeholder="Email or Username"
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="password"
                            name="password"
                            value={credentials.password}
                            placeholder="Password"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button className="btn-next" disabled={isLoading}>
                        {isLoading ? <MiniLoader /> : (isSignup ? 'Sign up' : 'Log in')}
                    </button>

                    <div className="split-line">
                        <p>OR</p>
                    </div>

                    <button type="button" className="btn-login-google" onClick={() => googleLogin()} disabled={isLoading}>
                        <img className="img-google-login" src="https://cdn.monday.com/images/logo_google_v2.svg" aria-hidden="true" alt="" />
                        <span>Continue with Google</span>
                    </button>

                    <div className="suggest-signup">
                        <span>{isSignup ? 'Already have an account?' : 'Don\'t have an account?'}</span>
                        {!isSignup && <Link to={'/auth/signup'} className="btn-signup" onClick={toggleSignup}>Sign up</Link>}
                        {isSignup && <Link to={'/auth/login'} className="btn-signup" onClick={toggleSignup}>Log in</Link>}
                    </div>
                </form>
            </main>
        </div>
    )
}
