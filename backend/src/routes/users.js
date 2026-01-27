const express = require('express');
const { pool } = require('../models/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get user profile (detailed)
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT u.*, c.name as company_name, c.logo_url as company_logo,
             m.name as major_name
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN majors m ON u.major_id = m.id
      WHERE u.id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Get skills
    const skillsResult = await pool.query(
      'SELECT id, skill_name, is_verified FROM skills WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    user.skills = skillsResult.rows;
    
    res.json({ user });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, major_id, course } = req.body;
    
    const result = await pool.query(
      'UPDATE users SET full_name = $1, major_id = $2, course = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [full_name, major_id, course, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's applications (for students)
router.get('/applications', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT a.id, a.created_at, a.status as app_status,
             v.id as vacancy_id, v.title, v.description, v.position,
             v.deadline_date, v.reward, v.status as vacancy_status,
             c.name as company_name, c.logo_url as company_logo,
             v.header_bg_color
      FROM applications a
      JOIN vacancies v ON a.vacancy_id = v.id
      JOIN companies c ON v.company_id = c.id
      WHERE a.student_id = $1
      ORDER BY a.created_at DESC
    `, [userId]);
    
    res.json({ applications: result.rows });
  } catch (error) {
    console.error('Error getting applications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin only: Get all users
router.get('/', roleMiddleware(['admin']), async (req, res) => {
  try {
    const { search, role } = req.query;
    
    let query = `
      SELECT u.*, c.name as company_name, m.name as major_name
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN majors m ON u.major_id = m.id
      WHERE 1=1
    `;
    const params = [];
    
    if (search) {
      query += ` AND (u.full_name ILIKE $${params.length + 1} OR u.phone ILIKE $${params.length + 1} OR u.telegram_id::text ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    if (role) {
      query += ` AND u.role = $${params.length + 1}`;
      params.push(role);
    }
    
    query += ` ORDER BY u.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin only: Update user role
router.put('/:id/role', roleMiddleware(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [role, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;