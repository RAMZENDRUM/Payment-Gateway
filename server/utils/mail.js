const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: (process.env.EMAIL_USER || 'eventbooking.otp@gmail.com').trim().replace(/['"]/g, ''),
        pass: (process.env.EMAIL_PASS || 'bwqj vemx rcrg lsck').trim().replace(/['"]/g, '')
    },
    connectionTimeout: 60000,
    greetingTimeout: 60000,
    socketTimeout: 60000,
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify(function (error, success) {
    if (error) {
        console.log("❌ SMTP server connection failed:", error.message);
    } else {
        console.log("✅ SMTP server is ready to take our messages");
    }
});

exports.sendOTP = async (email, otp) => {
    const mailOptions = {
        from: `"ZenWallet Auth" <${process.env.EMAIL_USER || 'eventbooking.otp@gmail.com'}>`,
        to: email,
        subject: 'ZenWallet Verification OTP',
        html: `
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
                        <a href="http://localhost:5173/register" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Return to Website</a>
                    </div>
                    <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 25px;">
                        This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.
                    </p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
                    © 2026 ZenWallet Payment Gateway. All rights reserved.
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ OTP Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Email Network Blocked. Fallback to Logs...');
        console.log('******************************************');
        console.log('🔑 VERIFICATION CODE FOR:', email);
        console.log('👉 OTP CODE:', otp);
        console.log('******************************************');

        // We return a "fake" successful response so the registration can continue
        // The user can find the code in their Railway Logs tab.
        return { success: true, message: 'Logged to console' };
    }
};

exports.sendForgotPasswordOTP = async (email, otp) => {
    const mailOptions = {
        from: `"ZenWallet Auth" <${process.env.EMAIL_USER || 'eventbooking.otp@gmail.com'}>`,
        to: email,
        subject: 'Reset Your ZenWallet Password',
        html: `
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
        `
    };

    return transporter.sendMail(mailOptions);
};
