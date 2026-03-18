import { useSelector } from "react-redux"
import { inviteService } from "../services/invite.service"
import { setCurrWorkspace, loadWorkspaces } from "../store/workspace.actions"
import { loadBoards } from "../store/board.actions"
import { Loader } from "../cmps/loader"
import { useCallback, useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"

export function InvitePage() {
    const { token } = useParams()
    const navigate = useNavigate()
    const user = useSelector(storeState => storeState.userModule.user)
    
    const [invite, setInvite] = useState(null)
    const [isProcessing, setIsProcessing] = useState(true)
    const [error, setError] = useState(null)

    const loadInvite = useCallback(async () => {
        try {
            const loadedInvite = await inviteService.getByToken(token)
            setInvite(loadedInvite)
        } catch (err) {
            setError('Invitation link is invalid or expired.')
        } finally {
            setIsProcessing(false)
        }
    }, [token])

    useEffect(() => {
        loadInvite()
    }, [loadInvite])

    async function onAcceptInvite() {
        if (!user) return
        
        setIsProcessing(true)
        try {
            await inviteService.accept(token)
            
            // Refresh store to ensure sidebars and board lists pick up the new membership
            await loadWorkspaces()
            if (invite.workspaceId) {
                setCurrWorkspace(invite.workspaceId)
                await loadBoards({ workspaceId: invite.workspaceId })
            }

            // Redirect to the board or workspace
            const targetUrl = invite.boardId ? `/board/${invite.boardId}` : `/board`
            navigate(targetUrl)
        } catch (err) {
            setError(err.err || 'Failed to accept invitation')
        } finally {
            setIsProcessing(false)
        }
    }

    if (isProcessing) return <Loader />

    if (error) {
        return (
            <div className="invite-page flex column align-center justify-center">
                <div className="error-card shadow">
                    <h1>Oops!</h1>
                    <p>{error}</p>
                    <button onClick={() => navigate('/')}>Go to Home</button>
                </div>
            </div>
        )
    }

    if (!invite) return null

    return (
        <div className="invite-page flex column align-center justify-center">
            <div className="invite-card shadow flex column align-center">
                <img src={invite.invitedBy.imgUrl} alt={invite.invitedBy.fullname} className="inviter-img" />
                <h1>You've been invited!</h1>
                <p><strong>{invite.invitedBy.fullname}</strong> has invited you to join them on Workio.</p>
                
                {!user && (
                    <div className="auth-required flex column align-center">
                        <p>Please log in or sign up to accept this invitation.</p>
                        <div className="flex actions">
                            <button className="auth-btn" onClick={() => navigate('/auth/login', { state: { returnTo: `/invite/${token}` } })}>Login</button>
                            <button className="auth-btn" onClick={() => navigate('/auth/signup', { state: { returnTo: `/invite/${token}` } })}>Sign Up</button>
                        </div>
                    </div>
                )}

                {user && user.username?.toLowerCase() !== invite.email?.toLowerCase() && (
                    <div className="wrong-user-alert">
                       <p>This invite was sent to <strong>{invite.email}</strong>, but you are logged in as <strong>{user.username}</strong>.</p>
                       <p>Please log out and log in with the correct account.</p>
                    </div>
                )}

                {user && user.username?.toLowerCase() === invite.email?.toLowerCase() && (
                    <button className="accept-btn" onClick={onAcceptInvite}>
                        Accept and Join
                    </button>
                )}
            </div>
        </div>
    )
}
