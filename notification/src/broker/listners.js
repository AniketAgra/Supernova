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

    subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_INITIATED", async (data) => {
        const emailHTMLTemplate = `
            <h1>Payment Initiated</h1>
            <p>Dear ${data.username},</p>
            <p>We have received your payment for order ${data.orderId}.</p>
            <p>Payment Details:</p>
            <ul>
                <li>Amount: ${data.amount} ${data.currency}</li>
            </ul>
            <p>Thank you for your purchase! If you have any questions, please contact our support team.</p>
            <p>Best regards,<br/>The SuperNova Team</p>
        `;
        await sentEmail(data.email, 'Payment Initiated', 'Your payment has been initiated!', emailHTMLTemplate);
    });

    subscribeToQueue('PAYMENT_NOTIFICATION.PAYMENT_COMPLETED', async (data) => {
        const emailHTMLTemplate = `
            <h1>Payment Successful!</h1>
            <p>Dear ${data.username},</p>
            <p>We are pleased to inform you that your payment for order ${data.orderId} has been successfully processed.</p>
            <p>Payment Details:</p>
            <ul>
                <li>Payment ID: ${data.paymentId}</li>
                <li>Amount: ${data.amount} ${data.currency}</li>
            </ul>
            <p>Thank you for your purchase! If you have any questions, please contact our support team.</p>
            <p>Best regards,<br/>The SuperNova Team</p>
        `;
        await sentEmail(data.email, 'Payment Successful', 'Your payment has been processed successfully!', emailHTMLTemplate);
    });

    subscribeToQueue('PAYMENT_NOTIFICATION.PAYMENT_FAILED', async (data) => {
        const emailHTMLTemplate = `
            <h1>Payment Failed</h1>
            <p>Dear ${data.username},</p>
            <p>We are sorry to inform you that your payment for order ${data.orderId} has failed.</p>
            <p>Please try again or contact our support team for assistance.</p>
            <p>Best regards,<br/>The SuperNova Team</p>
        `;
        await sentEmail(data.email, 'Payment Failed', 'Your payment has failed.', emailHTMLTemplate);
    });

    subscribeToQueue('PRODUCT_NOTIFICATION.PRODUCT_CREATED', async (data) => {
        const emailHTMLTemplate = `
            <h1>New Product Available!</h1>
            <p>Dear ${data.username},</p>
            <p>Your product with ID ${data.productId} has been created successfully.</p>
            <p>Thank you for listing your product with us! If you have any questions, please contact our support team.</p>
            <p>Best regards,<br/>The SuperNova Team</p>
        `;
        await sentEmail(data.email, 'Product Created', 'Your product has been created successfully!', emailHTMLTemplate);
    });
}