import axios from 'axios'
import { useState, useEffect, useCallback } from 'react'
import { ImgUploader } from '../cmps/login/img-uploader'
import { LoginPageHeader } from '../cmps/login/login-page-header'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { loadUsers, login, signup } from '../store/user.actions'
import { loadBoards } from '../store/board.actions'
import { boardService } from '../services/board.service'
import { useGoogleLogin } from '@react-oauth/google'
import { loggerService } from '../services/logger.service'

export function LoginSignup() {
    const [credentials, setCredentials] = useState({ username: '', password: '', fullname: '' })
    const [googleUser, setGoogleUser] = useState(null)
    const [isSignup, setIsSignup] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const returnTo = location.state?.returnTo
    const boards = useSelector(storeState => storeState.boardModule.boards)
    const users = useSelector(storeState => storeState.userModule.users)

    const googleLogin = useGoogleLogin({
        onSuccess: codeResponse => {
            setGoogleUser(codeResponse)
        },
        onError: errorResponse => loggerService.error('Google login error', errorResponse)
    })

    const checkGoogleCredentials = useCallback(async (credentials) => {
        try {
            const user = users.find(currUser => currUser.fullname === credentials.name && currUser.username === credentials.email)
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

            // Check for returnTo state (e.g. from an invite page)
            if (returnTo) {
                navigate(returnTo)
                return
            }

            // Check for pending invite (legacy)
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
        }
    }, [users, navigate])

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
        if (!users.length) loadUsers()
        if (!boards.length) loadBoards()
        onGoogleLogin()
    }, [googleUser, onGoogleLogin, users.length, boards.length])

    function handleChange(ev) {
        const field = ev.target.name
        const value = ev.target.value
        setCredentials({ ...credentials, [field]: value })
    }

    async function onSubmit(ev, isSignup) {
        ev.preventDefault()
        if (!credentials.username || !credentials.password) return
        try {
            if(isSignup) {
                if(!credentials.fullname) return 
                await signup(credentials)
            } else {
                await login(credentials)
            }

            // Check for returnTo state (e.g. from an invite page)
            if (returnTo) {
                navigate(returnTo)
                return
            }

            // Check for pending invite (legacy)
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
        }
    }

    function toggleSignup() {
        setIsSignup(!isSignup)
    }

    function onUploaded(imgUrl) {
        setCredentials({ ...credentials, imgUrl })
    }



    return (
        // TODO: Change header to the original header(option)
        // TODO: Change label to p
        // TODO: fix image uplouder 
        <div className="login-signup">
            <LoginPageHeader />
            <main className="main-content">
                <form className="form-container" onSubmit={(ev) => onSubmit(ev, isSignup)}>
                    <h1>{isSignup ? 'Create your Workio account here ' : 'Log in to your account'}</h1>
                    {isSignup && <ImgUploader onUploaded={onUploaded} />}
                    {!isSignup && <p className="login-explain">Enter your username and password</p>}
                    {isSignup && <p className="login-explain">Enter your details to get started</p>}
                    
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
                            placeholder="Username"
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

                    <button className="btn-next">{isSignup ? 'Sign up' : 'Log in'}</button>

                    <div className="split-line">
                        <p>{isSignup ? 'Or sign up with' : 'Or sign in with'}</p>
                    </div>

                    <button type="button" className="btn-login-google" onClick={() => googleLogin()}>
                        <img className="img-google-login" src="https://cdn.monday.com/images/logo_google_v2.svg" aria-hidden="true" alt="" />
                        <span>Google</span>
                    </button>

                    <div className="suggest-signup">
                        <span>{isSignup ? 'Already have an account?' : 'Don\'t have an account yet?'}</span>
                        {!isSignup && <Link to={'/auth/signup'} className="btn-signup" onClick={toggleSignup}>Sign up</Link>}
                        {isSignup && <Link to={'/auth/login'} className="btn-signup" onClick={toggleSignup}>Log in</Link>}
                    </div>
                </form>
            </main>
        </div>
    )
}
