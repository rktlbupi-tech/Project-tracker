import React from 'react'
import { Routes, Route } from 'react-router'
import { Provider } from 'react-redux'
import { BoardDetails } from './pages/board-details'
import  HomePage from './pages/home-page'
import { LoginSignup } from './pages/login-signup'
import { InvitePage } from './pages/invite-page'
import { store } from './store/store'
import { RequireAuth } from './cmps/require-auth'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export function RootCmp () {
    return (
        <Provider store={store}>
            <div>
                <main>
                    <Routes>
                        <Route element={<HomePage />} path='/' />
                        <Route element={<RequireAuth><BoardDetails /></RequireAuth>} path='/board/' />
                        <Route element={<RequireAuth><BoardDetails /></RequireAuth>} path='/board/:boardId/' />
                        <Route element={<RequireAuth><BoardDetails /></RequireAuth>} path='/board/:boardId/:groupId/:taskId' />
                        <Route element={<RequireAuth><BoardDetails /></RequireAuth>} path='/board/:boardId/:activityLog' />
                        <Route element={<LoginSignup />} path='/auth/login' />
                        <Route element={<LoginSignup />} path='/auth/signup' />
                        <Route element={<InvitePage />} path='/invite/:token' />
                    </Routes>
                </main>
                <ToastContainer 
                    position="bottom-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="colored"
                />
            </div>
        </Provider>
    )
}
