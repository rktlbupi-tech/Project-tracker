import { boardService } from '../services/board.service.js'
import { userService } from '../services/user.service.js'

import { store } from './store.js'
import { SET_FILTER_BOARD, SET_BOARDS, SET_BOARD, REMOVE_BOARD, ADD_BOARD, UPDATE_BOARD, SET_FILTER, SET_MODAL, SET_DYNAMIC_MODAL, SET_ONLINE_USERS, SET_TASK_EDITING, UNSET_TASK_EDITING } from "./board.reducer.js"
import { SET_USER } from "./user.reducer.js"
import { utilService } from '../services/util.service.js'
import { socketService, SOCKET_EMIT_SEND_UPDATE_BOARD } from '../services/socket.service.js'
import { toast } from 'react-toastify'
import { loggerService } from '../services/logger.service.js'

export async function loadBoards(filterBy) {
    try {
        const boards = await boardService.query(filterBy)
        store.dispatch({ type: SET_BOARDS, boards })
        return boards
    } catch (err) {
        loggerService.error('Cannot load boards', err)
        throw err
    }
}

export async function loadSocketBoard(board) {
    try {
        const { filter } = store.getState().boardModule
        const newFilteredBoard = boardService.getFilteredBoard(board, filter)
        store.dispatch({ type: SET_BOARD, board })
        store.dispatch({ type: SET_FILTER_BOARD, filteredBoard: newFilteredBoard })
    } catch (err) {
        throw err
    }
}

export async function updateOptimisticBoard(newBoard, prevBoard) {
    try {
        const { filter } = store.getState().boardModule
        const newFilteredBoard = boardService.getFilteredBoard(newBoard, filter)
        store.dispatch({ type: SET_BOARD, board: newBoard })
        store.dispatch({ type: SET_FILTER_BOARD, filteredBoard: newFilteredBoard })
        await saveBoard(newBoard)
    } catch (err) {
        const { filter } = store.getState().boardModule
        const prevFilteredBoard = boardService.getFilteredBoard(prevBoard, filter)
        store.dispatch({ type: SET_BOARD, board: prevBoard })
        store.dispatch({ type: SET_FILTER_BOARD, filteredBoard: prevFilteredBoard })
        throw err
    }
}

export async function loadBoard(boardId, filterBy) {
    if (!boardId) {
        store.dispatch({ type: SET_BOARD, board: null })
        store.dispatch({ type: SET_FILTER_BOARD, filteredBoard: null })
        return
    }
    try {
        const board = await boardService.getById(boardId)
        const filteredBoard = boardService.getFilteredBoard(board, filterBy)
        store.dispatch({ type: SET_BOARD, board })
        store.dispatch({ type: SET_FILTER_BOARD, filteredBoard })
    } catch (err) {
        loggerService.error('Had issues loading board', err)
        throw err
    }
}

export function setBoardFromSocket(board) {
    if (!board) return
    
    // 1. Update the full boards list in the store
    store.dispatch({ type: UPDATE_BOARD, board })

    // 2. Maintain the user's current local frontend filter if one exists
    const filter = store.getState().boardModule.filter
    const filteredBoard = boardService.getFilteredBoard(board, filter)
    
    // 3. Dispatch to both board (source) and filteredBoard (view)
    store.dispatch({ type: SET_BOARD, board })
    store.dispatch({ type: SET_FILTER_BOARD, filteredBoard })
}

export function setOnlineUsers(onlineUsers) {
    store.dispatch({ type: SET_ONLINE_USERS, onlineUsers })
}

export function setTaskEditing({ taskId, user }) {
    store.dispatch({ type: SET_TASK_EDITING, taskId, user })
}

export function unsetTaskEditing({ taskId }) {
    store.dispatch({ type: UNSET_TASK_EDITING, taskId })
}

export function onTaskEditingStart(boardId, taskId) {
    socketService.emit('task-editing-start', { boardId, taskId })
}

