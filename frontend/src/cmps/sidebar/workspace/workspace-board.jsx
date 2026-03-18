import React, { useState } from 'react'
import { BsFillLightningFill } from 'react-icons/bs'
import { IoIosArrowDown } from 'react-icons/io'
import { AiOutlinePlus, AiOutlineSearch } from 'react-icons/ai'
import { AiFillHome } from 'react-icons/ai'
import { BoardPreview } from '../../board/board-preview'
import { setCurrWorkspace, removeWorkspace, addWorkspace } from '../../../store/workspace.actions'
import { BsThreeDots } from 'react-icons/bs'

export default function WorkspaceBoard({ 
    handleChange, 
    filterByToEdit, 
    setIsCreateModalOpen, 
    boards, 
    workspaces, 
    currWorkspaceId, 
    setIsCreateWorkspaceModalOpen,
    user
}) {
    const [isWsSelectOpen, setIsWsSelectOpen] = useState(false)
    const [hoveredWsId, setHoveredWsId] = useState(null)
    const [menuOpenWsId, setMenuOpenWsId] = useState(null)

    const currWorkspace = workspaces.find(ws => ws._id === currWorkspaceId) || workspaces[0]

    async function onDuplicateWorkspace(ev, wsToDuplicate) {
        ev.stopPropagation()
        setMenuOpenWsId(null)
        try {
            const newWs = { ...wsToDuplicate, title: wsToDuplicate.title + ' (Copy)' }
            delete newWs._id
            const savedWs = await addWorkspace(newWs)
            setCurrWorkspace(savedWs._id)
            setIsWsSelectOpen(false)
        } catch (err) {
            console.error('Cannot duplicate workspace', err)
        }
    }

    async function onDeleteWorkspace(ev, wsId, wsCreatorId) {
        ev.stopPropagation()
        setMenuOpenWsId(null)
        if (user?._id !== wsCreatorId) {
            alert('Only the creator can delete this workspace.')
            return
        }
        if (!window.confirm('Are you sure you want to delete this workspace and all its boards?')) return
        try {
            await removeWorkspace(wsId)
            if (currWorkspaceId === wsId && workspaces.length > 1) {
                const nextWs = workspaces.find(w => w._id !== wsId)
                if (nextWs) setCurrWorkspace(nextWs._id)
            }
        } catch (err) {
            console.error('Cannot remove workspace', err)
        }
    }

    return (
        <div className="workspace-sidebar-header">
            <div className='workspace-sidebar-items'>
                <div className="workspace-title-container flex space-between align-center">
                    <span className='workspace-title'>Workspace</span>
                </div>

                <div className='workspace-select-wrapper' style={{ position: 'relative' }}>
                    <div className='workspace-select flex space-between align-center' onClick={() => setIsWsSelectOpen(!isWsSelectOpen)}>
                        <div className='workspace-logo flex align-items'>
                            <div className='lightning-container' style={{ backgroundColor: currWorkspace?.color || '#735dd1' }}>
                                <BsFillLightningFill />
                            </div>
                            <AiFillHome className='home' />
                            <h5 className='workspace-title'>{currWorkspace?.title || 'Main Workspace'}</h5>
                        </div>
                        <IoIosArrowDown className={`icon ${isWsSelectOpen ? 'rotate' : ''}`} />
                    </div>

                    {isWsSelectOpen && (
                        <div className="workspace-dropdown shadow" style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            width: '100%',
                            backgroundColor: 'white',
                            zIndex: 100,
                            borderRadius: '4px',
                            padding: '8px 0',
                            marginTop: '4px'
                        }}>
                             <div className="dropdown-section-title" style={{ padding: '4px 16px', fontSize: '12px', color: '#676879', fontWeight: 'bold' }}>MY WORKSPACES</div>
                             <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {workspaces.map(ws => (
                                    <li 
                                        key={ws._id} 
                                        onClick={() => {
                                            setCurrWorkspace(ws._id)
                                            setIsWsSelectOpen(false)
                                        }}
                                        onMouseEnter={() => setHoveredWsId(ws._id)}
                                        onMouseLeave={() => setHoveredWsId(null)}
                                        style={{ 
                                            padding: '8px 16px', 
                                            cursor: 'pointer', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between',
                                            backgroundColor: ws._id === currWorkspaceId ? '#e1f2ff' : 'transparent',
                                            position: 'relative'
                                        }}
                                        className="ws-item"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '16px', height: '16px', backgroundColor: ws.color, borderRadius: '3px' }} />
                                            <span style={{ fontSize: '14px' }}>{ws.title}</span>
                                        </div>
                                        
                                        {(hoveredWsId === ws._id || menuOpenWsId === ws._id) && (
                                            <div 
                                                onClick={(ev) => {
                                                    ev.stopPropagation()
                                                    setMenuOpenWsId(menuOpenWsId === ws._id ? null : ws._id)
                                                }}
                                                style={{ padding: '0 4px', cursor: 'pointer', color: '#676879', borderRadius: '4px' }}
                                                className="ws-options-trigger"
                                            >
                                                <BsThreeDots />
                                            </div>
                                        )}

                                        {menuOpenWsId === ws._id && (
                                            <div 
                                                className="shadow"
                                                style={{
                                                    position: 'absolute',
                                                    right: '16px',
                                                    top: '32px',
                                                    backgroundColor: 'white',
                                                    borderRadius: '4px',
                                                    zIndex: 200,
                                                    width: '120px',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <div 
                                                    onClick={(ev) => onDuplicateWorkspace(ev, ws)}
                                                    style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer', display: 'block' }}
                                                    className="opts-item"
                                                >
                                                    Duplicate
                                                </div>
                                                <div 
                                                    onClick={(ev) => {
                                                        const isOwner = user?._id === ws.createdBy?._id
                                                        if (!isOwner) {
                                                            ev.stopPropagation()
                                                            return
                                                        }
                                                        onDeleteWorkspace(ev, ws._id, ws.createdBy?._id)
                                                    }}
                                                    style={{ 
                                                        padding: '8px 12px', 
                                                        fontSize: '13px', 
                                                        cursor: user?._id === ws.createdBy?._id ? 'pointer' : 'not-allowed', 
                                                        display: 'block', 
                                                        color: user?._id === ws.createdBy?._id ? 'red' : '#c3cfd9'
                                                    }}
                                                    className="opts-item"
                                                    title={user?._id === ws.createdBy?._id ? '' : 'Only the creator can delete this workspace'}
                                                >
                                                    Delete
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                ))}
                             </ul>
                             <div style={{ borderTop: '1px solid #eee', marginTop: '8px', paddingTop: '8px' }}>
                                <div 
                                    onClick={() => {
                                        setIsCreateWorkspaceModalOpen(true)
                                        setIsWsSelectOpen(false)
                                    }}
                                    style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: '#0073ea' }}
                                >
                                    <AiOutlinePlus />
                                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Add new workspace</span>
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                <div className='workspace-btns'>
                    <div onClick={() => setIsCreateModalOpen((prev) => !prev)} >
                        <AiOutlinePlus className='icon' />
                        <span>Add</span>
                    </div>
                    <div className='search-board'>
                        <div className='flex'>
                            <AiOutlineSearch className='icon' />
                            <input type="text"
                                name='title'
                                className='search-input'
                                value={filterByToEdit.title}
                                placeholder="Search"
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <ul className='board-list-container flex column'>
                {boards.length > 0 ? (
                    boards.map(board => (
                        <li key={board._id} className='board-list'>
                            <BoardPreview board={board} />
                        </li>
                    ))
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#676879', fontSize: '13px' }}>
                        No boards found in this workspace.
                    </div>
                )}
            </ul>
        </div>
    )
}
