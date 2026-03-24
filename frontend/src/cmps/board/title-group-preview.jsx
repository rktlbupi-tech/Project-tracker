import { useRef } from "react"
import { useSelector } from "react-redux"

import { saveBoard, setDynamicModalObj } from "../../store/board.actions"

import { BiDotsHorizontalRounded } from 'react-icons/bi'

export function TitleGroupPreview({ title, group, isKanban, board }) {
    const dynamicModalObj = useSelector(storeState => storeState.boardModule.dynamicModalObj)
    const elRemoveColumn = useRef()

    function getTitleName(cmpOrder) {
        if (board.cmpsTitles && board.cmpsTitles[cmpOrder]) return board.cmpsTitles[cmpOrder]
        switch (cmpOrder) {
            case 'member-picker':
                return 'Person'
            case 'status-picker':
                return 'Status'
            case 'date-picker':
                return 'Date'
            case 'priority-picker':
                return 'Priority'
            case 'number-picker':
                return 'Number'
            case 'file-picker':
                return 'Files'
            case 'updated-picker':
                return 'Last Updated'
            case 'deadline-picker':
                return 'Deadline'
            case 'custom-picker':
                return 'Custom'
            default: 
                if (cmpOrder.startsWith('custom-picker')) return 'Custom'
                return 'Custom'
        }
    }

    async function onUpdateTitle(ev) {
        const val = ev.target.innerText
        if (val === getTitleName(title)) return
        const newBoard = { ...board }
        if (!newBoard.cmpsTitles) newBoard.cmpsTitles = {}
        newBoard.cmpsTitles[title] = val
        try {
            await saveBoard(newBoard)
        } catch (err) {
            console.log(err)
        }
    }

    function onToggleMenuModal() {
        const isOpen = dynamicModalObj?.group?.id === group.id && dynamicModalObj?.cmpOrder === title && dynamicModalObj?.type === 'remove-column' ? !dynamicModalObj.isOpen : true
        const { x, y } = elRemoveColumn.current.getClientRects()[0]
        setDynamicModalObj({ isOpen, pos: { x: (x - 75), y: (y + 28) }, type: 'remove-column', group: group, cmpOrder: title })
    }

    return (
        <>
            <div 
                className="column-title" 
                contentEditable 
                suppressContentEditableWarning 
                onBlur={onUpdateTitle}
                onKeyDown={(ev) => ev.key === 'Enter' && ev.target.blur()}
            >
                {getTitleName(title)}
            </div>
            <span ref={elRemoveColumn} className="open-modal-icon">
                {!isKanban && <BiDotsHorizontalRounded onClick={onToggleMenuModal} />}
            </span>
        </>
    )
}