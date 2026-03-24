import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { Provider } from 'react-redux'
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { store } from './store/store'
import { RootCmp } from './root-cmp'
import './assets/styles/main.scss'
import { GoogleOAuthProvider } from '@react-oauth/google';

// Global Error Listener
window.onerror = (message, source, lineno, colno, error) => {
  console.log(
    `❌ %c[General Error] %c${message}`,
    "color: #FA5252; font-weight: bold;",
    "color: #1B2D1F;",
    { source, lineno, colno, error }
  );
};

window.onunhandledrejection = (event) => {
  console.log(
    `❌ %c[Unhandled Promise Rejection] %c${event.reason}`,
    "color: #FA5252; font-weight: bold;",
    "color: #1B2D1F;",
    event
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
    <Provider store={store}>
      <Router>
        <RootCmp />
      </Router>
    </Provider>
  </GoogleOAuthProvider>
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();