import { workspaceService } from "../services/workspace.service"
import { store } from "../store/store"
import { SET_WORKSPACES, ADD_WORKSPACE, REMOVE_WORKSPACE, UPDATE_WORKSPACE, SET_CURRENT_WORKSPACE } from "./workspace.reducer"

export async function loadWorkspaces() {
    try {
        let workspaces = await workspaceService.query()
        if (workspaces.length === 0) {
            // Create a default workspace if none exists
            const defaultWorkspace = await workspaceService.save({ title: 'Sprint 4' })
            workspaces = [defaultWorkspace]
        }
        store.dispatch({ type: SET_WORKSPACES, workspaces })
        if (!store.getState().workspaceModule.currentWorkspace) {
            store.dispatch({ type: SET_CURRENT_WORKSPACE, workspace: workspaces[0] })
        }
    } catch (err) {
        console.log('Cannot load workspaces', err)
        throw err
    }
}

export async function saveWorkspace(workspace) {
    const type = workspace._id ? UPDATE_WORKSPACE : ADD_WORKSPACE
    try {
        const savedWorkspace = await workspaceService.save(workspace)
        store.dispatch({ type, workspace: savedWorkspace })
        return savedWorkspace
    } catch (err) {
        console.log('Cannot save workspace', err)
        throw err
    }
}

export async function removeWorkspace(workspaceId) {
    try {
        await workspaceService.remove(workspaceId)
        store.dispatch({ type: REMOVE_WORKSPACE, workspaceId })
    } catch (err) {
        console.log('Cannot remove workspace', err)
        throw err
    }
}

export function setCurrentWorkspace(workspace) {
    store.dispatch({ type: SET_CURRENT_WORKSPACE, workspace })
}
