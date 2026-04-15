const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const logger = require('./logger.service')

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
})

async function getPresignedUrl(fileName, fileType) {
    try {
        const key = `uploads/${Date.now()}_${fileName}`
        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        })

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }) // Valid for 1 hour
        
        return {
            uploadUrl: signedUrl,
            fileUrl: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
        }
    } catch (err) {
        logger.error('Failed to generate S3 presigned URL', err)
        throw err
    }
}

module.exports = {
    getPresignedUrl,
}
