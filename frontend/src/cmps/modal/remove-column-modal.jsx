import React from 'react'
import { useSelector } from 'react-redux'
import { FiTrash } from 'react-icons/fi'
import { loadBoard, saveBoard, setDynamicModalObj, updateGroupAction } from '../../store/board.actions'

export function RemoveColumnModal({dynamicModalObj}) {
    const board = useSelector(storeState => storeState.boardModule.filteredBoard)

    async function onRemoveColumn(cmpOrder) {
        try {
            if (dynamicModalObj.group) {
                const groupToUpdate = structuredClone(dynamicModalObj.group)
                if (!groupToUpdate.hiddenColumns) groupToUpdate.hiddenColumns = []
                if (!groupToUpdate.hiddenColumns.includes(cmpOrder)) {
                    groupToUpdate.hiddenColumns.push(cmpOrder)
                }
                await updateGroupAction(board, groupToUpdate)
            } else {
                board.cmpsOrder = board.cmpsOrder.filter(currCmpOrder => currCmpOrder !== cmpOrder)
                await saveBoard(board)
                loadBoard(board._id)
            }
            dynamicModalObj.isOpen = false
            setDynamicModalObj(dynamicModalObj)
        } catch (err) {
            console.log(err)
        }
    }
    return (
        <div className="delete-modal">
                <div className="delete" onClick={() => onRemoveColumn(dynamicModalObj.cmpOrder)}>
                    <FiTrash />
                    <span>Delete</span>
                </div>
            </div>
    )
}
