const express = require('express');
const { pool } = require('../models/db');
const router = express.Router();

// Get current user info
router.get('/me', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'];
    
    if (!telegramId) {
      return res.status(401).json({ error: 'No telegram ID provided' });
    }
    
    const result = await pool.query(`
      SELECT u.*, c.name as company_name, c.logo_url as company_logo, c.invite_code,
             m.name as major_name
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN majors m ON u.major_id = m.id
      WHERE u.telegram_id = $1
    `, [telegramId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Get user skills
    const skillsResult = await pool.query(
      'SELECT id, skill_name, is_verified FROM skills WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );
    
    user.skills = skillsResult.rows;
    
    res.json({ user });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.post('/profile', async (req, res) => {
  try {
    const telegramId = req.headers['x-telegram-id'];
    const { full_name, major_id, course } = req.body;
    
    if (!telegramId) {
      return res.status(401).json({ error: 'No telegram ID provided' });
    }
    
    const result = await pool.query(
      'UPDATE users SET full_name = $1, major_id = $2, course = $3, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = $4 RETURNING *',
      [full_name, major_id, course, telegramId]
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

// Get all majors
router.get('/majors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM majors ORDER BY id');
    res.json({ majors: result.rows });
  } catch (error) {
    console.error('Error getting majors:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;