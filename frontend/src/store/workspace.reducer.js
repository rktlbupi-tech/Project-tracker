export const SET_WORKSPACES = 'SET_WORKSPACES'
export const SET_WORKSPACE = 'SET_WORKSPACE'
export const ADD_WORKSPACE = 'ADD_WORKSPACE'
export const REMOVE_WORKSPACE = 'REMOVE_WORKSPACE'
export const UPDATE_WORKSPACE = 'UPDATE_WORKSPACE'

const initialState = {
    workspaces: [],
    currWorkspaceId: null
}

export function workspaceReducer(state = initialState, action) {
    var workspaces
    switch (action.type) {
        case SET_WORKSPACES:
            return { ...state, workspaces: action.workspaces }
        case SET_WORKSPACE:
            return { ...state, currWorkspaceId: action.workspaceId }
        case ADD_WORKSPACE:
            workspaces = [...state.workspaces, action.workspace]
            return { ...state, workspaces }
        case REMOVE_WORKSPACE:
            workspaces = state.workspaces.filter(ws => ws._id !== action.workspaceId)
            return { ...state, workspaces }
        case UPDATE_WORKSPACE:
            workspaces = state.workspaces.map(ws => (ws._id === action.workspace._id) ? action.workspace : ws)
            return { ...state, workspaces }
        default:
            return state
    }
}
