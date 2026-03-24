import { useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { socketService, SOCKET_EVENT_ADD_UPDATE_BOARD, SOCKET_EMIT_WATCH_BOARD, SOCKET_EMIT_UNWATCH_BOARD, SOCKET_EVENT_BOARD_USERS_ONLINE, SOCKET_EMIT_SET_USER_PRESENCE } from '../services/socket.service'
import { loadBoard, loadBoards, setBoardFromSocket, setFilter, setOnlineUsers, setTaskEditing, unsetTaskEditing, saveBoard } from '../store/board.actions'
import { ModalMemberInvite } from '../cmps/modal/modal-member-invite'
import { WorkspaceSidebar } from '../cmps/sidebar/workspace-sidebar'
import { LoginLogoutModal } from '../cmps/modal/login-logout-modal'
import { GroupListKanban } from '../cmps/kanban/group-list-kanban'
import { BoardDescription } from '../cmps/board/board-description'
import { MainSidebar } from '../cmps/sidebar/main-sidebar'
import { DynamicModal } from '../cmps/modal/dynamic-modal'
import { boardService } from '../services/board.service'
import { CreateBoard } from '../cmps/modal/create-board'
import { CreateWorkspace } from '../cmps/modal/create-workspace'
import { BoardHeader } from '../cmps/board/board-header'
import { userService } from '../services/user.service'
import { BoardModal } from '../cmps/board/board-modal'
import { GroupList } from '../cmps/board/group-list'
import { BoardAutomations } from '../cmps/board/board-automations'
import { loadUsers } from '../store/user.actions'
import { setCurrWorkspace } from '../store/workspace.actions'
import { Loader } from '../cmps/loader'
import { Dashboard } from './dashboard'
import { BoardCalendar } from '../cmps/board/board-calendar'
import { loggerService } from '../services/logger.service'

export function BoardDetails() {
    const board = useSelector(storeState => storeState.boardModule.filteredBoard)
    const fullBoard = useSelector(storeState => storeState.boardModule.board)
    const boards = useSelector(storeState => storeState.boardModule.boards)
    const isBoardModalOpen = useSelector(storeState => storeState.boardModule.isBoardModalOpen)

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false)
    const [isShowDescription, setIsShowDescription] = useState(false)
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [isAutomationsOpen, setIsAutomationsOpen] = useState(false)
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [isStarredOpen, setIsStarredOpen] = useState(false)
    const [isMouseOver, setIsMouseOver] = useState(false)
    const [boardType, setBoardType] = useState('table')

    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false)
    const [workspaceDisplay, setWorkspaceDisplay] = useState('board')

    const { boardId } = useParams()
    const [searchParams, setSearchParams] = useSearchParams()

    // Using searchParams.toString() as a stable dependency for filter changes
    const searchStr = searchParams.toString()

    const queryFilterBy = useMemo(() => {
        return boardService.getFilterFromSearchParams(searchParams)
    }, [searchStr]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (board?.workspaceId) {
            setCurrWorkspace(board.workspaceId)
        }

        // --- Migration: Ensure 'deadline-picker' exists and 'number-picker' is removed ---
        if (fullBoard) {
            let hasChanged = false
            const newBoard = structuredClone(fullBoard)

            if (!newBoard.cmpsOption) newBoard.cmpsOption = ["status-picker", "member-picker", "date-picker", "priority-picker", "updated-picker"]
            if (!newBoard.cmpsOrder) newBoard.cmpsOrder = ["status-picker", "member-picker", "date-picker", "priority-picker", "updated-picker"]

            // 1. Ensure Deadline is an option
            if (!newBoard.cmpsOption.includes('deadline-picker')) {
                newBoard.cmpsOption.push('deadline-picker')
                hasChanged = true
            }

            // 2. Remove Numbers from options as requested
            if (newBoard.cmpsOption.includes('number-picker')) {
                newBoard.cmpsOption = newBoard.cmpsOption.filter(c => c !== 'number-picker')
                hasChanged = true
            }

            // 3. Ensure Files is an option if missing
            if (!newBoard.cmpsOption.includes('file-picker')) {
                newBoard.cmpsOption.push('file-picker')
                hasChanged = true
            }

            // 4. Ensure Custom is an option if missing
            if (!newBoard.cmpsOption.includes('custom-picker')) {
                newBoard.cmpsOption.push('custom-picker')
                hasChanged = true
            }

            // 5. Initialize column titles if missing
            if (!newBoard.cmpsTitles) {
                newBoard.cmpsTitles = {
                    "status-picker": "Status",
                    "member-picker": "Person",
                    "date-picker": "Date",
                    "priority-picker": "Priority",
                    "number-picker": "Number",
                    "file-picker": "Files",
                    "updated-picker": "Last Updated",
                    "deadline-picker": "Deadline",
                    "custom-picker": "Custom"
                }
                hasChanged = true
            }

            // 6. Ensure Deadline is currently visible (in cmpsOrder)
            if (!newBoard.cmpsOrder.includes('deadline-picker')) {
                const updatedIdx = newBoard.cmpsOrder.indexOf('updated-picker')
                if (updatedIdx !== -1) {
                    newBoard.cmpsOrder.splice(updatedIdx + 1, 0, 'deadline-picker')
                } else {
                    newBoard.cmpsOrder.push('deadline-picker')
                }
                hasChanged = true
            }

            if (hasChanged) {
                loggerService.info('Migrating full board to latest column structure')
                saveBoard(newBoard)
            }
        }
    }, [fullBoard, board])

    useEffect(() => {
        loadBoard(boardId, queryFilterBy)
        loadUsers()

        const user = userService.getLoggedinUser()
        if (user) socketService.emit(SOCKET_EMIT_SET_USER_PRESENCE, user)
        // We only want to re-load the board when the ID or the filter changes
    }, [boardId, searchStr]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        socketService.emit(SOCKET_EMIT_WATCH_BOARD, boardId)
        socketService.on(SOCKET_EVENT_ADD_UPDATE_BOARD, setBoardFromSocket)
        socketService.on(SOCKET_EVENT_BOARD_USERS_ONLINE, setOnlineUsers)
        socketService.on('task-is-editing', setTaskEditing)
        socketService.on('task-stopped-editing', unsetTaskEditing)

        return () => {
            socketService.off(SOCKET_EVENT_ADD_UPDATE_BOARD, setBoardFromSocket)
            socketService.off(SOCKET_EVENT_BOARD_USERS_ONLINE, setOnlineUsers)
            socketService.off('task-is-editing', setTaskEditing)
            socketService.off('task-stopped-editing', unsetTaskEditing)
            socketService.emit(SOCKET_EMIT_UNWATCH_BOARD, boardId)
        }
    }, [boardId])

    function onSetFilter(filterBy) {
        setSearchParams(filterBy)
        loadBoard(boardId, filterBy)
        setFilter(filterBy)
    }

    if (boardId && !board) return <Loader />
    return (
        <section className="board-details flex">
            <div className='sidebar flex'>
                <MainSidebar isWorkspaceOpen={isWorkspaceOpen} setWorkspaceDisplay={setWorkspaceDisplay} setIsWorkspaceOpen={setIsWorkspaceOpen} setIsLoginModalOpen={setIsLoginModalOpen} />
                <WorkspaceSidebar
                    workspaceDisplay={workspaceDisplay}
                    setWorkspaceDisplay={setWorkspaceDisplay}
                    isWorkspaceOpen={isWorkspaceOpen}
                    setIsWorkspaceOpen={setIsWorkspaceOpen}
                    board={board}
                    setIsCreateModalOpen={setIsCreateModalOpen}
                    setIsCreateWorkspaceModalOpen={setIsCreateWorkspaceModalOpen}
                />
            </div>
            <main className="board-main">
                {board ? (
                    <>
                        <BoardHeader boardType={boardType} setBoardType={setBoardType} board={board} onSetFilter={onSetFilter} isStarredOpen={isStarredOpen} setIsShowDescription={setIsShowDescription} setIsInviteModalOpen={setIsInviteModalOpen} setIsAutomationsOpen={setIsAutomationsOpen} />
                        {boardType === 'table' && <GroupList board={board} />}

                        {boardType === 'kanban' &&
                            <GroupListKanban board={board} />
                        }
                        <BoardModal setIsMouseOver={setIsMouseOver} />
                        {boardType === 'dashboard' && <Dashboard />}
                        {boardType === 'calendar' && <BoardCalendar board={fullBoard} />}
                    </>
                ) : (
                    <div className="empty-board-view flex column align-center justify-center">
                        <div className="empty-img-container">
                            <img 
                                src={require('../assets/img/empty_state_modern.png')} 
                                alt="Empty State" 
                                className="main-empty-img"
                            />
                        </div>
                        <div className="empty-text-container">
                            <h2>A new way to manage your work</h2>
                            <p>Select a board or create a new one to unlock your peak productivity.</p>
                        </div>
                    </div>
                )}
            </main>
            {isCreateModalOpen && <CreateBoard setIsModalOpen={setIsCreateModalOpen} />}
            {isCreateWorkspaceModalOpen && <CreateWorkspace setIsModalOpen={setIsCreateWorkspaceModalOpen} setWorkspaceDisplay={setWorkspaceDisplay} />}
            {isAutomationsOpen && board && <BoardAutomations board={board} setIsAutomationsOpen={setIsAutomationsOpen} />}
            {(isAutomationsOpen || isInviteModalOpen || isCreateModalOpen || isCreateWorkspaceModalOpen) && <div className='dark-screen'></div>}
            {isShowDescription && board &&
                <>
                    <BoardDescription setIsShowDescription={setIsShowDescription} board={board} />
                    <div className='dark-screen'></div>
                </>
            }
            {isLoginModalOpen && <LoginLogoutModal setIsLoginModalOpen={setIsLoginModalOpen} />}
            {isInviteModalOpen && board && <ModalMemberInvite board={board} setIsInviteModalOpen={setIsInviteModalOpen} />}
            <DynamicModal />
        </section>
    )
}
