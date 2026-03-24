const eventBus = require('./event-bus.service')
const boardService = require('../api/board/board.service')

const delay = ms => new Promise(res => setTimeout(res, ms))

class AutomationService {
    constructor() {
        this.initListeners()
    }

    initListeners() {
        eventBus.on('TASK_UPDATED', async ({ boardId, groupId, task, updatedField }) => {
            try {
                await delay(100)
                await this.evaluateAutomations(boardId, groupId, task, 'TASK_UPDATED', updatedField)
            } catch (err) {
                console.error('Automation Engine Error:', err)
            }
        })

        eventBus.on('TASK_CREATED', async ({ boardId, groupId, task }) => {
            try {
                await delay(100)
                await this.evaluateAutomations(boardId, groupId, task, 'TASK_CREATED')
            } catch (err) {
                console.error('Automation Engine Error:', err)
            }
        })
    }

    async evaluateAutomations(boardId, groupId, updatedTask, eventType, updatedField = '') {
        const board = await boardService.getById(boardId)
        if (!board) return

        // Critical: Find the actual task object within the newly fetched board context
        const group = board.groups.find(g => (g.id === groupId || g._id?.toString() === groupId))
        if (!group) return
        const taskToModify = group.tasks.find(t => (t.id === updatedTask.id || t.id === updatedTask._id || t._id?.toString() === updatedTask.id))
        if (!taskToModify) return

        let boardNeedsSave = false
        let hasMoved = false

        // --- GLOBAL DEFAULT: Synchronize Highlight with Priority ---
        const isPriorityChange = updatedField === 'priority-picker' || updatedField === 'priority' || !updatedField
        const isStatusChange = updatedField === 'status-picker' || updatedField === 'status'
        const isTaskCreated = eventType === 'TASK_CREATED'

        if (isPriorityChange || isStatusChange || isTaskCreated) {
            const isHighAndNotDone = taskToModify.priority === 'High' && taskToModify.status !== 'Done'
            const hasHighlight = taskToModify.style && taskToModify.style.backgroundColor
            
            if (isHighAndNotDone && !hasHighlight) {
                console.log(`[Automation Engine] Priority is High (Not Done), auto-highlighting: ${taskToModify.title}`)
                taskToModify.style = { 
                    backgroundColor: 'rgba(255, 171, 0, 0.12)', 
                    boxShadow: 'inset 4px 0 0 #ffab00',
                    transition: 'all 0.5s ease'
                }
                boardNeedsSave = true
            } else if (!isHighAndNotDone && hasHighlight) {
                console.log(`[Automation Engine] Priority is ${taskToModify.priority || 'None'}, Status is ${taskToModify.status || 'None'}. Resetting style for: ${taskToModify.title}`)
                taskToModify.style = {}
                boardNeedsSave = true
            }
        }

        if (!board.automations || !board.automations.length) {
            if (boardNeedsSave) {
                console.log(`[Automation Engine] Saving global defaults for board ${boardId}`)
                const savedBoard = await boardService.update(board)
                eventBus.emit('BOARD_UPDATED', savedBoard)
            }
            return
        }

        for (const auto of board.automations) {
            if (!auto.isActive) continue

            let isTriggered = false

            // --- Support Legacy String-based Triggers ---
            if (typeof auto.trigger === 'string') {
                if (auto.trigger === 'Status changes to Done' && taskToModify.status === 'Done') isTriggered = true
                else if (auto.trigger === 'Status changes to Stuck' && taskToModify.status === 'Stuck') isTriggered = true
                else if ((auto.trigger === 'Status changes to Progress' || auto.trigger === 'Status changes to Working on it') && 
                         (taskToModify.status === 'Progress' || taskToModify.status === 'Working on it')) isTriggered = true
            } 
            // --- Support New Object-based Triggers ---
            else if (auto.trigger && typeof auto.trigger === 'object') {
                const { type, columnType, value } = auto.trigger
                
                if (type === 'COLUMN_CHANGE' && eventType === 'TASK_UPDATED') {
                    // Only trigger if the specific columns match
                    const fieldMapping = {
                        'status': 'status-picker',
                        'priority': 'priority-picker',
                        'memberIds': 'member-picker',
                        'dueDate': 'date-picker',
                        'deadline': 'deadline-picker'
                    }
                    if (fieldMapping[columnType] === updatedField || columnType === updatedField) {
                         if (taskToModify[columnType] === value) isTriggered = true
                    }
                } else if (type === 'ITEM_CREATED' && eventType === 'TASK_CREATED') {
                    isTriggered = true
                }
            }

            if (isTriggered) {
                const actionResult = await this._executeAction(board, groupId, taskToModify, auto)
                if (actionResult) {
                    boardNeedsSave = true
                    // Tracking if a move happened
                    if (auto.action === 'Move item to Completed' || 
                        auto.action === 'Move item to Backlog' || 
                        auto.action === 'Move item to Top Group' || 
                        (auto.action && auto.action.type === 'MOVE_TO_GROUP')) {
                        hasMoved = true
                    }
                }
            }
        }

        // --- GLOBAL DEFAULT: Fallback to Top Group (STATUS UPDATES ONLY) ---
        // CRITICAL DECOUPLING: We ONLY automatically move groups if the 'status' column was the one updated.
        // Assigning a person (member-picker), date (date-picker), or deadline (deadline-picker) will NEVER trigger a move.
        if (eventType === 'TASK_UPDATED' && updatedField === 'status-picker' && !hasMoved) {
            const isTopGroup = board.groups[0].id === groupId || board.groups[0]._id?.toString() === groupId
            if (!isTopGroup) {
                console.log(`[Automation Engine] Status change detected. No move rule matched. Returning to Top Group.`)
                const moved = this._moveToTopGroup(board, groupId, taskToModify)
                if (moved) boardNeedsSave = true
            }
        }

        if (boardNeedsSave) {
            console.log(`[Automation Engine] Saving automation results for board ${boardId}`)
            const savedBoard = await boardService.update(board)
            eventBus.emit('BOARD_UPDATED', savedBoard)
        }
    }

