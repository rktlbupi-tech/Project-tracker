import { useParams, useSearchParams } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { socketService, SOCKET_EVENT_ADD_UPDATE_BOARD, SOCKET_EMIT_WATCH_BOARD, SOCKET_EMIT_UNWATCH_BOARD, SOCKET_EVENT_BOARD_USERS_ONLINE, SOCKET_EMIT_SET_USER_PRESENCE } from '../services/socket.service'
import { loadBoard, loadBoards, setBoardFromSocket, setFilter, setOnlineUsers, setTaskEditing, unsetTaskEditing } from '../store/board.actions'
import { ModalMemberInvite } from '../cmps/modal/modal-member-invite'
import { WorkspaceSidebar } from '../cmps/sidebar/workspace-sidebar'
import { LoginLogoutModal } from '../cmps/modal/login-logout-modal'
import { GroupListKanban } from '../cmps/kanban/group-list-kanban'
import { BoardDescription } from '../cmps/board/board-description'
import { MainSidebar } from '../cmps/sidebar/main-sidebar'
import { DynamicModal } from '../cmps/modal/dynamic-modal'
import { boardService } from '../services/board.service'
import { CreateBoard } from '../cmps/modal/create-board'
import { BoardHeader } from '../cmps/board/board-header'
import { userService } from '../services/user.service'
import { BoardModal } from '../cmps/board/board-modal'
import { GroupList } from '../cmps/board/group-list'
import { BoardAutomations } from '../cmps/board/board-automations'
import { loadUsers } from '../store/user.actions'
import { Loader } from '../cmps/loader'
import { Dashboard } from './dashboard'

export function BoardDetails() {
    const board = useSelector(storeState => storeState.boardModule.filteredBoard)
    const boards = useSelector(storeState => storeState.boardModule.boards)
    const isBoardModalOpen = useSelector(storeState => storeState.boardModule.isBoardModalOpen)

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
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
        loadBoard(boardId, queryFilterBy)
        loadUsers()
        if (!boards.length) loadBoards()

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
                <MainSidebar setWorkspaceDisplay={setWorkspaceDisplay} setIsWorkspaceOpen={setIsWorkspaceOpen} setIsLoginModalOpen={setIsLoginModalOpen} />
                <WorkspaceSidebar workspaceDisplay={workspaceDisplay} isWorkspaceOpen={isWorkspaceOpen} setIsWorkspaceOpen={setIsWorkspaceOpen} board={board} setIsCreateModalOpen={setIsCreateModalOpen} />
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
                    </>
                ) : (
                    <div className="empty-board-view flex column align-center justify-center" style={{ height: '100%', gap: '20px', color: '#676879' }}>
                        <img src="https://res.cloudinary.com/du63kkxhl/image/upload/v1700131641/empty_state_bzxvzk.png" alt="Empty" style={{ width: '200px', opacity: 0.7 }} />
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '10px' }}>You're not invited into any boards yet</h2>
                            <p style={{ fontSize: '16px' }}>When you are invited to a board, it will show up here.</p>
                        </div>
                    </div>
                )}
            </main>
            {isCreateModalOpen && <CreateBoard setIsModalOpen={setIsCreateModalOpen} />}
            {isAutomationsOpen && board && <BoardAutomations board={board} setIsAutomationsOpen={setIsAutomationsOpen} />}
            {(isAutomationsOpen || isInviteModalOpen || isCreateModalOpen || (isBoardModalOpen && isMouseOver)) && <div className='dark-screen'></div>}
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
