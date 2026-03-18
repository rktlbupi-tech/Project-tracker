import { workspaceService } from "../services/workspace.service.js"
import { store } from "../store/store.js"
import { SET_WORKSPACES, SET_WORKSPACE, ADD_WORKSPACE, REMOVE_WORKSPACE, UPDATE_WORKSPACE } from "./workspace.reducer.js"

export async function loadWorkspaces(filterBy) {
    try {
        const workspaces = await workspaceService.query(filterBy)
        store.dispatch({ type: SET_WORKSPACES, workspaces })
        return workspaces
    } catch (err) {
        console.log('WorkspaceActions: err in loadWorkspaces', err)
        throw err
    }
}

export async function addWorkspace(workspace) {
    try {
        const savedWorkspace = await workspaceService.save(workspace)
        store.dispatch({ type: ADD_WORKSPACE, workspace: savedWorkspace })
        return savedWorkspace
    } catch (err) {
        console.log('WorkspaceActions: err in addWorkspace', err)
        throw err
    }
}

export async function removeWorkspace(workspaceId) {
    try {
        await workspaceService.remove(workspaceId)
        store.dispatch({ type: REMOVE_WORKSPACE, workspaceId })
    } catch (err) {
        console.log('WorkspaceActions: err in removeWorkspace', err)
        throw err
    }
}

export async function updateWorkspace(workspace) {
    try {
        const savedWorkspace = await workspaceService.save(workspace)
        store.dispatch({ type: UPDATE_WORKSPACE, workspace: savedWorkspace })
    } catch (err) {
        console.log('WorkspaceActions: err in updateWorkspace', err)
        throw err
    }
}

export function setCurrWorkspace(workspaceId) {
    store.dispatch({ type: SET_WORKSPACE, workspaceId })
}
