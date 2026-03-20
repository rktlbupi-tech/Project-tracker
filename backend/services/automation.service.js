const eventBus = require('./event-bus.service')
const boardService = require('../api/board/board.service')

const delay = ms => new Promise(res => setTimeout(res, ms))

class AutomationService {
    constructor() {
        this.initListeners()
    }

    initListeners() {
        eventBus.on('TASK_UPDATED', async ({ boardId, groupId, task, change }) => {
            try {
                await delay(100)
                await this.evaluateAutomations(boardId, groupId, task, 'TASK_UPDATED', change)
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

    async evaluateAutomations(boardId, groupId, updatedTask, eventType, change = {}) {
        const board = await boardService.getById(boardId)
        if (!board || !board.automations || !board.automations.length) return

        // Critical: Find the actual task object within the newly fetched board context
        const group = board.groups.find(g => (g.id === groupId || g._id?.toString() === groupId))
        if (!group) return
        const taskToModify = group.tasks.find(t => (t.id === updatedTask.id || t.id === updatedTask._id || t._id?.toString() === updatedTask.id))
        if (!taskToModify) return

        let boardNeedsSave = false
        let hasMoved = false

        // --- GLOBAL DEFAULT: Reset highlight if priority is changed to non-High ---
        if (change.priority && change.priority !== 'High' && taskToModify.style && taskToModify.style.backgroundColor) {
            console.log(`[Automation Engine] Priority changed to ${change.priority}, resetting style for: ${taskToModify.title}`)
            taskToModify.style = {}
            boardNeedsSave = true
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
                    if (taskToModify[columnType] === value) isTriggered = true
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
        // CRITICAL: We only move groups if the 'status' column was specifically updated.
        if (eventType === 'TASK_UPDATED' && change.status && !hasMoved) {
            const isTopGroup = board.groups[0].id === groupId || board.groups[0]._id?.toString() === groupId
            if (!isTopGroup) {
                console.log(`[Automation Engine] Status changed to '${change.status}' with no move rule. Returning to Top Group.`)
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
                    console.log(`[Automation Engine] Highlighting task: ${task.title}`)
                    task.style = { 
                        backgroundColor: 'rgba(255, 171, 0, 0.12)', 
                        boxShadow: 'inset 4px 0 0 #ffab00, 0 0 12px rgba(255, 171, 0, 0.1)',
                        borderBottom: '1px solid rgba(255, 171, 0, 0.2)',
                        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                    }
                    return true
                case 'RESET_STYLE':
                    task.style = {}
                    return true
                case 'MOVE_TO_GROUP':
                    return this._moveToGroup(board, sourceGroupId, task, [target.toLowerCase()], target, '#735dd1')
                case 'DUPLICATE':
                    return this._duplicateTask(board, sourceGroupId, task)
                case 'DELETE':
                    return this._deleteTask(board, sourceGroupId, task)
                case 'CHANGE_COLUMN':
                    task[columnType] = value
                    return true
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
            const duplicateTask = { 
                ...structuredClone(task), 
                id: 't' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
                title: task.title + ' (Copy)'
            }
            sourceGroup.tasks.unshift(duplicateTask)
            return true
        }
        return false
    }

    _deleteTask(board, groupId, task) {
        const sourceGroup = board.groups.find(g => (g.id === groupId || g._id?.toString() === groupId))
        if (sourceGroup) {
            sourceGroup.tasks = sourceGroup.tasks.filter(t => (t.id !== task.id && t._id?.toString() !== task.id))
            return true
        }
        return false
    }
}

const automationService = new AutomationService()
module.exports = automationService
