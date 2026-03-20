// import { storageService } from './async-storage.service'
import { httpService } from './http.service'
import { socketService } from './socket.service'

const STORAGE_KEY_LOGGEDIN_USER = 'loggedinUser'
const BASE_URL = 'user/'

export const userService = {
    login,
    logout,
    signup,
    getLoggedinUser,
    saveLocalUser,
    getUsers,
    getById,
    remove,
    update,
    invite,
    updateInvitation,
    toggleStarred,
    clearNotifications,
    markNotificationsRead,
    updateLastSeenNotifications
}

window.userService = userService

function getUsers() {
    return httpService.get(BASE_URL)
}

async function toggleStarred(boardId) {
    const user = await httpService.post(BASE_URL + 'toggle-starred', { boardId })
    return saveLocalUser(user)
}

async function getById(userId) {
    return httpService.get(BASE_URL + userId)
}

function remove(userId) {
    return httpService.delete(BASE_URL + userId)
}

async function update({user}) {
    const savedUser = user._id ? await httpService.put(BASE_URL + user._id, user) : await httpService.post(BASE_URL, user)
    if (getLoggedinUser()._id === savedUser._id) saveLocalUser(savedUser)
    return savedUser
}

async function invite(invitedUserId, boardId, boardTitle) {
    return httpService.post(BASE_URL + 'invite', { invitedUserId, boardId, boardTitle })
}

async function updateInvitation(invitationId, status) {
    const user = await httpService.post(BASE_URL + 'invitation', { invitationId, status })
    if (getLoggedinUser()._id === user._id) saveLocalUser(user)
    return user
}

async function clearNotifications() {
    const user = await httpService.post(BASE_URL + 'clear-notifications')
    return saveLocalUser(user)
}

async function markNotificationsRead() {
    const user = await httpService.post(BASE_URL + 'mark-read')
    return saveLocalUser(user)
}

async function updateLastSeenNotifications() {
    const user = await httpService.post(BASE_URL + 'update-last-seen')
    return saveLocalUser(user)
}

async function login(userCred) {
    const user = await httpService.post('auth/login', userCred)
    if (user) {
        socketService.login(user._id)
        return saveLocalUser(user)
    }
}

async function signup(userCred) {
    const user = await httpService.post('auth/signup', userCred)
    socketService.login(user._id)
    return saveLocalUser(user)
}

async function logout() {
    sessionStorage.removeItem(STORAGE_KEY_LOGGEDIN_USER)
    socketService.logout()
    return await httpService.post('auth/logout')
}

function saveLocalUser(user) {
    user = { 
        _id: user._id, 
        username: user.username,
        fullname: user.fullname, 
        imgUrl: user.imgUrl, 
        invitations: user.invitations || [],
        notifications: user.notifications || [],
        starredBoardIds: user.starredBoardIds || [],
        lastSeenNotifications: user.lastSeenNotifications || 0
    }
    sessionStorage.setItem(STORAGE_KEY_LOGGEDIN_USER, JSON.stringify(user))
    return user
}

function getLoggedinUser() {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY_LOGGEDIN_USER))
}




