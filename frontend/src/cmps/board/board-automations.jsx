import React, { useState } from 'react'
import { IoCloseOutline, IoTrashOutline, IoChevronBackOutline } from 'react-icons/io5'
import { FaRobot, FaPlus, FaBolt, FaArrowRight, FaMagic } from 'react-icons/fa'
import { updateOptimisticBoard } from '../../store/board.actions'
import { utilService } from '../../services/util.service'
import { loggerService } from '../../services/logger.service'

export function BoardAutomations({ board, setIsAutomationsOpen }) {
    const [isCreating, setIsCreating] = useState(false)
    const [creationMode, setCreationMode] = useState('recipe') // 'recipe' | 'custom'

    // Smart Recipes (Updated for User requests)
    const recipes = [
        {
            id: 'r1',
            title: 'Highlight High Priority',
            description: 'When priority changes to High, highlight the item with a golden glow.',
            trigger: { type: 'COLUMN_CHANGE', columnType: 'priority', value: 'High' },
            action: { type: 'HIGHLIGHT' }
        },
        {
            id: 'r2',
            title: 'Move Stuck to Attention',
            description: 'When status changes to Stuck, move item to "Need Attention" group.',
            trigger: { type: 'COLUMN_CHANGE', columnType: 'status', value: 'Stuck' },
            action: { type: 'MOVE_TO_GROUP', target: 'Need Attention' }
        },
        {
            id: 'r3',
            title: 'Progress to Top',
            description: 'When status changes to Progress, move item to the Top Group.',
            trigger: { type: 'COLUMN_CHANGE', columnType: 'status', value: 'Progress' },
            action: { type: 'MOVE_TO_GROUP', target: board.groups[0]?.title || 'Main Table' }
        },
        {
            id: 'r4',
            title: 'Auto-Archive Done',
            description: 'When status changes to Done, move the item to the Completed group.',
            trigger: { type: 'COLUMN_CHANGE', columnType: 'status', value: 'Done' },
            action: { type: 'MOVE_TO_GROUP', target: 'Completed' }
        }
    ]

    // Custom Builder Options
    const columns = [
        { id: 'status', label: 'Status' },
        { id: 'priority', label: 'Priority' }
    ]
    const columnValues = {
        status: ['Done', 'Progress', 'Stuck', 'Working on it', 'Backlog'],
        priority: ['High', 'Medium', 'Low', 'Critical']
    }
    const actionTypes = [
        { id: 'HIGHLIGHT', label: 'Highlight the item' },
        { id: 'MOVE_TO_GROUP', label: 'Move to group' },
        { id: 'RESET_STYLE', label: 'Remove highlight' },
        { id: 'DUPLICATE', label: 'Duplicate item' },
        { id: 'DELETE', label: 'Delete item' }
    ]

    // Custom Form State
    const [customColumn, setCustomColumn] = useState('status')
    const [customValue, setCustomValue] = useState('Done')
    const [customActionType, setCustomActionType] = useState('MOVE_TO_GROUP')
    const [customActionTarget, setCustomActionTarget] = useState('Completed')

    async function onAddRecipe(recipe) {
        const newAutomation = {
            id: utilService.makeId(),
            name: recipe.title,
            trigger: recipe.trigger,
            action: recipe.action,
            createdAt: Date.now(),
            isActive: true
        }
        await saveAutomation(newAutomation)
    }

    async function onSaveCustom() {
        const newAutomation = {
            id: utilService.makeId(),
            name: 'Custom Rule',
            trigger: {
                type: 'COLUMN_CHANGE',
                columnType: customColumn,
                value: customValue
            },
            action: {
                type: customActionType,
                target: customActionTarget
            },
            createdAt: Date.now(),
            isActive: true
        }
        await saveAutomation(newAutomation)
    }

    async function saveAutomation(newAutomation) {
        const newBoard = structuredClone(board)
        if (!newBoard.automations) newBoard.automations = []
        newBoard.automations.push(newAutomation)
        try {
            await updateOptimisticBoard(newBoard, board)
            setIsCreating(false)
        } catch (err) {
            loggerService.error('Failed to save automation:', err)
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
        } catch (err) {
            loggerService.error('Failed to remove automation:', err)
        }
    }

    const automations = board.automations || []

    function getAutomationLabel(auto) {
        if (typeof auto.trigger === 'string') {
            return (
                <div className="automation-details">
                    <span className="when-label">When</span> <span className="highlight tag">{auto.trigger}</span> 
                    <span className="then-label">Then</span> <span className="highlight tag">{auto.action}</span>
                </div>
            )
        }
        
        const { trigger, action } = auto
        return (
            <div className="automation-details">
                <span className="when-label">When</span> 
                {trigger.type === 'COLUMN_CHANGE' ? (
                    <> <span className="highlight tag">{trigger.columnType}</span> changes to <span className="highlight tag">{trigger.value}</span></>
                ) : (
                    <> <span className="highlight tag">Item is created</span></>
                )}
                <span className="then-label">Then</span> 
                <span className="highlight tag">
                    {action.type === 'HIGHLIGHT' && 'Highlight Item'}
                    {action.type === 'MOVE_TO_GROUP' && `Move to ${action.target || 'Group'}`}
                    {action.type === 'DUPLICATE' && `Duplicate`}
                    {action.type === 'DELETE' && `Delete`}
                    {action.type === 'RESET_STYLE' && `Remove Highlight`}
                </span>
            </div>
        )
    }

    return (
        <section className="board-automations-modal">
            <header className="header flex justify-between align-center">
                <div className="flex align-center title">
                    <FaRobot className="robot-icon" />
                    <h2>Automations Center</h2>
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
                                    <p>Automate your workflow with one click.</p>
                                    <span className="sub">Automations help you stay organized without the manual work.</span>
                                </div>
                            ) : (
                                automations.map(auto => (
                                    <div key={auto.id} className={`automation-item flex justify-between align-center ${!auto.isActive ? 'disabled' : ''}`}>
                                        {getAutomationLabel(auto)}
                                        <div className="automation-actions flex align-center">
                                            <button 
                                                className={`toggle-btn ${auto.isActive ? 'active' : ''}`} 
                                                onClick={() => onToggleAutomation(auto.id)}
                                            >
                                                {auto.isActive ? 'On' : 'Off'}
                                            </button>
                                            <button className="btn-remove-automation" onClick={() => onRemoveAutomation(auto.id)}>
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
                        <div className="creator-header flex align-center">
                            <button className="back-btn" onClick={() => setIsCreating(false)}>
                                <IoChevronBackOutline /> Back
                            </button>
                            <h3>Recipes & Builder</h3>
                        </div>

                        <div className="mode-tabs flex">
                            <button className={`tab ${creationMode === 'recipe' ? 'active' : ''}`} onClick={() => setCreationMode('recipe')}>Recommended</button>
                            <button className={`tab ${creationMode === 'custom' ? 'active' : ''}`} onClick={() => setCreationMode('custom')}>Custom Builder</button>
                        </div>

                        {creationMode === 'recipe' ? (
                            <div className="recipes-grid">
                                {recipes.map(recipe => (
                                    <div key={recipe.id} className="recipe-card" onClick={() => onAddRecipe(recipe)}>
                                        <div className="recipe-icon"><FaMagic /></div>
                                        <h4>{recipe.title}</h4>
                                        <p>{recipe.description}</p>
                                        <button className="btn-use-recipe">Use Recipe</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="custom-builder">
                                <form className="custom-builder-form" onSubmit={(e) => { e.preventDefault(); onSaveCustom(); }}>
                                    <div className="builder-sentence flex wrap align-center">
                                        <FaBolt className="bolt-icon" />
                                        <span>When</span>
                                        <select className="inline-select" value={customColumn} onChange={(e) => setCustomColumn(e.target.value)}>
                                            {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                        </select>
                                        <span>changes to</span>
                                        <select className="inline-select" value={customValue} onChange={(e) => setCustomValue(e.target.value)}>
                                            {columnValues[customColumn].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>

                                        <FaArrowRight className="arrow-icon" />
                                        <span>Then</span>
                                        <select className="inline-select" value={customActionType} onChange={(e) => setCustomActionType(e.target.value)}>
                                            {actionTypes.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                                        </select>

                                        {customActionType === 'MOVE_TO_GROUP' && (
                                            <select className="inline-select" value={customActionTarget} onChange={(e) => setCustomActionTarget(e.target.value)}>
                                                <option value="">Select Group...</option>
                                                {board.groups.map(g => <option key={g.id} value={g.title}>{g.title}</option>)}
                                            </select>
                                        )}
                                    </div>
                                    <div className="creator-actions flex justify-end">
                                        <button type="submit" className="btn-save btn-custom-save">Create Automation</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    )
}
