export const SET_WORKSPACES = 'SET_WORKSPACES'
export const ADD_WORKSPACE = 'ADD_WORKSPACE'
export const REMOVE_WORKSPACE = 'REMOVE_WORKSPACE'
export const UPDATE_WORKSPACE = 'UPDATE_WORKSPACE'
export const SET_CURRENT_WORKSPACE = 'SET_CURRENT_WORKSPACE'

const initialState = {
    workspaces: [],
    currentWorkspace: null
}

export function workspaceReducer(state = initialState, action) {
    switch (action.type) {
        case SET_WORKSPACES:
            return { ...state, workspaces: action.workspaces }
        case SET_CURRENT_WORKSPACE:
            return { ...state, currentWorkspace: action.workspace }
        case ADD_WORKSPACE:
            return { ...state, workspaces: [...state.workspaces, action.workspace] }
        case REMOVE_WORKSPACE:
            return { ...state, workspaces: state.workspaces.filter(ws => ws._id !== action.workspaceId) }
        case UPDATE_WORKSPACE:
            return {
                ...state,
                workspaces: state.workspaces.map(ws => ws._id === action.workspace._id ? action.workspace : ws)
            }
        default:
            return state
    }
}
