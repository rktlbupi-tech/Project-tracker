import { HiOutlineDocumentDuplicate } from 'react-icons/hi'
import { FiTrash } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { setDynamicModalObj } from '../../store/board.actions'

export function BoardMenuModal({ dynamicModalObj }) {
    const user = useSelector(storeState => storeState.userModule.user)
    const board = dynamicModalObj.board

    const isCreator = user?._id === board?.createdBy?._id

    function onRemoveBoard() {
        if (!isCreator) return
        setDynamicModalObj({ isOpen: false})
        dynamicModalObj.onRemove(board._id)
    }   

    function onDuplicateBoard() {
        setDynamicModalObj({ isOpen: false})
        dynamicModalObj.onDuplicate(board)
    }   
    
    return (
        <section className="board-menu-modal">
            <div className="duplicate" onClick={onDuplicateBoard}>
                <HiOutlineDocumentDuplicate />
                <span>Duplicate Board</span>
            </div>
            <div 
                className={`delete ${!isCreator ? 'disabled' : ''}`} 
                onClick={onRemoveBoard}
                title={!isCreator ? 'Only the board creator can delete this board' : ''}
                style={{
                    color: isCreator ? '#e2445c' : '#c3cfd9',
                    cursor: isCreator ? 'pointer' : 'not-allowed',
                    opacity: isCreator ? 1 : 0.7
                }}
            >
                <FiTrash />
                <span>Delete</span>
            </div>
        </section>
    )
}