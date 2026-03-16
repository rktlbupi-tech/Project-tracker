import { FiTrash, FiPlus, FiCheck } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { setDynamicModalObj } from '../../store/board.actions'
import { removeWorkspace, setCurrentWorkspace } from '../../store/workspace.actions'

export function WorkspaceMenuModal({ dynamicModalObj }) {
    const workspaces = useSelector(storeState => storeState.workspaceModule.workspaces)
    const currentWorkspace = useSelector(storeState => storeState.workspaceModule.currentWorkspace)

    function onSelectWorkspace(workspace) {
        setCurrentWorkspace(workspace)
        setDynamicModalObj({ isOpen: false })
    }

    async function onRemoveWorkspace(ev, workspaceId) {
        ev.stopPropagation()
        try {
            await removeWorkspace(workspaceId)
            if (currentWorkspace?._id === workspaceId) {
                setCurrentWorkspace(workspaces.find(ws => ws._id !== workspaceId))
            }
        } catch (err) {
            console.log('Cannot remove workspace', err)
        }
    }

    function onAddNewWorkspace() {
        setDynamicModalObj({ isOpen: false })
        dynamicModalObj.onAddWorkspace()
    }

    return (
        <section className="workspace-menu-modal">
            <div className="menu-header">Workspaces</div>
            <div className="workspace-list">
                {workspaces.map(ws => (
                    <div 
                        key={ws._id} 
                        className={`workspace-item flex space-between align-center ${currentWorkspace?._id === ws._id ? 'active' : ''}`}
                        onClick={() => onSelectWorkspace(ws)}
                    >
                        <div className="flex align-center gap-8">
                            {currentWorkspace?._id === ws._id && <FiCheck className="check-icon" />}
                            <span>{ws.title}</span>
                        </div>
                        {workspaces.length > 1 && (
                            <FiTrash 
                                className="trash-icon" 
                                onClick={(ev) => onRemoveWorkspace(ev, ws._id)} 
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className="divider"></div>
            <div className="add-workspace" onClick={onAddNewWorkspace}>
                <FiPlus />
                <span>Add Workspace</span>
            </div>
        </section>
    )
}
