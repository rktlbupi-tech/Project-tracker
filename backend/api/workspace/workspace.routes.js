const express = require('express')
const { getWorkspaces, getWorkspaceById, addWorkspace, updateWorkspace, removeWorkspace } = require('./workspace.controller')
const router = express.Router()

router.get('/', getWorkspaces)
router.get('/:id', getWorkspaceById)
router.post('/', addWorkspace)
router.put('/:id', updateWorkspace)
router.delete('/:id', removeWorkspace)

module.exports = router
