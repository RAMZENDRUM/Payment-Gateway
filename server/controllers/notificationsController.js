const db = require('../utils/db');

exports.getNotifications = async (req, res) => {
    try {
        // Get user-specific notifications AND global (user_id IS NULL)
        const notifications = await db.query(
            'SELECT * FROM notifications WHERE user_id = $1 OR user_id IS NULL ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );
        res.json(notifications.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)',
            [req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.sendGlobalMessage = async (req, res) => {
    const { title, shortMessage, fullMessage } = req.body;

    // Check if user is ramzendrum@gmail.com
    if (req.user.email !== 'ramzendrum@gmail.com') {
        return res.status(403).json({ message: 'Unauthorized. Only ramzendrum@gmail.com can broadcast.' });
    }

    try {
        const result = await db.query(
            'INSERT INTO notifications (type, title, short_message, full_message) VALUES ($1, $2, $3, $4) RETURNING *',
            ['BROADCAST', title, shortMessage, fullMessage]
        );

        // Notify all connected users via socket
        const io = req.app.get('io');
        if (io) {
            io.emit('new-broadcast', result.rows[0]);
        }

        res.json({ message: 'Broadcast sent successfully', notification: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};