export function onTaskEditingStop(boardId, taskId) {
    socketService.emit('task-editing-stop', { boardId, taskId })
}

export async function removeBoard(boardId) {
    try {
        await boardService.remove(boardId)
        store.dispatch({ type: REMOVE_BOARD, boardId })
    } catch (err) {
        loggerService.error('Cannot remove board', err)
        throw err
    }
}

export async function saveBoard(board) {
    const type = (board._id) ? UPDATE_BOARD : ADD_BOARD
    try {
        const newBoard = await boardService.save(board)
        store.dispatch({ type, board: newBoard })
        return board
    } catch (err) {
        loggerService.error('Cannot save board:', err)
        throw err
    }
}

export async function updatePickerCmpsOrder(filteredBoard, cmpsOrders) {
    try {
        const { board } = store.getState().boardModule
        board.cmpsOrder = cmpsOrders
        filteredBoard.cmpsOrder = cmpsOrders
        await saveBoard(board)
        store.dispatch({ type: SET_BOARD, board })
        store.dispatch({ type: SET_FILTER_BOARD, filteredBoard })
    } catch (err) {
        throw err
    }
}

export async function addGroup(filteredBoard) {
    try {
        const { board } = store.getState().boardModule
        const newBoard = structuredClone(board)
        const group = boardService.getEmptyGroup()
        group.id = utilService.makeId()
        newBoard.groups.unshift(group)
        await updateOptimisticBoard(newBoard, board)
    } catch (err) {
        throw err
    }
}

export async function duplicateGroup(filteredBoard, group) {
    try {
        const { board } = store.getState().boardModule
        const newBoard = structuredClone(board)
        const duplicatedGroup = structuredClone(group)
        duplicatedGroup.id = utilService.makeId()
        const idx = newBoard.groups.findIndex(g => g.id === group.id)
        newBoard.groups.splice(idx + 1, 0, duplicatedGroup)
        await updateOptimisticBoard(newBoard, board)
    } catch (err) {
        throw err
    }
}

export async function duplicateTask(filteredBoard, group, task) {
    try {
        const { board } = store.getState().boardModule
        const newBoard = structuredClone(board)
        const newGroup = newBoard.groups.find(currGroup => currGroup.id === group.id)
        const duplicatedTask = structuredClone(task)
        const idx = newGroup.tasks.findIndex(t => t.id === task.id)
        duplicatedTask.id = utilService.makeId()
        duplicatedTask.title += ' (copy)'
        newGroup.tasks.splice(idx + 1, 0, duplicatedTask)
        await updateOptimisticBoard(newBoard, board)
    } catch (err) {
        throw err
    }
}

export async function addTask(task, group, filteredBoard, activity) {
    const prevBoard = structuredClone(store.getState().boardModule.board)
    const prevFilteredBoard = structuredClone(store.getState().boardModule.filteredBoard)

    const { board, filter } = store.getState().boardModule
    const newBoard = structuredClone(board)
    
    try {
        task.id = utilService.makeId()
        
        // 1. Find group and add task
        const groupToUpdate = newBoard.groups.find(currGroup => currGroup.id === group.id)
        if (!groupToUpdate) return
        groupToUpdate.tasks.push(task)

        if (activity) {
            activity.task = { id: task.id, title: task.title }
            if (newBoard.activities.length >= 30) newBoard.activities.pop()
            newBoard.activities.unshift(activity)
        }

        // 2. Calculate new filtered board
        const newFilteredBoard = boardService.getFilteredBoard(newBoard, filter)

        // 3. Optimistic Dispatch
        store.dispatch({ type: SET_BOARD, board: newBoard })
        store.dispatch({ type: SET_FILTER_BOARD, filteredBoard: newFilteredBoard })

        // 4. API Call
        await boardService.save(newBoard)
        
        // Note: Broadcast happens automatically on the server via eventBus
    } catch (err) {
        store.dispatch({ type: SET_BOARD, board: prevBoard })
        store.dispatch({ type: SET_FILTER_BOARD, filteredBoard: prevFilteredBoard })
        toast.error('Failed to add task.')
        throw err
    }
}

