import { httpService } from './http.service'

const BASE_URL = 'invite/'

export const inviteService = {
    create,
    getByToken,
    accept
}

async function create(inviteData) {
    // inviteData: { email, workspaceId, boardId, role }
    return httpService.post(BASE_URL, inviteData)
}

async function getByToken(token) {
    return httpService.get(BASE_URL + token)
}

async function accept(token) {
    return httpService.post(`${BASE_URL}${token}/accept`)
}
