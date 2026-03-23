import { DragDropContext, Droppable } from 'react-beautiful-dnd'

import { GroupPreview } from './group-preview'
import { handleOnDragEnd } from "../../store/board.actions"

import { useRef } from 'react'

export function GroupList({ board }) {
    const containerRef = useRef()

    function getCellWidth() {
        return board.cmpsOrder.reduce((acc, cmpOrder) => {
            if (cmpOrder === 'person') acc += 87
            else acc += 139
            return acc
        }, 600)
    }

    if (!board.groups || board.groups.length === 0) {
        return (
            <div className="empty-tasks-container flex column align-center justify-center" style={{ padding: '60px 20px', backgroundColor: 'transparent' }}>
                <img 
                    src={require('../../assets/img/empty_state_modern.png')} 
                    alt="No tasks" 
                    style={{ width: '420px', maxWidth: '100%', opacity: 1, filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.04))' }} 
                />
                <div className="text-content" style={{ textAlign: 'center', marginTop: '10px' }}>
                    <h3 style={{ fontSize: '24px', fontWeight: 600, color: '#172b4d', marginBottom: '8px' }}>Your project starts here</h3>
                    <p style={{ color: '#5e6c84', fontSize: '16px', maxWidth: '400px', margin: '0 auto' }}>Create a group or add a task to get things moving. Teamwork starts with a single task.</p>
                </div>
            </div>
        )
    }
    return <div ref={containerRef} style={{ minWidth: getCellWidth() }}>
        <DragDropContext onDragEnd={(ev) => handleOnDragEnd(ev, board)}>
            <Droppable droppableId={board._id} type='group'>
                {(droppableProvided) => {
                    return <section ref={droppableProvided.innerRef}{...droppableProvided.droppableProps} className="group-list">
                        <ul>
                            {board.groups.map((group, idx) => {
                                return (
                                    <li key={idx}><GroupPreview idx={idx} group={group} board={board} /></li>)
                            })}
                        </ul>
                    </section>
                }}
            </Droppable>
        </DragDropContext>
    </div>
}