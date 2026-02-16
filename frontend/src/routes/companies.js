const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../models/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const router = express.Router();

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: 'uploads/logos',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create new company (for curators or partners without company)
router.post('/', roleMiddleware(['partner', 'curator']), async (req, res) => {
  try {
    const user = req.user;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }
    
    // Generate invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create company
    const result = await pool.query(
      'INSERT INTO companies (name, description, invite_code) VALUES ($1, $2, $3) RETURNING *',
      [name, description || '', inviteCode]
    );
    
    const company = result.rows[0];
    
    // Update user's company_id
    await pool.query(
      'UPDATE users SET company_id = $1 WHERE id = $2',
      [company.id, user.id]
    );
    
    res.status(201).json({ company });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's company info
router.get('/my', roleMiddleware(['partner', 'curator']), async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.company_id) {
      return res.status(404).json({ error: 'User has no company' });
    }
    
    const result = await pool.query(
      'SELECT * FROM companies WHERE id = $1',
      [user.company_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json({ company: result.rows[0] });
  } catch (error) {
    console.error('Error getting company:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update company info
router.put('/my', roleMiddleware(['partner', 'curator']), upload.single('logo'), async (req, res) => {
  try {
    const user = req.user;
    const { name, description } = req.body;
    
    if (!user.company_id) {
      return res.status(404).json({ error: 'User has no company' });
    }
    
    const logo_url = req.file ? `/uploads/logos/${req.file.filename}` : undefined;
    
    const result = await pool.query(
      'UPDATE companies SET name = $1, description = $2, logo_url = COALESCE($3, logo_url) WHERE id = $4 RETURNING *',
      [name, description, logo_url, user.company_id]
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

// Generate invite link for company
router.post('/invite', roleMiddleware(['partner']), async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.company_id) {
      return res.status(404).json({ error: 'User has no company' });
    }
    
    // Get or generate invite code
    const companyResult = await pool.query(
      'SELECT invite_code FROM companies WHERE id = $1',
      [user.company_id]
    );
    
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    let inviteCode = companyResult.rows[0].invite_code;
    
    if (!inviteCode) {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await pool.query(
        'UPDATE companies SET invite_code = $1 WHERE id = $2',
        [inviteCode, user.company_id]
      );
    }
    
    const inviteLink = `${process.env.WEB_APP_URL}?start=invite_${inviteCode}`;
    
    res.json({ invite_link: inviteLink, invite_code: inviteCode });
  } catch (error) {
    console.error('Error generating invite link:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join company with invite code
router.post('/join', roleMiddleware(['partner']), async (req, res) => {
  try {
    const user = req.user;
    const { invite_code } = req.body;
    
    if (!invite_code) {
      return res.status(400).json({ error: 'Invite code is required' });
    }
    
    // Find company by invite code
    const companyResult = await pool.query(
      'SELECT id FROM companies WHERE invite_code = $1',
      [invite_code.toUpperCase()]
    );
    
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }
    
    const companyId = companyResult.rows[0].id;
    
    // Update user's company
    await pool.query(
      'UPDATE users SET company_id = $1 WHERE id = $2',
      [companyId, user.id]
    );
    
    res.json({ message: 'Successfully joined company', company_id: companyId });
  } catch (error) {
    console.error('Error joining company:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get company members
router.get('/members', roleMiddleware(['partner']), async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.company_id) {
      return res.status(404).json({ error: 'User has no company' });
    }
    
    const result = await pool.query(`
      SELECT id, full_name, role, telegram_id, created_at
      FROM users
      WHERE company_id = $1
      ORDER BY created_at DESC
    `, [user.company_id]);
    
    res.json({ members: result.rows });
  } catch (error) {
    console.error('Error getting company members:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;