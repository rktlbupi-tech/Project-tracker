import { httpService } from './http.service'

const BASE_URL = 'workspace/'

export const workspaceService = {
    query,
    getById,
    save,
    remove,
    getEmptyWorkspace
}

async function query() {
    return httpService.get(BASE_URL)
}

async function getById(workspaceId) {
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
        boards: []
    }
}
