import { useState } from "react"
import { workspaceService } from "../../services/workspace.service"
import { addWorkspace } from "../../store/workspace.actions"
import { AiOutlineClose } from "react-icons/ai"

export function CreateWorkspace({ setIsModalOpen }) {
    const [workspace, setWorkspace] = useState(workspaceService.getEmptyWorkspace())

    async function onAddWorkspace(ev) {
        ev.preventDefault()
        if (!workspace.title) return
        try {
            await addWorkspace(workspace)
            setIsModalOpen(false)
        } catch (err) {
            console.log('err:', err)
        }
    }

    function handleChange({ target }) {
        let { value, name: field } = target
        setWorkspace((prevWs) => ({ ...prevWs, [field]: value }))
    }

    return (
        <section className="create-board-modal flex column">
            <div className="close" onClick={() => setIsModalOpen(false)}>
                <AiOutlineClose className="icon" />
            </div>
            <h1>Create workspace</h1>
            <p>A workspace is a group of boards and people. Together you can organize all your projects.</p>
            <form onSubmit={onAddWorkspace} className="flex column" style={{ gap: '15px', marginTop: '10px' }}>
                <div className="field">
                   <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px' }}>Workspace name</label>
                   <input 
                        type="text"
                        name="title"
                        value={workspace.title}
                        onChange={handleChange}
                        autoFocus
                        placeholder="e.g. Marketing Team"
                    />
                </div>
                <div className="field">
                   <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '5px' }}>Workspace color</label>
                   <div className="flex" style={{ gap: '10px' }}>
                       {['#735dd1', '#0073ea', '#ffcb00', '#df2f4a', '#00c875'].map(color => (
                           <div 
                                key={color} 
                                onClick={() => setWorkspace(prev => ({ ...prev, color }))}
                                style={{ 
                                    width: '24px', 
                                    height: '24px', 
                                    backgroundColor: color, 
                                    borderRadius: '4px', 
                                    cursor: 'pointer',
                                    border: workspace.color === color ? '2px solid #555' : 'none'
                                }}
                            />
                       ))}
                   </div>
                </div>
                <button 
                    type="submit" 
                    className="btn-create" 
                    disabled={!workspace.title}
                    style={{ 
                        marginTop: '10px', 
                        backgroundColor: workspace.title ? '#0073ea' : '#c3cfd9' 
                    }}
                >
                    Create Workspace
                </button>
            </form>
        </section>
    )
}
