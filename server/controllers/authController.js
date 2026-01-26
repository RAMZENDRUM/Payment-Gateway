const db = require('../utils/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-wallet-key-2026';

exports.register = async (req, res) => {
    const { email, password, fullName } = req.body;
    const { client, query, release } = await db.getTransaction();

    try {
        await client.query('BEGIN');

        // Check if user exists
        const userExists = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await client.query(
            'INSERT INTO users (email, password, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name',
            [email, hashedPassword, fullName]
        );

        const userId = newUser.rows[0].id;

        // Create wallet with initial balance (e.g., 100 bonus coins)
        await client.query('INSERT INTO wallets (user_id, balance) VALUES ($1, $2)', [userId, 100]);

        await client.query('COMMIT');

        const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            token,
            user: newUser.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    } finally {
        release();
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.rows[0].id, email }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: {
                id: user.rows[0].id,
                email: user.rows[0].email,
                fullName: user.rows[0].full_name
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await db.query(
            'SELECT u.id, u.email, u.full_name, w.balance FROM users u JOIN wallets w ON u.id = w.user_id WHERE u.id = $1',
            [req.user.id]
        );
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// For demo purposes - list all users
exports.getUsers = async (req, res) => {
    try {
        const users = await db.query(
            'SELECT u.id, u.email, u.full_name, w.balance FROM users u JOIN wallets w ON u.id = w.user_id ORDER BY u.full_name'
        );
        res.json(users.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
