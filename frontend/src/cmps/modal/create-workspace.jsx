import { useState } from "react";
import { saveWorkspace } from "../../store/workspace.actions";
import { AiOutlineClose } from "react-icons/ai";

export function CreateWorkspace({ setIsModalOpen }) {
    const[workspace, setWorkspace] = useState({ title: '' })

    async function onAddWorkspace(ev) {
        ev.preventDefault()
        try {
            await saveWorkspace(workspace)
            setIsModalOpen(false)
        } catch (err) {
            console.log('err:', err)
        }
    }

    function handleChange({ target }) {
        let { value, name: field } = target
        setWorkspace((prev) => ({ ...prev, [field]: value }))
    }

    return (
        <section className="create-board-modal flex column">
            <div className="close" onClick={() => setIsModalOpen(false)}>
                <AiOutlineClose className="icon" />
            </div>
            <h1>Create workspace</h1>
            <h3>Workspace name</h3>
            <form onSubmit={onAddWorkspace}>
                <input  type="text"
                        name="title"
                        autoFocus
                        value={workspace.title}
                        onChange={handleChange}
                        placeholder="New Workspace"
                        />
                <button style={{ display: 'none' }}></button>
            </form>
            <div className="flex space-between" style={{ marginTop: '20px' }}>
                <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button className="btn-primary" onClick={onAddWorkspace} disabled={!workspace.title}>Create</button>
            </div>
    </section>
    )
}
