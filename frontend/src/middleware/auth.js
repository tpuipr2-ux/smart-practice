const jwt = require('jsonwebtoken');
const { pool } = require('../models/db');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // For TMA, we validate the user based on telegram_id from the web app data
    // In a real app, you'd validate the Telegram WebApp initData
    const { telegram_id } = JSON.parse(token);
    
    if (!telegram_id) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get user from database
    const result = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegram_id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (typeof roles === 'string') {
      roles = [roles];
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };