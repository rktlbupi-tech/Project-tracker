import { storageService } from './async-storage.service.js'
import { userService } from './user.service.js'
import { utilService } from './util.service.js'

const STORAGE_KEY = 'boardDB'

_createBoards()

export const boardService = {
    query,
    getById,
    save,
    remove,
    getEmptyBoard,
    getDefaultFilter,
    getDefaultFilterBoard,
    getFilterFromSearchParams,
    getEmptyGroup,
    getEmptyTask,
    getEmptyComment,
    getEmptyActivity
}

async function query(filterBy = getDefaultFilterBoard()) {
    let boards = await storageService.query(STORAGE_KEY)
    if (filterBy.title) {
        const regex = new RegExp(filterBy.title, 'i')
        boards = boards.filter(board => regex.test(board.title))
    }
    if (filterBy.isStarred) boards = boards.filter(board => board.isStarred === true)
    return boards
}

async function getById(boardId, filterBy = getDefaultFilter()) {
    try {
        let board = await storageService.get(STORAGE_KEY, boardId)
        if (filterBy.title) {
            const regex = new RegExp(filterBy.title, 'i')
            const groups = board.groups.filter(group => regex.test(group.title))
            groups.forEach(group => {
                group.tasks = group.tasks.filter(task => regex.test(task.title))
            })
            board.groups = groups
        }
        return board
    } catch (err) {
        throw err
    }
}

function remove(boardId) {
    return storageService.remove(STORAGE_KEY, boardId)
}

function save(board) {
    if (board._id) return storageService.put(STORAGE_KEY, board)
    return storageService.post(STORAGE_KEY, board)
}

function getDefaultFilter() {
    return {
        title: '',
        isStarred: null
    }
}

function getDefaultFilterBoard() {
    return { title: '' }
}

function getFilterFromSearchParams(searchParams) {
    const emptyFilter = getDefaultFilter()
    const filterBy = {}
    for (const field in emptyFilter) {
        filterBy[field] = searchParams.get(field) || ''
    }
    return filterBy
}

function getEmptyGroup() {
    return {
        "title": 'New Group',
        "archivedAt": Date.now(),
        "tasks": [],
        "color": '#ffcb00',
        "id": utilService.makeId()
    }
}

function getEmptyTask() {
    return {
        "title": "",
        "status": "",
        "priority": "",
        "memberIds": [],
        "dueDate": '',
        "comments": []
    }
}

function getEmptyComment() {
    return {
        "archivedAt": Date.now(),
        "byMember": userService.getLoggedinUser(), "txt": "",
        "style": {
            "textDecoration": "none",
            "fontWeight": "normal",
            "fontStyle": "normal",
            "textAlign": "Left"
        }
    }
}

function getEmptyActivity() {
    return {
        "action": "status",
        "createdAt": Date.now(),
        "byMember": userService.getLoggedinUser(),
        "task": {
            "id": "c101",
            "title": "Replace Logo"
        },
        "from": {}, 
        "to": {}
    }
}

function getEmptyBoard() {
    return {
        "title": 'New Board',
        "archivedAt": Date.now(),
        "isStarred": false,
        "labels": [
            {
                "id": "l101",
                "title": "Done",
                "color": "#037f4c"
            },
            {
                "id": "l102",
                "title": "Progress",
                "color": "#ffcb00"
            },
            {
                "id": "l103",
                "title": "stack",
                "color": "#e2445c"
            }
        ],
        "members": [],
        "groups": [],
        "activities": [],
        "cmpsOrder": ["status-picker", "member-picker", "date-picker", 'priority-picker']
    }
}

function _createBoards() {
    let boards = utilService.loadFromStorage(STORAGE_KEY)
    if (!boards) {
        boards = []
        utilService.saveToStorage(STORAGE_KEY, boards)
    }
}