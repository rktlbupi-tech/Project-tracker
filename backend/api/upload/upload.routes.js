const express = require('express')
const { get_presigned_url } = require('./upload.controller')
const router = express.Router()

router.get('/sign', get_presigned_url)

module.exports = router
