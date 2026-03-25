const nodemailer = require('nodemailer')
const logger = require('./logger.service')

// Create a transporter object using the default SMTP transport
// To use Gmail, you need to use an App Password if 2FA is enabled.
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS instead of SSL port 465
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    },
    tls: {
       // Do not fail on invalid certs
       rejectUnauthorized: false
    }
})


/**
 * Sends an invitation email to a user.
 * 
 * @param {string} toEmail - The recipient's email address.
 * @param {object} fromUser - The user sending the invite (should have fullname).
 * @param {string} targetTitle - The title of the board or workspace they are invited to.
 * @param {string} inviteLink - The generated link to accept the invitation.
 */
async function sendInviteEmail(toEmail, fromUser, targetTitle, inviteLink) {
    try {
        const mailOptions = {
            from: `"${fromUser.fullname} (via Workio)" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            replyTo: fromUser.username, // User A's email (stored in username)
            subject: `${fromUser.fullname} has invited you to join them on Workio!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e4e8; border-radius: 8px; overflow: hidden; color: #333;">
                    <div style="background-color: #0073ea; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px;">Workspace Invitation</h1>
                    </div>
                    <div style="padding: 30px;">
                        <p style="font-size: 16px;"><strong>${fromUser.fullname}</strong> (${fromUser.username}) has invited you to collaborate on <strong>${targetTitle}</strong>.</p>
                        <p style="font-size: 16px;">Workio helps teams organize tasks, track projects, and achieve more together.</p>
                        <div style="margin: 35px 0; text-align: center;">
                            <a href="${inviteLink}" style="background-color: #0073ea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">
                                Accept Invitation
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px; line-height: 1.5;">If you don't have a Workio account yet, you'll be guided through a quick signup process before joining.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center;">This email was sent on behalf of ${fromUser.fullname}. If you weren't expecting this invite, you can safely ignore this email.</p>
                    </div>
                </div>
            `
        }

        console.log(`\n\n=== INVITATION LINK ===\n${inviteLink}\n=======================\n\n`)

        // If credentials are provided, try sending. Otherwise, just mock it.
        if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com') {
            try {
                const info = await transporter.sendMail(mailOptions)
                logger.info(`Message sent: ${info.messageId}`)
                return info
            } catch (mailErr) {
                logger.error('Failed to send actual email, falling back to mock logs', mailErr)
                logger.info(`=== INVITATION LINK (EMAIL FAILED) ===\n${inviteLink}\n===================================`)
                return { messageId: 'mock-id-fallback' }
            }
        } else {
            logger.info(`Mock email sent to ${toEmail}. Check terminal for link.`)
            return { messageId: 'mock-id' }
        }


    } catch (err) {
        logger.error('Failed to send invite email', err)
        throw err
    }
}

module.exports = {
    sendInviteEmail
}
