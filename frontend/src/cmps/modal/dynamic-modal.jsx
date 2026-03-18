import React, { useRef } from 'react'
import { useSelector } from 'react-redux'
import { closeDynamicModal } from '../../store/board.actions'

import { ColorPalette } from '../color-palette'
import { GroupMenuModal } from './group-menu-modal'
import { AddColumnModal } from './add-column-modal'
import { RemoveColumnModal } from './remove-column-modal'
import { TaskMenuModal } from './task-menu-modal'
import { ModalMember } from './modal-member'
import { ModalStatusPriority } from './modal-status-priority'
import { AddGroupModal } from './add-group-modal'
import { MemberFilterModal } from './member-filter-modal'
import { ChartTypeModal } from './chart-type-modal'
import { BoardMenuModal } from './board-menu-modal'
import { FilesModal } from './files-modal'

export function DynamicModal() {
    const timeoutRef = useRef(null)
    const dynamicModalObj = useSelector(storeState => storeState.boardModule.dynamicModalObj)

    function onMouseLeave() {
        timeoutRef.current = setTimeout(() => {
            closeDynamicModal()
        }, 500)
    }

    function onMouseEnter() {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
    }

    function getDynamicModalByType(type) {
        switch (type) {
            case 'files-modal':
                return <FilesModal dynamicModalObj={dynamicModalObj} />
            case 'menu-group':
                return <GroupMenuModal dynamicModalObj={dynamicModalObj} />
            case 'palette-modal':
                return <ColorPalette dynamicModalObj={dynamicModalObj} />
            case 'add-column':
                return <AddColumnModal dynamicModalObj={dynamicModalObj} />
            case 'remove-column':
                return <RemoveColumnModal dynamicModalObj={dynamicModalObj} />
            case 'menu-task':
                return <TaskMenuModal dynamicModalObj={dynamicModalObj} />
            case 'member-modal':
                return <ModalMember dynamicModalObj={dynamicModalObj} />
            case 'status':
                return <ModalStatusPriority dynamicModalObj={dynamicModalObj} />
            case 'priority':
                return <ModalStatusPriority dynamicModalObj={dynamicModalObj} />
            case 'add-group':
                return <AddGroupModal dynamicModalObj={dynamicModalObj} />
            case 'member-filter':
                return <MemberFilterModal dynamicModalObj={dynamicModalObj} />
            case 'chart-type':
                return <ChartTypeModal dynamicModalObj={dynamicModalObj} />
            case 'board-menu':
                return <BoardMenuModal dynamicModalObj={dynamicModalObj} />
            default: return
        }
    }

    function isDynamicModalOpen() {
        if (!dynamicModalObj) return false
        if (dynamicModalObj.isOpen && dynamicModalObj.type === 'add-column' && dynamicModalObj.columns?.length === 0) return false
        return dynamicModalObj.isOpen
    }

    if (!dynamicModalObj) return null

    return (
        <>
            {isDynamicModalOpen() &&
                <>
                    <div className="modal-overlay" onClick={closeDynamicModal} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 999 }} />
                    <div className="dynamic-modal" style={{ left: dynamicModalObj.pos.x, top: dynamicModalObj.pos.y }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                        {getDynamicModalByType(dynamicModalObj.type)}
                    </div>
                </>
            }
        </>
    )
}
