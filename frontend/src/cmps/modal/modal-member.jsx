import { useEffect, useState, useMemo } from "react"
import { useSelector } from "react-redux"

import { setDynamicModalObj } from "../../store/board.actions"
import { CiSearch } from 'react-icons/ci'
import { VscTriangleUp } from 'react-icons/vsc'

export function ModalMember({ dynamicModalObj }) {

    const [filter, setFilter] = useState({ txt: '' })
    const [outTaskMembers, setOutTaskMembers] = useState([])
    const board = useSelector(storeState => storeState.boardModule.board)
    
    const taskMembers = useMemo(() => {
        if (!dynamicModalObj.task?.memberIds) return []
        return dynamicModalObj.task.memberIds.map(memberId => {
            return board.members.find(member => member._id === memberId)
        }).filter(Boolean)
    }, [board.members, dynamicModalObj.task.memberIds])

    useEffect(() => {
        setOutTaskMembers(board.members.filter(member => !taskMembers.find(tm => tm._id === member._id)))
    }, [board.members, taskMembers])

    function onRemoveMember(RemoveTaskMember) {
        dynamicModalObj.activity.from = 'Remove'
        dynamicModalObj.activity.to = RemoveTaskMember.imgUrl
        const members = taskMembers.filter(taskMember => taskMember._id !== RemoveTaskMember._id)
        const membersIds = members.map(taskMember => taskMember._id)
        dynamicModalObj.onTaskUpdate('memberIds', membersIds, dynamicModalObj.activity)
        dynamicModalObj.isOpen = false
        setDynamicModalObj(dynamicModalObj)
    }

    function onAddMember(taskMember) {
        dynamicModalObj.activity.from = 'Added'
        dynamicModalObj.activity.to = taskMember.imgUrl
        const membersIds = [...dynamicModalObj.task.memberIds, taskMember._id]
        dynamicModalObj.onTaskUpdate('memberIds', membersIds, dynamicModalObj.activity)
        dynamicModalObj.isOpen = false
        setDynamicModalObj(dynamicModalObj)
    }

    function handleChange({ target }) {
        let { value, name: field } = target
        setFilter((prevFilter) => ({ ...prevFilter, [field]: value }))
    }

    function onSubmit(ev) {
        ev.preventDefault()
        let members = board.members.filter(member => !taskMembers.find(tm => tm._id === member._id))
        if (filter.txt) {
            const regex = new RegExp(filter.txt, 'i')
            members = members.filter(member => regex.test(member.fullname))
        }
        setOutTaskMembers(members)
    }

    return (
        <section className="modal-member">
            <VscTriangleUp className="triangle-icon" />
            <section className="modal-member-content" >
                <ul className="taskMembers">
                    {
                        taskMembers.map(taskMember => {
                            if (!taskMember) return null
                            return <li key={taskMember._id}>
                                <img src={taskMember.imgUrl} alt="member-img" />
                                <span>{taskMember.fullname}</span>
                                <span onClick={() => onRemoveMember(taskMember)} className="remove">x</span>
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
                    {outTaskMembers.length > 0 && <ul className="out-member-list">
                        {
                            outTaskMembers.map(taskMember => {
                                return <li key={taskMember._id} onClick={() => onAddMember(taskMember)}>
                                    <img src={taskMember.imgUrl} alt="member-img" />
                                    <span>{taskMember.fullname}</span>
                                </li>
                            })
                        }
                    </ul>}
                </div>
            </section>
        </section>
    )
}