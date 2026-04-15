const s3Service = require('../../services/s3.service')
const logger = require('../../services/logger.service')

async function get_presigned_url(req, res) {
    try {
        const { fileName, fileType } = req.query
        if (!fileName || !fileType) {
            return res.status(400).send({ error: 'fileName and fileType are required' })
        }
        
        const data = await s3Service.getPresignedUrl(fileName, fileType)
        res.send(data)
    } catch (err) {
        logger.error('Failed to get presigned URL', err)
        res.status(500).send({ error: 'Failed to get presigned URL' })
    }
}

module.exports = {
    get_presigned_url
}
