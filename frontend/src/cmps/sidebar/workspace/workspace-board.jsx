import React, { useState } from 'react'
import { BsFillLightningFill } from 'react-icons/bs'
import { IoIosArrowDown } from 'react-icons/io'
import { AiOutlinePlus, AiOutlineSearch } from 'react-icons/ai'
import { AiFillHome } from 'react-icons/ai'
import { BoardPreview } from '../../board/board-preview'
import { setCurrWorkspace } from '../../../store/workspace.actions'

export default function WorkspaceBoard({ 
    handleChange, 
    filterByToEdit, 
    setIsCreateModalOpen, 
    boards, 
    workspaces, 
    currWorkspaceId, 
    setIsCreateWorkspaceModalOpen 
}) {
    const [isWsSelectOpen, setIsWsSelectOpen] = useState(false)

    const currWorkspace = workspaces.find(ws => ws._id === currWorkspaceId) || workspaces[0]

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
                                        style={{ 
                                            padding: '8px 16px', 
                                            cursor: 'pointer', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '10px',
                                            backgroundColor: ws._id === currWorkspaceId ? '#e1f2ff' : 'transparent'
                                        }}
                                        className="ws-item"
                                    >
                                        <div style={{ width: '16px', height: '16px', backgroundColor: ws.color, borderRadius: '3px' }} />
                                        <span style={{ fontSize: '14px' }}>{ws.title}</span>
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
