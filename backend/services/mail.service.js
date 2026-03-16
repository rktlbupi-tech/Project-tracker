const nodemailer = require('nodemailer')
const logger = require('./logger.service')

// Create a transporter object using the default SMTP transport
// To use Gmail, you need to use an App Password if 2FA is enabled.
const transporter = nodemailer.createTransport({
    service: 'gmail', // or 'smtp.gmail.com'
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
})

/**
 * Sends an invitation email to a user.
 * 
 * @param {string} toEmail - The recipient's email address.
 * @param {object} fromUser - The user sending the invite (should have fullname).
 * @param {string} boardTitle - The title of the board they are invited to.
 * @param {string} inviteLink - The generated link to accept the invitation.
 */
async function sendBoardInviteEmail(toEmail, fromUser, boardTitle, inviteLink) {
    try {
        const mailOptions = {
            from: `"${fromUser.fullname} (via MyDay)" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            replyTo: fromUser.username, // User A's email (stored in username)
            subject: `${fromUser.fullname} has invited you to a board on MyDay!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2>You've been invited!</h2>
                    <p><strong>${fromUser.fullname}</strong> (${fromUser.username}) has invited you to collaborate on the board: <strong>${boardTitle}</strong></p>
                    <p>Click the button below to accept the invitation and join the board.</p>
                    <div style="margin: 30px 0;">
                        <a href="${inviteLink}" style="background-color: #0073ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                            Accept Invitation
                        </a>
                    </div>
                    <p style="color: #777; font-size: 14px;">If you don't have an account, you'll be prompted to sign up first.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">This email was sent via MyDay on behalf of ${fromUser.fullname}.</p>
                </div>
            `
        }

        console.log(`\n\n=== INVITATION LINK ===\n${inviteLink}\n=======================\n\n`)

        // If credentials are provided, try sending. Otherwise, just mock it.
        if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-email@gmail.com') {
            const info = await transporter.sendMail(mailOptions)
            logger.info(`Message sent: ${info.messageId}`)
            return info
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
    sendBoardInviteEmail
}
