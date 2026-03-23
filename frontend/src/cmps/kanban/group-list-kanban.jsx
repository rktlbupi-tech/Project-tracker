import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'

import { handleOnDragEnd } from "../../store/board.actions"
import { GroupPreviewKanban } from "./group-preview-kanban"

export function GroupListKanban({ board }) {

    if (!board.groups || board.groups.length === 0) {
        return (
            <div className="empty-tasks-container flex column align-center justify-center" style={{ width: '100%', height: 'calc(100vh - 250px)' }}>
                <img 
                    src={require('../../assets/img/empty_state_modern.png')} 
                    alt="No tasks" 
                    style={{ width: '380px', maxWidth: '80%', opacity: 0.8, marginBottom: '24px' }} 
                />
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '24px', fontWeight: 600, color: '#172b4d', marginBottom: '8px' }}>Your Kanban board is empty</h3>
                    <p style={{ color: '#5e6c84', fontSize: '16px' }}>Start moving groups or adding tasks to see them here.</p>
                </div>
            </div>
        )
    }
    return (
        <DragDropContext onDragEnd={(ev) => handleOnDragEnd(ev, board)}>
            <Droppable droppableId='groupList' type='group' direction='horizontal'>
                {(provided) => (
                    <div ref={provided.innerRef}
                        {...provided.droppableProps}>
                        <div className="group-list-kanban">
                            {board.groups.map((group, index) =>
                                <div className="group-list-ul" key={group.id}>
                                    <Draggable key={group.id || group._id} draggableId={`${group.id || group._id}`} index={index} >
                                        {(provided) => (
                                            <div
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                ref={provided.innerRef}
                                                className='flex'>
                                                <GroupPreviewKanban board={board} group={group} index={index} />
                                            </div>
                                        )}
                                    </Draggable>
                                </div>
                            )}
                        </div>
                        {provided.placeholder}
                    </div >
                )}
            </Droppable>
        </DragDropContext>
    )
}

