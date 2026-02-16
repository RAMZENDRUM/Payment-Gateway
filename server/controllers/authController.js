const db = require('../utils/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-wallet-key-2026';

const mailUtils = require('../utils/mail');

// Helper to generate a random 16-digit card number (Luhn algorithm not strictly enforced for demo)
// Helper to generate a unique 8-digit UPI ID
function generateUpiId() {
    const digits = Math.floor(10000000 + Math.random() * 90000000).toString();
    return `${digits}@zenwallet`;
}

// Helper to generate a random 16-digit card number in the format 0605 xxxx xxxx 2212
function generateCardNumber() {
    let middle = '';
    for (let i = 0; i < 8; i++) {
        middle += Math.floor(Math.random() * 10);
    }
    return `0605${middle}2212`;
}

async function ensureVirtualCard(client, userId) {
    // Check if card exists
    const res = await client.query('SELECT * FROM public.virtual_cards WHERE user_id = $1', [userId]);
    if (res.rows.length > 0) {
        return res.rows[0];
    }

    // Create new card
    const cardNumber = generateCardNumber();
    const cvv = Math.floor(100 + Math.random() * 900).toString(); // 3 digits
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 5); // 5 years validity
    const expiryMonth = (expiryDate.getMonth() + 1).toString().padStart(2, '0');
    const expiryYear = expiryDate.getFullYear().toString();

    const newCard = await client.query(
        `INSERT INTO public.virtual_cards (user_id, card_number, cvv, expiry_month, expiry_year)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, cardNumber, cvv, expiryMonth, expiryYear]
    );
    return newCard.rows[0];
}

exports.register = async (req, res) => {
    const { email, password, fullName, phoneNumber, purpose } = req.body;

    try {
        // 1. Check if user exists
        const existingUser = await db.query('SELECT * FROM public.users WHERE email = $1', [email]);

        if (existingUser.rows.length > 0) {
            if (existingUser.rows[0].is_verified) {
                return res.status(400).json({ message: 'A verified account with this email already exists' });
            } else {
                // Remove old unverified user and related data manually to prevent FK violations
                const userId = existingUser.rows[0].id;

                // Correct deletion order to respect FK constraints
                await db.query('DELETE FROM public.otp_verifications WHERE email = $1', [email]);
                await db.query('DELETE FROM public.virtual_cards WHERE user_id = $1', [userId]);
                await db.query('DELETE FROM public.wallets WHERE user_id = $1', [userId]);
                await db.query('DELETE FROM public.transactions WHERE sender_id = $1 OR receiver_id = $1', [userId]);
                await db.query('DELETE FROM public.payment_requests WHERE receiver_id = $1', [userId]);

                // Cleanup Gateway tables (Apps -> Payments -> Logs)
                await db.query('DELETE FROM public.webhook_logs WHERE payment_id IN (SELECT payment_id FROM public.external_payments WHERE app_id IN (SELECT id FROM public.apps WHERE user_id = $1))', [userId]);
                await db.query('DELETE FROM public.external_payments WHERE app_id IN (SELECT id FROM public.apps WHERE user_id = $1)', [userId]);
                await db.query('DELETE FROM public.apps WHERE user_id = $1', [userId]);

                await db.query('DELETE FROM public.users WHERE email = $1', [email]);
                console.log(`Successfully cleaned up unverified user: ${email}`);
            }
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60000); // 10 minutes

        // 4. Save to pending_users (Upsert: if already pending, update with new details and OTP)
        await db.query(
            `INSERT INTO public.pending_users (email, password, full_name, phone_number, purpose, otp_code, otp_expiry)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (email) DO UPDATE SET
                password = EXCLUDED.password,
                full_name = EXCLUDED.full_name,
                phone_number = EXCLUDED.phone_number,
                purpose = EXCLUDED.purpose,
                otp_code = EXCLUDED.otp_code,
                otp_expiry = EXCLUDED.otp_expiry,
                created_at = CURRENT_TIMESTAMP`,
            [email, hashedPassword, fullName, phoneNumber, purpose, otpCode, otpExpiry]
        );

        // 5. Send OTP via email
        // We await this now to verify credentials work before confirming to user
        try {
            await mailUtils.sendOTP(email, otpCode);
        } catch (error) {
            console.error("OTP Email Failed:", error);
            return res.status(500).json({ message: "Failed to send OTP. System email credentials may be invalid." });
        }

        res.status(201).json({
            message: 'OTP sent! Please check your email to verify your account.',
            email: email
        });
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).json({
            message: 'Server error during registration',
            error: err.message
        });
    }
};

exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    const { client, query, release } = await db.getTransaction();

    try {
        await client.query('BEGIN');

        // 1. Find the pending registration
        const pendingResult = await client.query(
            'SELECT * FROM public.pending_users WHERE email = $1 AND otp_code = $2 AND otp_expiry > NOW()',
            [email, otp]
        );

        if (pendingResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const pendingUser = pendingResult.rows[0];

        // 2. Upsert into main users table (Move from pending)
        const upiId = generateUpiId();
        const newUserResult = await client.query(
            `INSERT INTO users (email, password, full_name, phone_number, purpose, upi_id, is_verified) 
             VALUES ($1, $2, $3, $4, $5, $6, TRUE)
             ON CONFLICT (email) DO UPDATE SET
                password = EXCLUDED.password,
                full_name = EXCLUDED.full_name,
                phone_number = EXCLUDED.phone_number,
                purpose = EXCLUDED.purpose,
                upi_id = COALESCE(users.upi_id, EXCLUDED.upi_id),
                is_verified = TRUE
             RETURNING id, email, upi_id`,
            [pendingUser.email, pendingUser.password, pendingUser.full_name, pendingUser.phone_number, pendingUser.purpose, upiId]
        );

        const userId = newUserResult.rows[0].id;

        // 3. Ensure wallet exists (Upsert: if wallet exists, do nothing, otherwise create with 100)
        await client.query(
            'INSERT INTO wallets (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
            [userId, 100]
        );

        // 4. Generate Virtual Card
        await ensureVirtualCard(client, userId);

        // 5. Delete from pending_users
        await client.query('DELETE FROM public.pending_users WHERE email = $1', [email]);

        await client.query('COMMIT');

        res.json({ message: 'Account verified successfully! You can now login.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Verification Error Details:', err);
        res.status(500).json({ message: 'Server error during verification' });
    } finally {
        release();
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Optimization: Fetch user AND their virtual card in one round-trip
        const userQuery = `
            SELECT u.*, 
                   vc.card_number, vc.cvv, vc.expiry_month, vc.expiry_year 
            FROM public.users u 
            LEFT JOIN public.virtual_cards vc ON u.id::text = vc.user_id::text 
            WHERE u.email = $1
        `;
        const userResult = await db.query(userQuery, [email]);

        if (userResult.rows.length === 0) {
            console.warn(`Login failed: User not found for email ${email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        if (!user.is_verified) {
            console.warn(`Login failed: User ${email} not verified`);
            return res.status(403).json({
                message: 'Account not verified. Please verify your OTP first.',
                email: email,
                needsVerification: true
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.warn(`Login failed: Invalid password for user ${email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // --- Data Integrity Checks (Fix for missing ID/Wallet) ---

        // 1. Ensure UPI ID exists
        if (!user.upi_id) {
            const newUpiId = generateUpiId();
            await db.query('UPDATE public.users SET upi_id = $1 WHERE id = $2', [newUpiId, user.id]);
            user.upi_id = newUpiId;
        }

        // 2. Ensure Wallet exists (prevent getMe 404s)
        await db.query(
            'INSERT INTO public.wallets (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
            [user.id, 0] // Default balance 0 if created now
        );

        // 3. Ensure Virtual Card exists
        let virtualCardData;
        if (user.card_number) {
            virtualCardData = {
                cardNumber: user.card_number,
                cvv: user.cvv,
                expiryMonth: user.expiry_month,
                expiryYear: user.expiry_year
            };
        } else {
            // FIX: Ensure ID is passed correctly to ensureVirtualCard
            const newCard = await ensureVirtualCard(db, user.id);
            virtualCardData = {
                cardNumber: newCard.card_number,
                cvv: newCard.cvv,
                expiryMonth: newCard.expiry_month,
                expiryYear: newCard.expiry_year
            };
        }

        const token = jwt.sign({ id: user.id, email }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                upi_id: user.upi_id,
                hasPaymentPin: !!user.payment_pin,
                virtualCard: virtualCardData
            }
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
};


exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await db.query('SELECT * FROM public.users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60000);

        await db.query(
            'UPDATE public.users SET otp_code = $1, otp_expiry = $2 WHERE email = $3',
            [otpCode, otpExpiry, email]
        );

        await mailUtils.sendForgotPasswordOTP(email, otpCode);

        res.json({ message: 'Reset OTP sent to your email.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const user = await db.query(
            'SELECT * FROM public.users WHERE email = $1 AND otp_code = $2 AND otp_expiry > NOW()',
            [email, otp]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.query(
            'UPDATE public.users SET password = $1, otp_code = NULL, otp_expiry = NULL WHERE email = $2',
            [hashedPassword, email]
        );

        res.json({ message: 'Password reset successfully. You can now login.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.verifyPassword = async (req, res) => {
    const { password } = req.body;
    try {
        const user = await db.query('SELECT password FROM public.users WHERE id = $1', [req.user.id]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        res.json({ verified: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMe = async (req, res) => {
    console.log(`[getMe] Requested by: ${req.user.id}`);
    try {
        const userId = req.user.id;
        const email = req.user.email;

        // Use JOIN to get everything in one go: user, wallet balance, and virtual card
        const query = `
            SELECT 
                u.id, u.email, u.full_name, u.upi_id, u.age, u.payment_pin,
                COALESCE(w.balance, 0) as balance,
                vc.card_number, vc.cvv, vc.expiry_month, vc.expiry_year
            FROM public.users u 
            LEFT JOIN public.wallets w ON u.id::text = w.user_id::text
            LEFT JOIN public.virtual_cards vc ON u.id::text = vc.user_id::text
            WHERE u.id::text = $1 OR u.email = $2
        `;
        let result = await db.query(query, [userId, email]);

        // --- Auto-Provisioning Logic (If user is missing but has valid token) ---
        if (result.rows.length === 0) {
            console.log(`[Provisioning] User ${email} not found in public.users. Provisioning now...`);

            // 1. Create User
            const upiId = Math.floor(10000000 + Math.random() * 90000000).toString() + '@zenwallet';
            const newUser = await db.query(
                "INSERT INTO public.users (id, email, full_name, upi_id, is_verified, role) VALUES ($1, $2, $3, $4, TRUE, 'user') RETURNING id",
                [userId, email, email.split('@')[0], upiId]
            );

            // 2. Create Wallet
            await db.query("INSERT INTO public.wallets (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING", [userId, 100]);

            // 3. Create Virtual Card
            await ensureVirtualCard(db, userId);

            // Fetch again
            result = await db.query(query, [userId, email]);
        }

        let userData = result.rows[0];

        // Self-healing: Ensure UPI ID exists
        if (!userData.upi_id) {
            const newUpiId = generateUpiId();
            await db.query('UPDATE public.users SET upi_id = $1 WHERE id::text = $2', [newUpiId, userData.id]);
            userData.upi_id = newUpiId;
        }

        // Self-healing: If virtual card was missing
        if (!userData.card_number) {
            const card = await ensureVirtualCard(db, userData.id);
            userData.card_number = card.card_number;
            userData.cvv = card.cvv;
            userData.expiry_month = card.expiry_month;
            userData.expiry_year = card.expiry_year;
        }

        res.json({
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            age: userData.age,
            upi_id: userData.upi_id,
            balance: userData.balance,
            hasPaymentPin: !!userData.payment_pin,
            virtualCard: {
                cardNumber: userData.card_number,
                cvv: userData.cvv,
                expiryMonth: userData.expiry_month,
                expiryYear: userData.expiry_year
            }
        });
    } catch (err) {
        console.error('❌ [getMe] Error details:', {
            message: err.message,
            code: err.code,
            detail: err.detail,
            hint: err.hint,
            userId: req.user.id,
            email: req.user.email
        });
        res.status(500).json({ message: 'Server error while fetching user data' });
    }
};

// Update Profile (Name, Age, Email)
exports.updateProfile = async (req, res) => {
    const { fullName, age, newEmail, currentPassword } = req.body;
    const userId = req.user.id;

    try {
        // 1. Get current user
        const userResult = await db.query('SELECT * FROM public.users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResult.rows[0];

        // 2. If changing email, verify password first
        if (newEmail && newEmail !== user.email) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Password required to change email' });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Incorrect password' });
            }

            // Check if new email already exists
            const emailCheck = await db.query('SELECT id FROM public.users WHERE email = $1', [newEmail]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ message: 'Email already in use' });
            }

            // Generate OTP for new email
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiry = new Date(Date.now() + 10 * 60000); // 10 mins

            await db.query(
                'UPDATE public.users SET pending_email = $1, email_otp = $2, otp_expiry = $3 WHERE id = $4',
                [newEmail, otpCode, otpExpiry, userId]
            );

            await mailUtils.sendEmailChangeOTP(newEmail, otpCode);

            // Also update other fields if provided
            if (fullName) await db.query('UPDATE public.users SET full_name = $1 WHERE id = $2', [fullName, userId]);
            if (age) await db.query('UPDATE public.users SET age = $1 WHERE id = $2', [age, userId]);

            return res.json({
                message: 'OTP sent to your new email. Please verify to complete the change.',
                emailChangePending: true
            });
        }

        // 3. Simple updates (no email change)
        if (fullName) await db.query('UPDATE public.users SET full_name = $1 WHERE id = $2', [fullName, userId]);
        if (age) await db.query('UPDATE public.users SET age = $1 WHERE id = $2', [age, userId]);

        res.json({ message: 'Profile updated successfully' });

    } catch (err) {
        console.error('Update Profile Error:', err);
        res.status(500).json({ message: 'Server error during profile update' });
    }
};

// Verify Email Change OTP
exports.verifyEmailChange = async (req, res) => {
    const { otp } = req.body;
    const userId = req.user.id;

    try {
        const result = await db.query(
            'SELECT pending_email, email_otp, otp_expiry FROM public.users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = result.rows[0];

        if (!user.email_otp || user.email_otp !== otp || new Date(user.otp_expiry) < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Apply new email
        await db.query(
            'UPDATE public.users SET email = $1, pending_email = NULL, email_otp = NULL, otp_expiry = NULL WHERE id = $2',
            [user.pending_email, userId]
        );

        res.json({ message: 'Email updated successfully' });

    } catch (err) {
        console.error('Verify Email Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// For demo purposes - list all users
exports.getUsers = async (req, res) => {
    try {
        const users = await db.query(
            'SELECT u.id, u.email, u.full_name, w.balance FROM public.users u LEFT JOIN public.wallets w ON u.id::text = w.user_id::text ORDER BY u.full_name'
        );
        res.json(users.rows);
    } catch (err) {
        console.error('❌ [getUsers] Error Details:', {
            message: err.message,
            code: err.code
        });
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};
// Set Payment PIN
exports.setPaymentPin = async (req, res) => {
    const { pin } = req.body;
    const userId = req.user.id;
    const email = req.user.email;

    if (!pin || pin.length < 4 || pin.length > 6) {
        return res.status(400).json({ message: 'PIN must be between 4 and 6 digits' });
    }

    try {
        const hashedPin = await bcrypt.hash(pin, 10);

        // 1. Try updating by ID or Email
        let result = await db.query('UPDATE public.users SET payment_pin = $1 WHERE id::text = $2 OR email = $3 RETURNING id', [hashedPin, userId, email]);

        if (result.rows.length === 0) {
            console.log(`[SetPin] User not found. Attempting emergency provisioning for ${email}...`);
            const upiId = Math.floor(10000000 + Math.random() * 90000000).toString() + '@zenwallet';

            await db.query(
                "INSERT INTO public.users (id, email, full_name, upi_id, is_verified, payment_pin) VALUES ($1, $2, $3, $4, TRUE, $5) ON CONFLICT (email) DO UPDATE SET payment_pin = EXCLUDED.payment_pin",
                [userId, email, email.split('@')[0], upiId, hashedPin]
            );

            await db.query("INSERT INTO public.wallets (user_id, balance) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING", [userId, 100]);
            await ensureVirtualCard(db, userId);
        }

        res.json({ success: true, message: 'Payment PIN set successfully' });
    } catch (err) {
        console.error('❌ [SetPin] Error details:', {
            message: err.message,
            code: err.code,
            detail: err.detail,
            hint: err.hint,
            userId: req.user.id,
            email: req.user.email
        });
        res.status(500).json({ message: 'Server error while setting PIN' });
    }
};

// Forgot PIN - Send OTP
exports.forgotPin = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await db.query('SELECT email FROM public.users WHERE id::text = $1', [userId]);
        const email = user.rows[0].email;

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60000);

        await db.query('UPDATE public.users SET otp_code = $1, otp_expiry = $2 WHERE id::text = $3', [otpCode, otpExpiry, userId]);
        await mailUtils.sendForgotPasswordOTP(email, otpCode); // Reuse forgot password mail util

        res.json({ message: 'PIN Reset OTP sent to your email' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Reset PIN with OTP
exports.resetPin = async (req, res) => {
    const { otp, newPin } = req.body;
    const userId = req.user.id;

    if (!newPin || newPin.length < 4 || newPin.length > 6) {
        return res.status(400).json({ message: 'PIN must be 4-6 digits' });
    }

    try {
        const user = await db.query(
            'SELECT * FROM public.users WHERE id::text = $1 AND otp_code = $2 AND otp_expiry > NOW()',
            [userId, otp]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const hashedPin = await bcrypt.hash(newPin, 10);
        await db.query('UPDATE public.users SET payment_pin = $1, otp_code = NULL, otp_expiry = NULL WHERE id::text = $2', [hashedPin, userId]);

        res.json({ message: 'Payment PIN reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
