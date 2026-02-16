const express = require('express');
const { pool } = require('../models/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const router = express.Router();

// Apply auth and admin middleware
router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

// Get all companies
router.get('/companies', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, 
             COUNT(u.id) as member_count,
             COUNT(v.id) as vacancy_count
      FROM companies c
      LEFT JOIN users u ON c.id = u.company_id
      LEFT JOIN vacancies v ON c.id = v.company_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    
    res.json({ companies: result.rows });
  } catch (error) {
    console.error('Error getting companies:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update company
router.put('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const result = await pool.query(
      'UPDATE companies SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json({ company: result.rows[0] });
  } catch (error) {
    console.error('Error updating company:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete company
router.delete('/companies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM companies WHERE id = $1', [id]);
    
    res.json({ message: 'Company deleted' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all vacancies (admin view)
router.get('/vacancies', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, 
             c.name as company_name, 
             c.logo_url as company_logo,
             u.full_name as partner_name
      FROM vacancies v
      JOIN companies c ON v.company_id = c.id
      JOIN users u ON v.partner_id = u.id
      ORDER BY v.created_at DESC
    `);
    
    res.json({ vacancies: result.rows });
  } catch (error) {
    console.error('Error getting vacancies:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update vacancy status
router.put('/vacancies/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(
      'UPDATE vacancies SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }
    
    res.json({ vacancy: result.rows[0] });
  } catch (error) {
    console.error('Error updating vacancy status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete vacancy
router.delete('/vacancies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM vacancies WHERE id = $1', [id]);
    
    res.json({ message: 'Vacancy deleted' });
  } catch (error) {
    console.error('Error deleting vacancy:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get majors
router.get('/majors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM majors ORDER BY id');
    res.json({ majors: result.rows });
  } catch (error) {
    console.error('Error getting majors:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add major
router.post('/majors', async (req, res) => {
  try {
    const { name } = req.body;
    
    const result = await pool.query(
      'INSERT INTO majors (name) VALUES ($1) RETURNING *',
      [name]
    );
    
    res.status(201).json({ major: result.rows[0] });
  } catch (error) {
    console.error('Error adding major:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update major
router.put('/majors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    const result = await pool.query(
      'UPDATE majors SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Major not found' });
    }
    
    res.json({ major: result.rows[0] });
  } catch (error) {
    console.error('Error updating major:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete major
router.delete('/majors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM majors WHERE id = $1', [id]);
    
    res.json({ message: 'Major deleted' });
  } catch (error) {
    console.error('Error deleting major:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {};
    
    // User statistics
    const usersResult = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);
    stats.users = usersResult.rows;
    
    // Vacancy statistics
    const vacanciesResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM vacancies
      GROUP BY status
    `);
    stats.vacancies = vacanciesResult.rows;
    
    // Application statistics
    const applicationsResult = await pool.query(`
      SELECT COUNT(*) as total,
             COUNT(DISTINCT student_id) as unique_students,
             COUNT(DISTINCT vacancy_id) as unique_vacancies
      FROM applications
    `);
    stats.applications = applicationsResult.rows[0];
    
    res.json({ stats });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;