import React from 'react'
import { Routes, Route } from 'react-router'
import { Provider } from 'react-redux'
import { BoardDetails } from './pages/board-details'
import  HomePage from './pages/home-page'
import { LoginSignup } from './pages/login-signup'
import { BoardInvite } from './pages/board-invite'
import { store } from './store/store'

export function RootCmp () {
    return (
        <Provider store={store}>
            <div>
                <main>
                    <Routes>
                        <Route element={<HomePage />} path='/' />
                        <Route element={<BoardDetails />} path='/board/' />
                        <Route element={<BoardDetails />} path='/board/:boardId/' />
                        <Route element={<BoardDetails />} path='/board/:boardId/:groupId/:taskId' />
                        <Route element={<BoardDetails />} path='/board/:boardId/:activityLog' />
                        <Route element={<LoginSignup />} path='/auth/login' />
                        <Route element={<LoginSignup />} path='/auth/signup' />
                        <Route element={<BoardInvite />} path='/invite' />
                    </Routes>
                </main>
            </div>
        </Provider>
    )
}