    async _executeAction(board, sourceGroupId, task, auto) {
        const { action } = auto
        
        // --- Support Legacy String-based Actions ---
        if (typeof action === 'string') {
            if (action === 'Move item to Completed') {
                return this._moveToGroup(board, sourceGroupId, task, ['complete', 'done', 'completed'], 'Completed', '#00c875')
            }
            if (action === 'Move item to Backlog') {
                return this._moveToGroup(board, sourceGroupId, task, ['backlog', 'stuck', 'blocked'], 'Backlog', '#e2445c')
            }
            if (action === 'Move item to Top Group' || action === 'Move item to Working on it') {
                return this._moveToTopGroup(board, sourceGroupId, task)
            }
            if (action === 'Duplicate item') {
                return this._duplicateTask(board, sourceGroupId, task)
            }
        } 
        // --- Support New Object-based Actions ---
        else if (action && typeof action === 'object') {
            const { type, target, columnType, value } = action

            switch (type) {
                case 'HIGHLIGHT':
                    task.style = { 
                        backgroundColor: 'rgba(255, 171, 0, 0.12)', 
                        boxShadow: 'inset 4px 0 0 #ffab00',
                        transition: 'all 0.5s ease'
                    }
                    return true
                case 'RESET_STYLE':
                    task.style = {}
                    return true
                case 'MOVE_TO_GROUP':
                    return this._moveToGroup(board, sourceGroupId, task, [target.toLowerCase()], target, '#735dd1')
                default:
                    return false
            }
        }
        return false
    }

    _moveToGroup(board, sourceGroupId, task, keywords, defaultTitle, defaultColor) {
        let targetGroup = board.groups.find(g => 
            keywords.some(kw => g.title.toLowerCase().includes(kw))
        )
        
        if (!targetGroup) {
            targetGroup = {
                id: 'g' + Date.now().toString(),
                title: defaultTitle,
                color: defaultColor,
                tasks: []
            }
            board.groups.push(targetGroup)
        }

        const targetId = targetGroup.id || targetGroup._id?.toString()
        const taskAlreadyInTarget = targetGroup.tasks.some(t => (t.id === task.id || t._id?.toString() === task.id))

        if (sourceGroupId.toString() === targetId || taskAlreadyInTarget) return false

        const sourceGroup = board.groups.find(g => (g.id === sourceGroupId || g._id?.toString() === sourceGroupId))
        if (sourceGroup) {
            sourceGroup.tasks = sourceGroup.tasks.filter(t => (t.id !== task.id && t._id?.toString() !== task.id))
            targetGroup.tasks.unshift(task)
            return true
        }
        return false
    }

    _moveToTopGroup(board, sourceGroupId, task) {
        if (!board.groups.length) return false
        const targetGroup = board.groups[0]
        
        const targetId = targetGroup.id || targetGroup._id?.toString()
        const taskAlreadyInTarget = targetGroup.tasks.some(t => (t.id === task.id || t._id?.toString() === task.id))

        if (sourceGroupId.toString() === targetId || taskAlreadyInTarget) return false

        const sourceGroup = board.groups.find(g => (g.id === sourceGroupId || g._id?.toString() === sourceGroupId))
        if (sourceGroup) {
            sourceGroup.tasks = sourceGroup.tasks.filter(t => (t.id !== task.id && t._id?.toString() !== task.id))
            targetGroup.tasks.unshift(task)
            return true
        }
        return false
    }

    _duplicateTask(board, groupId, task) {
        const sourceGroup = board.groups.find(g => (g.id === groupId || g._id?.toString() === groupId))
        if (sourceGroup) {
            const duplicateTask = structuredClone(task)
            duplicateTask.id = 't' + Date.now().toString()
            duplicateTask.title += ' (Copy)'
            sourceGroup.tasks.unshift(duplicateTask)
            return true
        }
        return false
    }
}

const automationService = new AutomationService()
module.exports = automationService
