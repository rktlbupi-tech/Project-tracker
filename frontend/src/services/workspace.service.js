import { storageService } from './async-storage.service'
import { httpService } from './http.service'

const STORAGE_KEY = 'workspace'
const BASE_URL = 'workspace/'

export const workspaceService = {
    query,
    getById,
    save,
    remove,
    getEmptyWorkspace,
    getDefaultFilterWorkspaces
}

async function query(filterBy = {}) {
    return httpService.get(BASE_URL, filterBy)
}

function getById(workspaceId) {
    return httpService.get(BASE_URL + workspaceId)
}

async function remove(workspaceId) {
    return httpService.delete(BASE_URL + workspaceId)
}

async function save(workspace) {
    if (workspace._id) {
        return httpService.put(BASE_URL + workspace._id, workspace)
    } else {
        return httpService.post(BASE_URL, workspace)
    }
}

function getEmptyWorkspace() {
    return {
        title: '',
        description: '',
        color: '#735dd1', // Default purple
        members: [],
        boardIds: []
    }
}

function getDefaultFilterWorkspaces() {
    return {
        title: '',
        userId: ''
    }
}
