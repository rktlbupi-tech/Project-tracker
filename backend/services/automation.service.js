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

        for (const auto of board.automations) {
            if (!auto.isActive) continue

            // --- Condition 1: Status changes to Done ---
            if (auto.trigger === 'Status changes to Done' && updatedTask.status === 'Done') {
                if (auto.action === 'Move item to Completed') {
                    // Find the 'Completed' group, or create it if missing
                    let completedGroup = board.groups.find(g => g.title.toLowerCase().includes('complete') || g.title.toLowerCase() === 'done')
                    
                    if (!completedGroup) {
                        completedGroup = {
                            id: 'g' + Date.now().toString(),
                            title: 'Completed',
                            color: '#00c875',
                            tasks: []
                        }
                        board.groups.push(completedGroup)
                    }

                    // Check if it's already there
                    if (groupId === completedGroup.id) continue

                    // Remove from old group and move to new
                    const sourceGroup = board.groups.find(g => g.id === groupId)
                    if (sourceGroup) {
                        sourceGroup.tasks = sourceGroup.tasks.filter(t => t.id !== updatedTask.id)
                        completedGroup.tasks.unshift(updatedTask)
                        boardNeedsSave = true
                    }
                }
            }

            // --- Condition 2: Status changes to Stuck ---
            if (auto.trigger === 'Status changes to Stuck' && updatedTask.status === 'Stuck') {
                if (auto.action === 'Move item to Backlog') {
                    let backlogGroup = board.groups.find(g => g.title.toLowerCase().includes('backlog') || g.title.toLowerCase() === 'stuck')
                    
                    if (!backlogGroup) {
                        backlogGroup = {
                            id: 'g' + Date.now().toString(),
                            title: 'Backlog',
                            color: '#e2445c',
                            tasks: []
                        }
                        board.groups.push(backlogGroup)
                    }

                    if (groupId === backlogGroup.id) continue

                    const sourceGroup = board.groups.find(g => g.id === groupId)
                    if (sourceGroup) {
                        sourceGroup.tasks = sourceGroup.tasks.filter(t => t.id !== updatedTask.id)
                        backlogGroup.tasks.unshift(updatedTask)
                        boardNeedsSave = true
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
}

const automationService = new AutomationService()
module.exports = automationService
