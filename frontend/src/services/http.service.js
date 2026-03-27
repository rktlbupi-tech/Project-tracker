import Axios from 'axios'
import { loggerService } from './logger.service'

const BASE_URL = process.env.REACT_APP_BASE_URL || (process.env.NODE_ENV === 'production'
    ? '/api/'
    : '//localhost:3031/api/')


const axios = Axios.create({
    withCredentials: true,
    headers: {
        'ngrok-skip-browser-warning': '69420'
    }
})

// Request Interceptor
axios.interceptors.request.use(
    (config) => {
        loggerService.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data || "")
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
axios.interceptors.response.use(
    (response) => {
        loggerService.info(`API Response: ${response.status} ${response.config.url}`, response.data)
        return response;
    },
    (error) => {
        const status = error.response?.status || "Network Error"
        const url = error.config?.url || "Unknown URL"
        
        loggerService.error(`API Error: ${status} ${url}`, error.response?.data || error.message)

        if (error.response && error.response.status === 401) {
            sessionStorage.clear()
        }
        if (error.response && error.response.status === 500) {
            window.location.assign('/')
        }
        return Promise.reject(error);
    }
);

export const httpService = {
    get (endpoint, data) {
        return ajax(endpoint, 'GET', data)
    },
    post (endpoint, data) {
        return ajax(endpoint, 'POST', data)
    },
    put (endpoint, data) {
        return ajax(endpoint, 'PUT', data)
    },
    delete (endpoint, data) {
        return ajax(endpoint, 'DELETE', data)
    }
}

async function ajax (endpoint, method = 'GET', data = null) {
    try {
        const res = await axios({
            url: `${BASE_URL}${endpoint}`,
            method,
            data,
            params: (method === 'GET') ? data : null
        })
        return res.data
    } catch (err) {
        throw err
    }
}