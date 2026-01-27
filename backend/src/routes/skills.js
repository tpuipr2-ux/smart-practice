const express = require('express');
const { pool } = require('../models/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get user's skills
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT id, skill_name, is_verified, created_at FROM skills WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json({ skills: result.rows });
  } catch (error) {
    console.error('Error getting skills:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new skill
router.post('/', roleMiddleware(['student']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { skill_name } = req.body;
    
    if (!skill_name || skill_name.trim().length === 0) {
      return res.status(400).json({ error: 'Skill name is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO skills (user_id, skill_name) VALUES ($1, $2) RETURNING *',
      [userId, skill_name.trim()]
    );
    
    res.status(201).json({ skill: result.rows[0] });
  } catch (error) {
    console.error('Error adding skill:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete skill (only if not verified)
router.delete('/:id', roleMiddleware(['student']), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if skill belongs to user and is not verified
    const checkResult = await pool.query(
      'SELECT * FROM skills WHERE id = $1 AND user_id = $2 AND is_verified = false',
      [id, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found or already verified' });
    }
    
    await pool.query('DELETE FROM skills WHERE id = $1', [id]);
    
    res.json({ message: 'Skill deleted' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Curator only: Get all pending skills for verification
router.get('/pending/verification', roleMiddleware(['curator']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, u.full_name, u.telegram_id
      FROM skills s
      JOIN users u ON s.user_id = u.id
      WHERE s.is_verified = false
      ORDER BY s.created_at DESC
    `);
    
    res.json({ skills: result.rows });
  } catch (error) {
    console.error('Error getting pending skills:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Curator only: Verify skill
router.put('/:id/verify', roleMiddleware(['curator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;
    
    // Get skill info
    const skillResult = await pool.query(`
      SELECT s.*, u.telegram_id
      FROM skills s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `, [id]);
    
    if (skillResult.rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    const skill = skillResult.rows[0];
    
    // Update skill
    await pool.query(
      'UPDATE skills SET is_verified = $1 WHERE id = $2',
      [is_verified, id]
    );
    
    // Notify user
    if (skill.telegram_id) {
      const bot = require('../index').bot;
      if (is_verified) {
        bot.sendMessage(skill.telegram_id, 
          `✅ Ваш навык "${skill.skill_name}" подтвержден!`
        );
      } else {
        bot.sendMessage(skill.telegram_id, 
          `❌ Ваш навык "${skill.skill_name}" не подтверден.\n\n` +
          "Пожалуйста, обратитесь к куратору для уточнений."
        );
      }
    }
    
    res.json({ message: 'Skill verification updated' });
  } catch (error) {
    console.error('Error verifying skill:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;