export async function addTaskOnFirstGroup(filteredBoard) {
    try {
        const { board } = store.getState().boardModule
        const newBoard = structuredClone(board)
        if (!newBoard.groups.length) {
            const group = boardService.getEmptyGroup()
            group.id = utilService.makeId()
            newBoard.groups.unshift(group)
        }
        const taskToAdd = boardService.getEmptyTask()
        taskToAdd.title = 'New Task'
        taskToAdd.id = utilService.makeId()
        newBoard.groups[0].tasks.push(taskToAdd)
        await updateOptimisticBoard(newBoard, board)
    } catch (err) {
        throw err
    }
}

export function toggleModal(isOpenModal) {
    store.dispatch({ type: SET_MODAL, isOpen: !isOpenModal })
}

export async function updateGroups(groupId, filteredBoard) {
    try {
        const { board } = store.getState().boardModule
        const newBoard = structuredClone(board)
        newBoard.groups = newBoard.groups.filter(group => group.id !== groupId)
        await updateOptimisticBoard(newBoard, board)
    } catch (err) {
        throw err
    }
}

export async function updateGroupAction(filteredBoard, saveGroup) {
    const prevBoard = structuredClone(store.getState().boardModule.board)
    const prevFilteredBoard = structuredClone(store.getState().boardModule.filteredBoard)

    const { board, filter } = store.getState().boardModule
    const newBoard = structuredClone(board)
    
    try {
        const groupsToSave = newBoard.groups.map(group => group.id === saveGroup.id ? saveGroup : group)
        newBoard.groups = groupsToSave
        
        // 1. Optimistic UI Update
        const newFilteredBoard = boardService.getFilteredBoard(newBoard, filter)
        store.dispatch({ type: SET_BOARD, board: newBoard })
        store.dispatch({ type: SET_FILTER_BOARD, filteredBoard: newFilteredBoard })

        // 2. API Call
        await boardService.updateGroup(newFilteredBoard._id, saveGroup)
    } catch (err) {
        // Rollback on failure
        store.dispatch({ type: SET_BOARD, board: prevBoard })
        store.dispatch({ type: SET_FILTER_BOARD, filteredBoard: prevFilteredBoard })
        loggerService.error('Failed to update group, rolling back:', err)
        throw err
    }
}

export async function updateTaskAction(filteredBoard, groupId, saveTask, activity) {
    const prevBoard = structuredClone(store.getState().boardModule.board)
    const prevFilteredBoard = structuredClone(store.getState().boardModule.filteredBoard)

    const { board, filter } = store.getState().boardModule
    const newBoard = structuredClone(board)

    try {
        // 1. Optimistic UI Update
        const group = newBoard.groups.find(currGroup => currGroup.id === groupId)
        if (group) group.tasks = group.tasks.map(task => task.id === saveTask.id ? saveTask : task)

        if (activity) {
            if (newBoard.activities.length >= 30) newBoard.activities.pop()
            newBoard.activities.unshift(activity)
        }

        const newFilteredBoard = boardService.getFilteredBoard(newBoard, filter)
        store.dispatch({ type: SET_BOARD, board: newBoard })
        store.dispatch({ type: SET_FILTER_BOARD, filteredBoard: newFilteredBoard })

        // 2. API Calls
        if (activity) {
            await boardService.save(newBoard)
        }
        await boardService.updateTask(newFilteredBoard._id, groupId, saveTask)
    } catch (err) {
        // Rollback on failure
        store.dispatch({ type: SET_BOARD, board: prevBoard })
        store.dispatch({ type: SET_FILTER_BOARD, filteredBoard: prevFilteredBoard })
        
        if (err.response && err.response.status === 409) {
            console.error('Task was modified by another user. Refreshing...')
            toast.error('Task was modified by another user. Refreshing...')
        } else {
            toast.error('Failed to update task.')
        }
        
        loggerService.error('Failed to update task, rolling back:', err)
        throw err
    }
}

