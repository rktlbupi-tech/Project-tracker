import { useEffect, useState } from "react"
import { useSelector } from "react-redux"

import { loadBoard, saveBoard } from "../../store/board.actions"
import { inviteService } from "../../services/invite.service"

import { VscTriangleUp } from 'react-icons/vsc'
import { CiSearch } from 'react-icons/ci'
import { CgClose } from 'react-icons/cg'

export function ModalMemberInvite({ board, setIsInviteModalOpen }) {
    const [filter, setFilter] = useState({ txt: '' })
    const users = useSelector(storeState => storeState.userModule.users)
    const [outBoardMembers, setOutBoardMembers] = useState([])

    useEffect(() => {
        // Filter users who are not yet members
        const filtered = users.filter(user => !board.members.some(member => member._id === user._id))
        setOutBoardMembers(filtered)
    }, [users, board.members])

    async function onRemoveMember(removeMemberId) {
        try {
            board.members = board.members.filter(member => member._id !== removeMemberId)
            board.groups.forEach(group => {
                group.tasks.forEach(task => task.memberIds = removeMemberFromTask(task, removeMemberId))
            })
            await saveBoard(board)
            loadBoard(board._id)
            setIsInviteModalOpen(false)
        } catch (err) {
            console.log('cant save board:', err)
        }
    }

    function removeMemberFromTask(task, removeMemberId) {
        return task.memberIds.filter(memberId => memberId !== removeMemberId)
    }

    function handleChange({ target }) {
        let { value, name: field } = target
        setFilter((prevFilter) => ({ ...prevFilter, [field]: value }))
    }

    async function onInvite(targetEmail = filter.txt) {
        if (!targetEmail) return

        if (!targetEmail.includes('@')) {
            alert('Please enter a valid email address')
            return
        }

        try {
            // Include workspaceId if board has one
            await inviteService.create({
                email: targetEmail,
                boardId: board._id,
                workspaceId: board.workspaceId
            })
            setIsInviteModalOpen(false)
            alert(`Invitation sent to ${targetEmail}`)
        } catch (err) {
            console.log('cant invite:', err)
            alert('Failed to send invitation')
        }
    }

    function onSubmit(ev) {
        ev.preventDefault()
        onInvite()
    }

    const suggestions = outBoardMembers.filter(m =>
        m.fullname.toLowerCase().includes(filter.txt.toLowerCase()) ||
        m.username.toLowerCase().includes(filter.txt.toLowerCase())
    )

    return (
        <section className="modal-member invite">
            <CgClose className="close-btn" onClick={() => setIsInviteModalOpen(false)} />
            <VscTriangleUp className="triangle-icon" />

            <section className="modal-member-content">
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Invite to board</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Collaborate with others by sending an email invitation.</p>

                <form className="search-div flex column" onSubmit={onSubmit} style={{ gap: '12px', width: '100%', border: 'none' }}>
                    <div className="flex align-center" style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px 12px', backgroundColor: 'var(--bg-secondary)' }}>
                        <input type="text"
                            placeholder="Type email address..."
                            name="txt"
                            value={filter.txt}
                            onChange={handleChange}
                            style={{ border: 'none', outline: 'none', flex: 1, padding: '8px', fontSize: '14px', background: 'transparent', color: 'var(--text-primary)' }}
                            autoFocus
                        />
                        <CiSearch style={{ fontSize: '20px', color: 'var(--text-secondary)' }} />
                    </div>

                    <button
                        type="submit"
                        className="btn-invite-main"
                        disabled={!filter.txt.includes('@')}
                        style={{
                            backgroundColor: filter.txt.includes('@') ? '#0073ea' : 'var(--bg-secondary)',
                            color: filter.txt.includes('@') ? 'white' : 'var(--text-secondary)',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '4px',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: filter.txt.includes('@') ? 'pointer' : 'not-allowed',
                            width: '100%',
                            transition: 'all 0.2s'
                        }}
                    >
                        Send Invitation
                    </button>
                </form>

                {filter.txt && suggestions.length > 0 && (
                    <div className="suggestions-section" style={{ marginTop: '15px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Suggested people</span>
                        <ul className="out-member-list" style={{ marginTop: '8px', listStyle: 'none', padding: 0 }}>
                            {suggestions.map(member => (
                                <li key={member._id} onClick={() => onInvite(member.username)}
                                    style={{ padding: '8px', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={member.imgUrl} alt={member.fullname} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                    <div className="flex column">
                                        <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{member.fullname}</span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{member.username}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="members-section" style={{ marginTop: '25px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Board members ({board.members.length})</span>
                    <ul className="taskMembers flex" style={{ marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        {board.members.map(member => (
                            <li key={member._id} className="flex align-center" style={{ padding: '4px 8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', gap: '6px' }}>
                                <img src={member.imgUrl} alt={member.fullname} style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                                <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{member.fullname}</span>
                                <span onClick={() => onRemoveMember(member._id)} className="remove" style={{ cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '4px' }}>&times;</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </section>
    )
}