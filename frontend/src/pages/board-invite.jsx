import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { boardService } from '../services/board.service'

export function BoardInvite() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const user = useSelector(storeState => storeState.userModule.user)
    
    const [inviteData, setInviteData] = useState(null)
    const [error, setError] = useState('')
    const [isAccepting, setIsAccepting] = useState(false)

    useEffect(() => {
        try {
            const token = searchParams.get('token')
            if (!token) throw new Error('Invalid invitation link')

            // Decode base64 token
            const decodedToken = atob(token)
            const data = JSON.parse(decodedToken)
            setInviteData(data)
            
            // If user is not logged in, store the invite to process after login/signup
            if (!user) {
                sessionStorage.setItem('pendingInviteToken', token)
                sessionStorage.setItem('pendingInviteBoardId', data.boardId)
            }
        } catch (err) {
            console.error('Failed to parse invite token', err)
            setError('This invitation link appears to be invalid or expired.')
        }
    }, [searchParams, user])

    async function onAcceptInvite() {
        if (!user) {
            navigate('/auth/signup')
            return
        }

        try {
            setIsAccepting(true)
            await boardService.acceptInvite(inviteData.boardId)
            sessionStorage.removeItem('pendingInviteToken')
            sessionStorage.removeItem('pendingInviteBoardId')
            navigate(`/board/${inviteData.boardId}`)
        } catch (err) {
            console.error('Failed to accept invite', err)
            setError('Failed to join the board. You might already be a member.')
            setIsAccepting(false)
        }
    }

    if (error) {
        return (
            <div className="board-invite flex column align-center justify-center" style={{ height: '100vh', gap: '20px' }}>
                <img src="https://cdn.monday.com/images/logo_monday.png" alt="logo" style={{ width: '150px', marginBottom: '20px' }} />
                <h2>Oops!</h2>
                <p>{error}</p>
                <Link to="/" className="btn-signup" style={{ padding: '10px 20px', backgroundColor: '#0073ea', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>Go to Homepage</Link>
            </div>
        )
    }

    if (!inviteData) return <div className="board-invite flex justify-center align-center" style={{ height: '100vh' }}>Loading...</div>

    return (
        <div className="board-invite flex column align-center justify-center" style={{ height: '100vh', gap: '20px', backgroundColor: '#f0f3f5' }}>
            <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px' }}>
                <img src="https://cdn.monday.com/images/logo_monday.png" alt="logo" style={{ width: '150px', marginBottom: '30px' }} />
                <h2 style={{ marginBottom: '10px', fontSize: '24px' }}>You've been invited!</h2>
                
                <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
                    <p style={{ margin: '0 0 10px 0' }}><strong>{inviteData.fromUser.fullname}</strong> invited you to join:</p>
                    <h3 style={{ margin: 0, color: '#0073ea' }}>{inviteData.boardTitle}</h3>
                </div>

                <p style={{ color: '#666', marginBottom: '30px' }}>
                    {user 
                        ? `You are currently logged in as ${user.fullname}. Accept below to join.` 
                        : 'You will need to sign up or log in to accept this invitation.'
                    }
                </p>

                <button 
                    onClick={onAcceptInvite} 
                    disabled={isAccepting}
                    style={{ 
                        width: '100%', 
                        padding: '12px', 
                        backgroundColor: '#0073ea', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        fontSize: '16px',
                        cursor: isAccepting ? 'not-allowed' : 'pointer',
                        opacity: isAccepting ? 0.7 : 1
                    }}>
                    {isAccepting ? 'Joining...' : (user ? 'Accept Invitation' : 'Sign up to Join')}
                </button>
            </div>
        </div>
    )
}
