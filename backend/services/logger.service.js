const fs = require('fs')
const asyncLocalStorage = require('./als.service')
const utilService = require('./util.service')


const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL
const logsDir = './logs'

if (!isProduction && !fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir)
}

//define the time format
function getTime() {
    let now = new Date()
    return now.toLocaleString('he')
}

function isError(e) {
    return e && e.stack && e.message
}

function doLog(level, ...args) {
    const strs = args.map(arg =>
        (typeof arg === 'string' || isError(arg)) ? arg : JSON.stringify(arg)
    )

    var line = strs.join(' | ')
    const store = asyncLocalStorage.getStore()
    const userId = store?.loggedinUser?._id
    const str = userId ? `(userId: ${userId})` : ''
    line = `${getTime()} - ${level} - ${line} ${str}`

    if (!isProduction) {
        const colors = {
            DEBUG: '\x1b[36m', // Cyan
            INFO: '\x1b[32m',  // Green
            WARN: '\x1b[33m',  // Yellow
            ERROR: '\x1b[31m', // Red
            RESET: '\x1b[0m'
        }
        const color = colors[level] || colors.RESET
        console.log(`${color}${line}${colors.RESET}`)

        fs.appendFile('./logs/backend.log', line + '\n', (err) => {
            if (err) console.log('FATAL: cannot write to log file')
        })
    } else {
        console.log(line)
    }
}

module.exports = {
    debug(...args) {
        if (process.env.NODE_ENV === 'production') return
        doLog('DEBUG', ...args)
    },
    info(...args) {
        doLog('INFO', ...args)
    },
    warn(...args) {
        doLog('WARN', ...args)
    },
    error(...args) {
        doLog('ERROR', ...args)
    }
}