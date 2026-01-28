const axios = require('axios');

/**
 * Sends an email using Brevo's HTTP API.
 * This is more reliable than SMTP on cloud platforms like Railway
 * because it uses standard HTTPS (port 443).
 */
const sendBrevoEmail = async (toEmail, subject, htmlContent) => {
    const apiKey = (process.env.EMAIL_PASS || 'bskI3S7veUfefE7').trim();
    // Use the verified sender from Brevo. If not set, use a fallback.
    const senderEmail = (process.env.EMAIL_USER || 'a105fc001@smtp-brevo.com').trim();

    try {
        const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
            sender: { name: "ZenWallet Auth", email: senderEmail },
            to: [{ email: toEmail }],
            subject: subject,
            htmlContent: htmlContent
        }, {
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Email sent via Brevo API:', response.data.messageId);
        return response.data;
    } catch (error) {
        console.error('❌ Brevo API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to send email via API');
    }
};

exports.sendOTP = async (email, otp) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: #4f46e5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">ZenWallet</h1>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e5e5;">
                <h2 style="color: #111827; margin-top: 0;">Verify Your Account</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 24px;">
                    Thank you for joining ZenWallet. Please use the following One-Time Password (OTP) to complete your registration:
                </p>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4f46e5;">${otp}</span>
                </div>
                <p style="color: #4b5563; font-size: 14px; text-align: center; margin-bottom: 20px;">
                    Copy the code above and paste it on the website to verify your account.
                </p>
                <div style="text-align: center;">
                    <p style="color: #9ca3af; font-size: 12px;">Verification Status: Pending</p>
                </div>
                <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 25px;">
                    This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.
                </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
                © 2026 ZenWallet Payment Gateway. All rights reserved.
            </div>
        </div>
    `;

    return sendBrevoEmail(email, 'ZenWallet Verification OTP', html);
};

exports.sendForgotPasswordOTP = async (email, otp) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: #4f46e5; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">ZenWallet</h1>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e5e5;">
                <h2 style="color: #111827; margin-top: 0;">Password Reset Request</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 24px;">
                    We received a request to reset your ZenWallet password. Use the following OTP to proceed:
                </p>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4f46e5;">${otp}</span>
                </div>
                <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                    This OTP is valid for 10 minutes. If you didn't request this, your account is safe.
                </p>
            </div>
        </div>
    `;

    return sendBrevoEmail(email, 'Reset Your ZenWallet Password', html);
};
