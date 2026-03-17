import React, { useState } from 'react'
import { IoCloseOutline, IoTrashOutline } from 'react-icons/io5'
import { FaRobot, FaPlus } from 'react-icons/fa'
import { updateOptimisticBoard } from '../../store/board.actions'
import { utilService } from '../../services/util.service'

import { loggerService } from '../../services/logger.service'

export function BoardAutomations({ board, setIsAutomationsOpen }) {
    const [isCreating, setIsCreating] = useState(false)

    // Preset options
    const triggers = [
        'Status changes to Done', 
        'Status changes to Stuck', 
        'Status changes to Progress'
    ]
    const actions = [
        'Move item to Completed', 
        'Move item to Backlog', 
        'Move item to Top Group', 
        'Duplicate item'
    ]

    const [selectedTrigger, setSelectedTrigger] = useState(triggers[0])
    const [selectedAction, setSelectedAction] = useState(actions[0])

    async function onSaveAutomation() {
        const newAutomation = {
            id: utilService.makeId(),
            trigger: selectedTrigger,
            action: selectedAction,
            createdAt: Date.now(),
            isActive: true
        }

        const newBoard = structuredClone(board)
        if (!newBoard.automations) newBoard.automations = []
        newBoard.automations.push(newAutomation)

        try {
            await updateOptimisticBoard(newBoard, board)
            setIsCreating(false)
        } catch (err) {
            console.error('Failed to save automation:', err)
        }
    }

    async function onToggleAutomation(automationId) {
        const newBoard = structuredClone(board)
        const auto = newBoard.automations.find(a => a.id === automationId)
        if (auto) {
            auto.isActive = !auto.isActive
            try {
                await updateOptimisticBoard(newBoard, board)
            } catch (err) {
                loggerService.error('Failed to toggle automation:', err)
            }
        }
    }

    async function onRemoveAutomation(automationId) {
        const newBoard = structuredClone(board)
        newBoard.automations = newBoard.automations.filter(a => a.id !== automationId)
        
        try {
            await updateOptimisticBoard(newBoard, board)
            loggerService.info('Automation removed successfully')
        } catch (err) {
            loggerService.error('Failed to remove automation:', err)
        }
    }

    const automations = board.automations || []

    return (
        <section className="board-automations-modal">
            <header className="header flex justify-between align-center">
                <div className="flex align-center title">
                    <FaRobot className="robot-icon" />
                    <h2>Automations</h2>
                </div>
                <button className="close-btn btn-close" onClick={() => setIsAutomationsOpen(false)}>
                    <IoCloseOutline />
                </button>
            </header>

            <div className="content">
                {!isCreating ? (
                    <div className="automations-list-view">
                        <button className="btn-add-automation flex align-center" onClick={() => setIsCreating(true)}>
                            <FaPlus className="icon-plus" />
                            <span>Add New Automation</span>
                        </button>

                        <div className="automations-list">
                            {automations.length === 0 ? (
                                <div className="no-automations">
                                    <p>No automations set up yet. Make your board work for you!</p>
                                </div>
                            ) : (
                                automations.map(auto => (
                                    <div key={auto.id} className={`automation-item flex justify-between align-center ${!auto.isActive ? 'disabled' : ''}`}>
                                        <div className="automation-details">
                                            <span className="when-label">When</span> <span className="highlight tag">{auto.trigger}</span> 
                                            <span className="then-label">Then</span> <span className="highlight tag">{auto.action}</span>
                                        </div>
                                        <div className="automation-actions flex align-center">
                                            <button 
                                                className={`toggle-btn ${auto.isActive ? 'active' : ''}`} 
                                                onClick={() => onToggleAutomation(auto.id)}
                                            >
                                                {auto.isActive ? 'On' : 'Off'}
                                            </button>
                                            <button 
                                                className="btn-remove-automation"
                                                onClick={() => onRemoveAutomation(auto.id)}
                                                title="Remove Automation"
                                            >
                                                <IoTrashOutline />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="automation-creator">
                        <h3>Create Custom Automation</h3>
                        <div className="creator-step">
                            <label>When this happens:</label>
                            <select value={selectedTrigger} onChange={(e) => setSelectedTrigger(e.target.value)}>
                                {triggers.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="creator-step">
                            <label>Then do this:</label>
                            <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)}>
                                {actions.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className="creator-actions flex justify-end">
                            <button className="btn-cancel" onClick={() => setIsCreating(false)}>Cancel</button>
                            <button className="btn-save" onClick={onSaveAutomation}>Create Automation</button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
