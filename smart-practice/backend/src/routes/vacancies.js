const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../models/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { bot } = require('../index');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'logo') {
      cb(null, 'uploads/logos');
    } else if (file.fieldname === 'header') {
      cb(null, 'uploads/headers');
    } else {
      cb(null, 'uploads');
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Get all vacancies (with filtering and sorting)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { status, major_id, search } = req.query;
    
    let query = `
      SELECT v.*, 
             c.name as company_name, 
             c.logo_url as company_logo,
             u.full_name as partner_name,
             (SELECT COUNT(*) FROM applications a WHERE a.vacancy_id = v.id) as application_count,
             (SELECT COUNT(*) FROM applications a WHERE a.vacancy_id = v.id AND a.status = 'active') as active_applications
      FROM vacancies v
      JOIN companies c ON v.company_id = c.id
      JOIN users u ON v.partner_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filter by status
    if (status) {
      query += ` AND v.status = $${params.length + 1}`;
      params.push(status);
    } else {
      // By default, only show active vacancies to students
      if (user.role === 'student') {
        query += ` AND v.status = 'active'`;
      }
    }
    
    // Filter by major for students
    if (user.role === 'student' && user.major_id) {
      query += ` AND ($${params.length + 1} = ANY(v.major_ids) OR v.major_ids IS NULL)`;
      params.push(user.major_id);
    }
    
    // Search
    if (search) {
      query += ` AND (v.title ILIKE $${params.length + 1} OR v.description ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    // Sort based on student preferences
    if (user.role === 'student') {
      query += ` ORDER BY 
        CASE WHEN $${params.length + 1} = ANY(v.major_ids) THEN 0 ELSE 1 END,
        v.created_at DESC
      `;
      params.push(user.major_id);
    } else {
      query += ` ORDER BY v.created_at DESC`;
    }
    
    const result = await pool.query(query, params);
    
    // Check if student has applied to each vacancy
    if (user.role === 'student') {
      for (let vacancy of result.rows) {
        const applied = await pool.query(
          'SELECT id FROM applications WHERE vacancy_id = $1 AND student_id = $2',
          [vacancy.id, user.id]
        );
        vacancy.user_applied = applied.rows.length > 0;
      }
    }
    
    res.json({ vacancies: result.rows });
  } catch (error) {
    console.error('Error getting vacancies:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single vacancy
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    const result = await pool.query(`
      SELECT v.*, 
             c.name as company_name, 
             c.logo_url as company_logo,
             c.description as company_description,
             u.full_name as partner_name,
             (SELECT COUNT(*) FROM applications a WHERE a.vacancy_id = v.id) as application_count
      FROM vacancies v
      JOIN companies c ON v.company_id = c.id
      JOIN users u ON v.partner_id = u.id
      WHERE v.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }
    
    const vacancy = result.rows[0];
    
    // Check if student has applied
    if (user.role === 'student') {
      const applied = await pool.query(
        'SELECT id FROM applications WHERE vacancy_id = $1 AND student_id = $2',
        [id, user.id]
      );
      vacancy.user_applied = applied.rows.length > 0;
    }
    
    res.json({ vacancy });
  } catch (error) {
    console.error('Error getting vacancy:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create vacancy (partner only)
router.post('/', roleMiddleware(['partner']), upload.single('header'), async (req, res) => {
  try {
    const user = req.user;
    const { 
      title, 
      description, 
      position, 
      major_ids, 
      slots_count, 
      deadline_date, 
      reward,
      header_bg_color 
    } = req.body;
    
    // Ensure user has a company
    if (!user.company_id) {
      return res.status(400).json({ error: 'User has no company' });
    }
    
    const result = await pool.query(`
      INSERT INTO vacancies (partner_id, company_id, title, description, position, major_ids, slots_count, deadline_date, reward, header_bg_color, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'moderation')
      RETURNING *
    `, [
      user.id, 
      user.company_id, 
      title, 
      description, 
      position, 
      major_ids ? major_ids.split(',').map(id => parseInt(id)) : null, 
      slots_count, 
      deadline_date, 
      reward,
      header_bg_color
    ]);
    
    res.status(201).json({ vacancy: result.rows[0] });
  } catch (error) {
    console.error('Error creating vacancy:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update vacancy (partner only)
router.put('/:id', roleMiddleware(['partner']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { 
      title, 
      description, 
      position, 
      major_ids, 
      slots_count, 
      deadline_date, 
      reward,
      header_bg_color 
    } = req.body;
    
    // Check if vacancy belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM vacancies WHERE id = $1 AND partner_id = $2',
      [id, user.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vacancy not found or access denied' });
    }
    
    const result = await pool.query(`
      UPDATE vacancies 
      SET title = $1, description = $2, position = $3, major_ids = $4, 
          slots_count = $5, deadline_date = $6, reward = $7, header_bg_color = $8,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `, [
      title, 
      description, 
      position, 
      major_ids ? major_ids.split(',').map(id => parseInt(id)) : null, 
      slots_count, 
      deadline_date, 
      reward,
      header_bg_color,
      id
    ]);
    
    res.json({ vacancy: result.rows[0] });
  } catch (error) {
    console.error('Error updating vacancy:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete vacancy (partner or admin)
router.delete('/:id', roleMiddleware(['partner', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Check if user owns the vacancy (if not admin)
    if (user.role !== 'admin') {
      const checkResult = await pool.query(
        'SELECT * FROM vacancies WHERE id = $1 AND partner_id = $2',
        [id, user.id]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Vacancy not found or access denied' });
      }
    }
    
    await pool.query('DELETE FROM vacancies WHERE id = $1', [id]);
    
    res.json({ message: 'Vacancy deleted' });
  } catch (error) {
    console.error('Error deleting vacancy:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Apply to vacancy (student only)
router.post('/:id/apply', roleMiddleware(['student']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Check if vacancy exists and is active
    const vacancyResult = await pool.query(
      'SELECT * FROM vacancies WHERE id = $1 AND status = $2',
      [id, 'active']
    );
    
    if (vacancyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vacancy not found or not active' });
    }
    
    // Check if already applied
    const existingResult = await pool.query(
      'SELECT * FROM applications WHERE vacancy_id = $1 AND student_id = $2',
      [id, user.id]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Already applied to this vacancy' });
    }
    
    // Create application
    await pool.query(
      'INSERT INTO applications (vacancy_id, student_id) VALUES ($1, $2)',
      [id, user.id]
    );
    
    // Get vacancy info for notification
    const vacancy = vacancyResult.rows[0];
    const partnerResult = await pool.query(
      'SELECT telegram_id FROM users WHERE id = $1',
      [vacancy.partner_id]
    );
    
    // Notify partner about new application
    if (partnerResult.rows.length > 0) {
      const applicationCount = await pool.query(
        'SELECT COUNT(*) as count FROM applications WHERE vacancy_id = $1',
        [id]
      );
      
      bot.sendMessage(partnerResult.rows[0].telegram_id, 
        `📬 Новый отклик на вакансию "${vacancy.title}"\n\n` +
        `Всего заявок: ${applicationCount.rows[0].count}\n\n` +
        "Проверьте веб-приложение для деталей."
      );
    }
    
    res.json({ message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Error applying to vacancy:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Hide vacancy (student only) - add to hidden list
router.post('/:id/hide', roleMiddleware(['student']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // For simplicity, we'll just return success
    // In a real app, you'd store hidden vacancies in a separate table
    
    res.json({ message: 'Vacancy hidden' });
  } catch (error) {
    console.error('Error hiding vacancy:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get partner's vacancies
router.get('/partner/my', roleMiddleware(['partner']), async (req, res) => {
  try {
    const user = req.user;
    const { status } = req.query;
    
    let query = `
      SELECT v.*, 
             c.name as company_name, 
             c.logo_url as company_logo,
             (SELECT COUNT(*) FROM applications a WHERE a.vacancy_id = v.id) as application_count
      FROM vacancies v
      JOIN companies c ON v.company_id = c.id
      WHERE v.partner_id = $1
    `;
    
    const params = [user.id];
    
    if (status) {
      query += ` AND v.status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY v.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json({ vacancies: result.rows });
  } catch (error) {
    console.error('Error getting partner vacancies:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Duplicate vacancy (create based on existing)
router.post('/:id/duplicate', roleMiddleware(['partner']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Get original vacancy
    const originalResult = await pool.query(
      'SELECT * FROM vacancies WHERE id = $1 AND partner_id = $2',
      [id, user.id]
    );
    
    if (originalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }
    
    const original = originalResult.rows[0];
    
    // Create duplicate
    const result = await pool.query(`
      INSERT INTO vacancies (partner_id, company_id, title, description, position, major_ids, slots_count, deadline_date, reward, header_bg_color, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft')
      RETURNING *
    `, [
      user.id,
      original.company_id,
      original.title + ' (Копия)',
      original.description,
      original.position,
      original.major_ids,
      original.slots_count,
      original.deadline_date,
      original.reward,
      original.header_bg_color
    ]);
    
    res.status(201).json({ vacancy: result.rows[0] });
  } catch (error) {
    console.error('Error duplicating vacancy:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;