export async function toggleStarred(boardId) {
    const { user } = store.getState().userModule
    if (!user) return

    // Optimistic Update
    const updatedUser = structuredClone(user)
    if (!updatedUser.starredBoardIds) updatedUser.starredBoardIds = []
    
    const boardIdStr = boardId.toString()
    const idx = updatedUser.starredBoardIds.indexOf(boardIdStr)
    
    if (idx === -1) {
        updatedUser.starredBoardIds.push(boardIdStr)
    } else {
        updatedUser.starredBoardIds.splice(idx, 1)
    }

    store.dispatch({ type: SET_USER, user: updatedUser })

    try {
        const savedUser = await userService.toggleStarred(boardId)
        // Sync with actual server data (in case server logic differs)
        store.dispatch({ type: SET_USER, user: savedUser })
    } catch (err) {
        loggerService.error('Failed to toggle star, rolling back:', err)
        // Rollback on error
        store.dispatch({ type: SET_USER, user })
        throw err
    }
}

export async function addActivity(filteredBoard, activity) {
    try {
        const { board } = store.getState().boardModule
        if (board.activities.length >= 30) {
            board.activities.pop()
            filteredBoard.activities.pop()
        }
        board.activities.unshift(activity)
        await boardService.save(board)
        filteredBoard.activities.unshift(activity)
        store.dispatch({ type: SET_BOARD, board })
        store.dispatch({ type: SET_FILTER_BOARD, filteredBoard })
        socketService.emit(SOCKET_EMIT_SEND_UPDATE_BOARD, { filteredBoard, board })
    } catch (err) {
        throw err
    }
}

export function setFilter(filter) {
    store.dispatch({ type: SET_FILTER, filter })
}

export function setDynamicModalObj(dynamicModalObj) {
    store.dispatch({ type: SET_DYNAMIC_MODAL, dynamicModalObj })
}

export function closeDynamicModal() {
    const { dynamicModalObj } = store.getState().boardModule
    dynamicModalObj.isOpen = false
    store.dispatch({ type: SET_DYNAMIC_MODAL, dynamicModalObj })
}

// Drag and drop
export async function handleOnDragEnd(result, board) {
    let newBoard = structuredClone(board);
    if (!result.destination) {
        return;
    }
    // Reordering groups
    if (result.type === 'group') {
        const updatedGroups = [...board.groups]
        const [draggedItem] = updatedGroups.splice(result.source.index, 1)
        updatedGroups.splice(result.destination.index, 0, draggedItem)
        newBoard.groups = updatedGroups
        updateOptimisticBoard(newBoard, board)
    }
    // Reordering tasks
    if (result.type === 'task') {
        const startGroup = newBoard.groups.find(group => (group.id || group._id) === result.source.droppableId)
        const finishGroup = newBoard.groups.find(group => (group.id || group._id) === result.destination.droppableId)
        // Reordering tasks between groups
        if (startGroup !== finishGroup) {
            const [removedTask] = startGroup.tasks.splice(result.source.index, 1)
            finishGroup.tasks.splice(result.destination.index, 0, removedTask)
            updateOptimisticBoard(newBoard, board)
            return
        }
        const updatedTasks = [...startGroup.tasks]
        const [draggedItem] = updatedTasks.splice(result.source.index, 1)
        updatedTasks.splice(result.destination.index, 0, draggedItem)
        startGroup.tasks = updatedTasks
        updateOptimisticBoard(newBoard, board)
    }
    // Reordering columns
    if (result.type === 'column') {
        const updatedTitles = [...board.cmpsOrder]
        const [draggedItem] = updatedTitles.splice(result.source.index, 1)
        updatedTitles.splice(result.destination.index, 0, draggedItem)
        updatePickerCmpsOrder(board, updatedTitles)
    }
}

// private functions

