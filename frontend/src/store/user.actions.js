import { userService } from "../services/user.service.js"
import { store } from '../store/store.js'

// import { showErrorMsg } from '../services/event-bus.service.js'
import { LOADING_DONE, LOADING_START } from "./system.reducer.js";
import { REMOVE_USER, SET_USER, SET_USERS, SET_WATCHED_USER } from "./user.reducer.js";
import { loggerService } from "../services/logger.service.js";

export async function loadUsers() {
    try {
        store.dispatch({ type: LOADING_START })
        const users = await userService.getUsers()
        store.dispatch({ type: SET_USERS, users })
    } catch (err) {
        loggerService.error('UserActions: err in loadUsers', err)
    } finally {
        store.dispatch({ type: LOADING_DONE })
    }
}

// TODO:REMOVE THIS
export async function removeUser(userId) {
    try {
        await userService.remove(userId)
        store.dispatch({ type: REMOVE_USER, userId })
    } catch (err) {
        loggerService.error('UserActions: err in removeUser', err)
    }
}

export async function login(credentials) {
    try {
        const user = await userService.login(credentials)
        store.dispatch({
            type: SET_USER,
            user
        })
        return user
    } catch (err) {
        loggerService.error('Cannot login', err)
        throw err
    }
}

export async function signup(credentials) {
    loggerService.debug('Signup data:', credentials)
    try {
        const user = await userService.signup(credentials)
        store.dispatch({
            type: SET_USER,
            user
        })
        return user
    } catch (err) {
        loggerService.error('Cannot signup', err)
        throw err
    }
}

export async function logout() {
    try {
        await userService.logout()
        store.dispatch({
            type: SET_USER,
            user: null
        })
    } catch (err) {
        loggerService.error('Cannot logout', err)
        throw err
    }
}

export async function loadUser(userId) {
    try {
        const user = await userService.getById(userId);
        store.dispatch({ type: SET_WATCHED_USER, user })
    } catch (err) {
        // showErrorMsg('Cannot load user')
        loggerService.error('Cannot load user', err)
    }
}

export async function inviteUser(invitedUserId, boardId, boardTitle) {
    try {
        await userService.invite(invitedUserId, boardId, boardTitle)
    } catch (err) {
        loggerService.error('Cannot invite user', err)
        throw err
    }
}

export async function respondToInvitation(invitationId, status) {
    try {
        const user = await userService.updateInvitation(invitationId, status)
        store.dispatch({ type: SET_USER, user })
        return user
    } catch (err) {
        loggerService.error('Cannot respond to invitation', err)
        throw err
    }
}

export function setUser(user) {
    store.dispatch({ type: SET_USER, user })
}