const eventBus = require('./event-bus.service')
const boardService = require('../api/board/board.service')

// A generic "Wait" function to ensure sequence.
const delay = ms => new Promise(res => setTimeout(res, ms))

class AutomationService {
    constructor() {
        this.initListeners()
    }

    initListeners() {
        eventBus.on('TASK_UPDATED', async ({ boardId, groupId, task }) => {
            try {
                // To avoid rapid recursive loops, add a small wait.
                await delay(100)
                await this.evaluateAutomations(boardId, groupId, task)
            } catch (err) {
                console.error('Automation Engine Error:', err)
            }
        })
    }

    async evaluateAutomations(boardId, groupId, updatedTask) {
        const board = await boardService.getById(boardId)
        if (!board || !board.automations || !board.automations.length) return

        let boardNeedsSave = false
        console.log(`[Automation Engine] Evaluating ${board.automations.length} automations for board: ${board.title}`)

        for (const auto of board.automations) {
            if (!auto.isActive) continue

            // --- Condition 1: Status changes to Done ---
            if (auto.trigger === 'Status changes to Done' && updatedTask.status === 'Done') {
                console.log(`[Automation Engine] Trigger matched: Status changes to Done`)
                if (auto.action === 'Move item to Completed') {
                    boardNeedsSave = this._moveToGroup(board, groupId, updatedTask, ['complete', 'done', 'completed'], 'Completed', '#00c875')
                }
            }

            // --- Condition 2: Status changes to Stuck ---
            if (auto.trigger === 'Status changes to Stuck' && updatedTask.status === 'Stuck') {
                console.log(`[Automation Engine] Trigger matched: Status changes to Stuck`)
                if (auto.action === 'Move item to Backlog') {
                    boardNeedsSave = this._moveToGroup(board, groupId, updatedTask, ['backlog', 'stuck', 'blocked'], 'Backlog', '#e2445c')
                }
            }

            // --- Condition 3: Status changes to Progress ---
            if ((auto.trigger === 'Status changes to Progress' || auto.trigger === 'Status changes to Working on it') && 
                (updatedTask.status === 'Progress' || updatedTask.status === 'Working on it')) {
                console.log(`[Automation Engine] Trigger matched: Status changes to Progress`)
                if (auto.action === 'Move item to Top Group' || auto.action === 'Move item to Working on it') {
                    boardNeedsSave = this._moveToTopGroup(board, groupId, updatedTask)
                }
                if (auto.action === 'Duplicate item') {
                    const sourceGroup = board.groups.find(g => (g.id === groupId || g._id?.toString() === groupId))
                    if (sourceGroup) {
                        const duplicateTask = { 
                            ...structuredClone(updatedTask), 
                            id: 't' + Date.now().toString() + Math.random().toString(36).substr(2, 5),
                            title: updatedTask.title + ' (Copy)'
                        }
                        sourceGroup.tasks.unshift(duplicateTask)
                        boardNeedsSave = true
                        console.log(`[Automation Engine] Task duplicated successfully`)
                    }
                }
            }
        }

        if (boardNeedsSave) {
            console.log(`[Automation Engine] Executing automation on board ${boardId}`)
            const savedBoard = await boardService.update(board)
            eventBus.emit('BOARD_UPDATED', savedBoard)
        }
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
            console.log(`[Automation Engine] Created new '${defaultTitle}' group`)
        }

        const targetId = targetGroup.id || targetGroup._id?.toString()
        const taskAlreadyInTarget = targetGroup.tasks.some(t => (t.id === task.id || t._id?.toString() === task.id))

        if (sourceGroupId.toString() === targetId || taskAlreadyInTarget) {
            console.log(`[Automation Engine] Item already in target group, skipping.`)
            return false
        }

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

        if (sourceGroupId.toString() === targetId || taskAlreadyInTarget) {
            console.log(`[Automation Engine] Item already in Top Group, skipping.`)
            return false
        }

        const sourceGroup = board.groups.find(g => (g.id === sourceGroupId || g._id?.toString() === sourceGroupId))
        if (sourceGroup) {
            sourceGroup.tasks = sourceGroup.tasks.filter(t => (t.id !== task.id && t._id?.toString() !== task.id))
            targetGroup.tasks.unshift(task)
            return true
        }
        return false
    }
}

const automationService = new AutomationService()
module.exports = automationService
