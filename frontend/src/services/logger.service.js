const isProduction = process.env.NODE_ENV === 'production'

export const loggerService = {
    debug(...args) {
        if (isProduction) return
        doLog('DEBUG', '#868E96', ...args)
    },
    info(...args) {
        if (isProduction) return
        doLog('INFO', '#6CC51D', ...args)
    },
    warn(...args) {
        if (isProduction) return
        doLog('WARN', '#FFD43B', ...args)
    },
    error(...args) {
        if (isProduction) return
        doLog('ERROR', '#FA5252', ...args)
    }
}

function doLog(level, color, ...args) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false })
    
    // Check if the last argument is an object/error to log it separately for better inspection
    let data = null
    let logs = [...args]
    if (logs.length > 1 && typeof logs[logs.length - 1] === 'object') {
        data = logs.pop()
    }

    console.log(
        `%c[${time}] %c${level.padEnd(5)} %c| ${logs.join(' | ')}`,
        'color: #868E96;', 
        `color: ${color}; font-weight: bold;`,
        'color: inherit;',
        data || ''
    )
}
