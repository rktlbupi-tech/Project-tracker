import { useEffect, useState } from "react"
import { useSelector } from "react-redux"

import { loadBoard, saveBoard } from "../../store/board.actions"
import { inviteUser } from "../../store/user.actions"

import { VscTriangleUp } from 'react-icons/vsc'
import { CiSearch } from 'react-icons/ci'
import { CgClose } from 'react-icons/cg'

export function ModalMemberInvite({ board, setIsInviteModalOpen }) {
    const [filter, setFilter] = useState({ txt: '' })
    const [outBoardMembers, setOutBoardMembers] = useState([])
    const users = useSelector(storeState => storeState.userModule.users)

    useEffect(() => {
        setOutBoardMembers(users.filter(user => !board.members.some(member => member._id === user._id)))
    }, [])

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

    async function onInviteMember(member) {
        try {
            await inviteUser(member._id, board._id, board.title)
            setIsInviteModalOpen(false)
            alert(`Invitation sent to ${member.fullname}`)
        } catch (err) {
            console.log('cant invite member:', err)
        }
    }

    function handleChange({ target }) {
        let { value, name: field } = target
        setFilter((prevFilter) => ({ ...prevFilter, [field]: value }))
    }

    function onSubmit(ev) {
        ev.preventDefault()
        let members = users.filter(user => !board.members.some(member => member._id === user._id))
        if (filter.txt) {
            const regex = new RegExp(filter.txt, 'i')
            members = members.filter(member => regex.test(member.fullname) || regex.test(member.username))
        }

        setOutBoardMembers(members)
    }

    async function onInviteByEmail() {
        if (!filter.txt || !filter.txt.includes('@')) return
        try {
            await inviteUser(filter.txt, board._id, board.title)
            setIsInviteModalOpen(false)
            alert(`Email invitation sent to ${filter.txt}`)
        } catch (err) {
            console.log('cant invite email:', err)
        }
    }

    return (
        <section className="modal-member invite">
            <CgClose className="close-btn" onClick={() => setIsInviteModalOpen(false)} />
            <VscTriangleUp className="triangle-icon" />
            <section className="modal-member-content" >
                <ul className="taskMembers flex">
                    {
                        board.members.map(member => {
                            return <li key={member._id}>
                                <img src={member.imgUrl} alt="member-img" />
                                <span>{member.fullname}</span>
                                <span onClick={() => onRemoveMember(member._id)} className="remove">x</span>
                            </li>
                        })
                    }
                </ul>
                <div className="outTaskMembers">
                    <form className="search-div flex space-between" onSubmit={onSubmit}>
                        <input type="text"
                            placeholder="Search names"
                            name="txt"
                            value={filter.txt}
                            onChange={handleChange}
                        />
                        <button className="icon-container"><CiSearch className="icon" /></button>
                    </form>
                    <span>Suggested people</span>
                    {outBoardMembers.length > 0 && <ul className="out-member-list">
                        {
                            outBoardMembers.map(member => {
                                return <li key={member._id} onClick={() => onInviteMember(member)}>
                                    <img src={member.imgUrl} alt="member-img"/>
                                    <span>{member.fullname}</span>
                                </li>
                            })
                        }
                    </ul>}
                    {filter.txt.includes('@') && outBoardMembers.length === 0 && (
                        <div className="invite-by-email" style={{ marginTop: '10px', textAlign: 'center' }}>
                            <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#676879' }}>No user found. Send an email invitation?</p>
                            <button 
                                onClick={onInviteByEmail}
                                style={{
                                    backgroundColor: '#0073ea',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Invite {filter.txt}
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </section>
    )
}