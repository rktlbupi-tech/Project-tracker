const boardService = require('../api/board/board.service')
const userService = require('../api/user/user.service')
const logger = require('./logger.service')

const CHECK_INTERVAL = 1000 * 60 * 5 // Check every 5 minutes

class DeadlineReminderService {
    constructor() {
        this.startReminders()
    }

    startReminders() {
        logger.info('[Deadline Service] Starting reminder engine...')
        setInterval(() => {
            this.checkDeadlines()
        }, CHECK_INTERVAL)
    }

    async checkDeadlines() {
        try {
            const filterStr = JSON.stringify({}) // Query all
            const boards = await boardService.query({})
            
            const now = Date.now()
            const oneDay = 24 * 60 * 60 * 1000

            for (const board of boards) {
                let boardChanged = false
                const deepBoard = await boardService.getById(board._id)
                
                for (const group of deepBoard.groups) {
                    for (const task of group.tasks) {
                        if (!task.deadline) continue
                        if (task.notifiedDeadline) continue

                        const diff = task.deadline - now
                        
                        // If deadline is within 24 hours and in the future
                        if (diff > 0 && diff < oneDay) {
                            await this.sendNotification(deepBoard, task)
                            task.notifiedDeadline = true
                            boardChanged = true
                        }
                    }
                }

                if (boardChanged) {
                    await boardService.update(deepBoard)
                }
            }
        } catch (err) {
            logger.error('[Deadline Service] Error checking deadlines:', err)
        }
    }

    async sendNotification(board, task) {
        const socketService = require('./socket.service')
        const recipients = (task.memberIds && task.memberIds.length) 
            ? task.memberIds 
            : board.members.map(m => m._id)

        if (!recipients.length && board.createdBy) {
            recipients.push(board.createdBy._id)
        }

        const notification = {
            id: userService.makeId(),
            type: 'deadline-approaching',
            txt: `Deadline approaching for: ${task.title}`,
            createdAt: Date.now(),
            isRead: false,
            from: {
                fullname: 'System',
                imgUrl: 'https://res.cloudinary.com/du63kkxhl/image/upload/v1675013009/guest_f8d60j.png'
            },
            board: {
                _id: board._id,
                title: board.title
            },
            task: {
                id: task.id,
                title: task.title
            }
        }

        logger.info(`[Deadline Service] Notifying ${recipients.length} users about task: ${task.title}`)
        
        for (const userId of recipients) {
            try {
                const userIdStr = userId.toString()
                await userService.addNotification(userIdStr, notification)
                socketService.emitToUser({
                    type: 'notification-received',
                    data: notification,
                    userId: userIdStr
                })
            } catch (err) {
                logger.error(`[Deadline Service] Failed to notify user ${userId}`, err)
            }
        }
    }
}

module.exports = new DeadlineReminderService()
