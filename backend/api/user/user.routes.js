const express = require('express')
const {requireAuth, requireAdmin} = require('../../middlewares/requireAuth.middleware')
const {getUser, getUsers, deleteUser, updateUser, inviteUser, updateInvitation, toggleStarred, clearNotifications, markNotificationsRead, markSingleNotificationRead, updateLastSeenNotifications} = require('./user.controller')
const router = express.Router()

// middleware that is specific to this router
// router.use(requireAuth)

router.get('/', getUsers)
router.get('/:id', getUser)
router.post('/invite', requireAuth, inviteUser)
router.post('/invitation', requireAuth, updateInvitation)
router.post('/toggle-starred', requireAuth, toggleStarred)
router.post('/clear-notifications', requireAuth, clearNotifications)
router.post('/mark-read', requireAuth, markNotificationsRead)
router.post('/mark-single-read', requireAuth, markSingleNotificationRead)
router.post('/update-last-seen', requireAuth, updateLastSeenNotifications)
router.put('/:id', requireAuth,  updateUser)

// router.put('/:id',  requireAuth, updateUser)
router.delete('/:id',  requireAuth, requireAdmin, deleteUser)

module.exports = router