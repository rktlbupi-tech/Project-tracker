import { useSelector } from 'react-redux'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { loadBoards } from '../../store/board.actions'
import { loadWorkspaces, setCurrWorkspace, syncWorkspaceRemoved } from '../../store/workspace.actions'
import { boardService } from '../../services/board.service'
import { socketService } from '../../services/socket.service'

import { MdKeyboardArrowRight } from 'react-icons/md'
import { MdKeyboardArrowLeft } from 'react-icons/md'
import WorkspaceBoard from './workspace/workspace-board'
import WorkspaceFavorite from './workspace/workspace-favorite'
import { Tooltip } from '@mui/material'

export function WorkspaceSidebar ({ workspaceDisplay, setIsCreateModalOpen, setIsWorkspaceOpen, isWorkspaceOpen, setWorkspaceDisplay, setIsCreateWorkspaceModalOpen }) {
    const [filterByToEdit, setFilterByToEdit] = useState(boardService.getDefaultFilterBoards())
    const workspaces = useSelector(storeState => storeState.workspaceModule.workspaces)
    const currWorkspaceId = useSelector(storeState => storeState.workspaceModule.currWorkspaceId)
    const user = useSelector(storeState => storeState.userModule.user)
    const navigate = useNavigate()
    const prevWorkspaceId = useRef(currWorkspaceId)
    
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

    // Auto-navigate to the first board of the new workspace when switching
    useEffect(() => {
        if (currWorkspaceId && prevWorkspaceId.current !== currWorkspaceId) {
            // Only navigate if we find a board belonging to the NEW workspace in the store
            const firstBoard = boards.find(b => b.workspaceId === currWorkspaceId)
            if (firstBoard) {
                navigate(`/board/${firstBoard._id}`)
                prevWorkspaceId.current = currWorkspaceId
            } else {
                // Even if no board found, mark this workspace choice as "last handled" 
                // so we don't jump the gun later when a board might be added to another workspace
                // (Though we could keep it pending if we want to jump to the first board created)
                prevWorkspaceId.current = currWorkspaceId
            }
        }
    }, [currWorkspaceId, boards, navigate])

    useEffect(() => {
        if (user) loadWorkspaces()

        socketService.on('workspace-removed', (removedWsId) => {
            syncWorkspaceRemoved(removedWsId)
            // If the deleted workspace was the active one, fallback
            setCurrWorkspace((prev) => {
                if (prev === removedWsId) return null // Let the other useEffect pick a new one
                return prev
            })
        })

        return () => {
             socketService.off('workspace-removed')
        }
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
                    user={user}
                />)
                :
                (<WorkspaceFavorite boards={boards} />)}
        </section>
    )
}
