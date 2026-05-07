const { subscribeToQueue } = require('./broker');
const sentEmail = require('../email');

module.exports = function (){

    subscribeToQueue('AUTH_NOTIFICATION.USER_CREATED', async (data) => {
        const emailHTMLTemplate = `
            <h1>Welcome to our platform, ${data.fullName.firstName + " " + (data.fullName.lastName || "")}!</h1>
            <p>Thank you for registering with us. We're excited to have you on board.</p>
            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
            <p>Best regards,<br/>The SuperNova Team</p>
        `;
        await sentEmail(data.email, 'Welcome to Our Platform', 'Thank you for registering with us!', emailHTMLTemplate);
    });
}