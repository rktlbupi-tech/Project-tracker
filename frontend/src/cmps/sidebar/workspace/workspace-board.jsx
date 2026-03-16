import React, { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { loadWorkspaces } from '../../../store/workspace.actions'
import { setDynamicModalObj } from '../../../store/board.actions'
import { BoardPreview } from '../../board/board-preview'
import { BsFillLightningFill } from 'react-icons/bs'
import { IoIosArrowDown } from 'react-icons/io'
import { AiOutlinePlus, AiOutlineSearch, AiFillHome } from 'react-icons/ai'

export default function WorkspaceBoard({handleChange , filterByToEdit, setIsCreateModalOpen, boards, setIsWorkspaceCreateOpen}) {
  const currentWorkspace = useSelector(storeState => storeState.workspaceModule.currentWorkspace)
  const elWorkspaceSelect = useRef()

  useEffect(() => {
    loadWorkspaces()
  }, [])

  function onToggleWorkspaceMenu(ev) {
    ev.stopPropagation()
    const { x, y } = elWorkspaceSelect.current.getBoundingClientRect()
    setDynamicModalObj({ 
        isOpen: true, 
        pos: { x: x, y: y + 45 }, 
        type: 'workspace-menu',
        onAddWorkspace: () => setIsWorkspaceCreateOpen(true)
    })
  }

  const workspaceTitle = currentWorkspace?.title || 'Main Workspace'

  const filteredBoards = currentWorkspace 
    ? boards.filter(b => b.workspaceId === currentWorkspace._id || (!b.workspaceId && currentWorkspace.title === 'Sprint 4'))
    : boards

  return (
      <div className="workspace-sidebar-header">
      <div className='workspace-sidebar-items'>
          <div className="workspace-title-container flex space-between align-center">
              <span className='workspace-title'>Workspace</span>
          </div>
          <div 
            ref={elWorkspaceSelect}
            className='workspace-select flex space-between align-center'
            onClick={onToggleWorkspaceMenu}
            style={{ cursor: 'pointer' }}
          >
              <div className='workspace-logo flex align-items'>
                  <div className='lightning-container'>
                      <BsFillLightningFill />
                  </div>
                  <AiFillHome className='home' />
                  <h5 className='workspace-title'>{workspaceTitle}</h5>
              </div>
              <IoIosArrowDown className='icon' />
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
          {filteredBoards.map(board => {
              return <li key={board._id} className='board-list'>
                  <BoardPreview board={board} />
              </li>
          })}
      </ul>
  </div>
  )
}
