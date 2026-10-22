const pool = require('../config/database');

const VALID_STATUSES = ['pending', 'in_progress', 'completed'];

// CREATE TASK
exports.createTask = async (req, res) => {
    try {
        const { title, description = null, status = 'pending' } = req.body;

        if (typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        if (description !== null && typeof description !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Description must be a string'
            });
        }

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid task status'
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO tasks (title, description, status)
             VALUES (?, ?, ?)`,
            [title.trim(), description, status]
        );

        const [rows] = await pool.execute(
            'SELECT * FROM tasks WHERE id = ?',
            [result.insertId]
        );

        return res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: rows[0]
        });
    } catch (error) {
        console.error('Create task error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// GET ALL TASKS
exports.getTasks = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM tasks ORDER BY created_at DESC'
        );

        return res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Get tasks error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// GET TASK BY ID
exports.getTaskById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID'
            });
        }

        const [rows] = await pool.execute(
            'SELECT * FROM tasks WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Get task error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// UPDATE TASK
exports.updateTask = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { title, description, status } = req.body;

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID'
            });
        }

        const updates = [];
        const values = [];

        if (Object.hasOwn(req.body, 'title')) {
            if (typeof title !== 'string' || !title.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Title must be a non-empty string'
                });
            }

            updates.push('title = ?');
            values.push(title.trim());
        }

        if (Object.hasOwn(req.body, 'description')) {
            if (description !== null && typeof description !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Description must be a string or null'
                });
            }

            updates.push('description = ?');
            values.push(description);
        }

        if (Object.hasOwn(req.body, 'status')) {
            if (!VALID_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid task status'
                });
            }

            updates.push('status = ?');
            values.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Provide at least one field to update'
            });
        }

        values.push(id);

        const [result] = await pool.execute(
            `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            const [existing] = await pool.execute(
                'SELECT id FROM tasks WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }
        }

        const [rows] = await pool.execute(
            'SELECT * FROM tasks WHERE id = ?',
            [id]
        );

        return res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            data: rows[0]
        });
    } catch (error) {
        console.error('Update task error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// DELETE TASK
exports.deleteTask = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid task ID'
            });
        }

        const [result] = await pool.execute(
            'DELETE FROM tasks WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Delete task error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};