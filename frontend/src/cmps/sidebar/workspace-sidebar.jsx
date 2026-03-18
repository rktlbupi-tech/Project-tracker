import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'

import { loadBoards } from '../../store/board.actions'
import { loadWorkspaces, setCurrWorkspace } from '../../store/workspace.actions'
import { boardService } from '../../services/board.service'

import { MdKeyboardArrowRight } from 'react-icons/md'
import { MdKeyboardArrowLeft } from 'react-icons/md'
import WorkspaceBoard from './workspace/workspace-board'
import { useCallback } from 'react'
import WorkspaceFavorite from './workspace/workspace-favorite'
import { Tooltip } from '@mui/material'

export function WorkspaceSidebar ({ workspaceDisplay, setIsCreateModalOpen, setIsWorkspaceOpen, isWorkspaceOpen, setWorkspaceDisplay, setIsCreateWorkspaceModalOpen }) {
    const [filterByToEdit, setFilterByToEdit] = useState(boardService.getDefaultFilterBoards())
    const workspaces = useSelector(storeState => storeState.workspaceModule.workspaces)
    const currWorkspaceId = useSelector(storeState => storeState.workspaceModule.currWorkspaceId)
    const user = useSelector(storeState => storeState.userModule.user)
    
    // Select boards from store and filter them locally to ensure no 'leakage' from other workspaces
    const boards = useSelector(storeState => {
        const allBoards = storeState.boardModule.boards
        if (workspaceDisplay === 'starred') {
            // For starred, we trust that the data in the store came from a starred query, 
            // OR if it's mixed, we'd need to check user.starredBoardIds (if available)
            if (user?.starredBoardIds) {
                return allBoards.filter(b => user.starredBoardIds.includes(b._id))
            }
            return allBoards // Fallback
        }
        if (currWorkspaceId && workspaceDisplay === 'board') {
            return allBoards.filter(b => b.workspaceId === currWorkspaceId)
        }
        return allBoards
    })

    useEffect(() => {
        if (user) loadWorkspaces()
    }, [user])

    useEffect(() => {
        if (workspaces.length && !currWorkspaceId) {
            setCurrWorkspace(workspaces[0]._id)
        }
    }, [workspaces, currWorkspaceId])

    useEffect(() => {
        const filter = boardService.getDefaultFilterBoards()
        if (workspaceDisplay === 'starred') filter.isStarred = 'true'
        if (currWorkspaceId && workspaceDisplay === 'board') filter.workspaceId = currWorkspaceId
        setFilterByToEdit(filter)
    }, [workspaceDisplay, currWorkspaceId])

    useEffect(() => {
        loadBoards(filterByToEdit)
    }, [filterByToEdit, user])

    function onToggleWorkspace () {
        setIsWorkspaceOpen((prevIsOpen) => !prevIsOpen)
    }

    const handleChange = useCallback(({ target }) => {
        let { value, name: field } = target
        setFilterByToEdit((prevFilter) => ({ ...prevFilter, [field]: value }))
    }, [])

    return (
        <section className={`workspace-sidebar ${isWorkspaceOpen ? 'open' : 'close'}`}>
            <Tooltip title={isWorkspaceOpen ? 'Close navigation' : 'Open navigation'} arrow>
                <div onClick={onToggleWorkspace} className='toggle-workspace '>
                    {isWorkspaceOpen && <MdKeyboardArrowLeft />}
                    {!isWorkspaceOpen && <MdKeyboardArrowRight />}
                </div>
            </Tooltip>
            {workspaceDisplay === 'board' ?
                (<WorkspaceBoard 
                    handleChange={handleChange}
                    filterByToEdit={filterByToEdit} 
                    boards={boards} 
                    setIsCreateModalOpen={setIsCreateModalOpen} 
                    workspaces={workspaces}
                    currWorkspaceId={currWorkspaceId}
                    setIsCreateWorkspaceModalOpen={setIsCreateWorkspaceModalOpen}
                />)
                :
                (<WorkspaceFavorite boards={boards} />)}
        </section>
    )
}
