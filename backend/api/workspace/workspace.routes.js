const express = require('express')
const { requireAuth } = require('../../middlewares/requireAuth.middleware')
const { log } = require('../../middlewares/logger.middleware')
const { getWorkspaces, getWorkspaceById, addWorkspace, updateWorkspace, removeWorkspace } = require('./workspace.controller')
const router = express.Router()

router.get('/', log, requireAuth, getWorkspaces)
router.get('/:id', log, requireAuth, getWorkspaceById)
router.post('/', log, requireAuth, addWorkspace)
router.put('/:id', log, requireAuth, updateWorkspace)
router.delete('/:id', log, requireAuth, removeWorkspace)

module.exports = router
