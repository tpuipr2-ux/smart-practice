const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { pool } = require('../models/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { bot } = require('../index');
const router = express.Router();

// Apply auth and curator middleware
router.use(authMiddleware);
router.use(roleMiddleware(['curator']));

// Get vacancies for moderation
router.get('/vacancies/moderation', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, 
             c.name as company_name, 
             c.logo_url as company_logo,
             u.full_name as partner_name,
             u.telegram_id as partner_telegram_id
      FROM vacancies v
      JOIN companies c ON v.company_id = c.id
      JOIN users u ON v.partner_id = u.id
      WHERE v.status = 'moderation'
      ORDER BY v.created_at DESC
    `);
    
    res.json({ vacancies: result.rows });
  } catch (error) {
    console.error('Error getting vacancies for moderation:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Moderate vacancy
router.put('/vacancies/:id/moderate', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body; // action: 'approve' or 'reject'
    
    // Get vacancy info
    const vacancyResult = await pool.query(`
      SELECT v.*, u.telegram_id
      FROM vacancies v
      JOIN users u ON v.partner_id = u.id
      WHERE v.id = $1
    `, [id]);
    
    if (vacancyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }
    
    const vacancy = vacancyResult.rows[0];
    
    if (action === 'approve') {
      // Approve vacancy
      await pool.query(
        'UPDATE vacancies SET status = $1 WHERE id = $2',
        ['active', id]
      );
      
      // Notify partner
      if (vacancy.telegram_id) {
        bot.sendMessage(vacancy.telegram_id, 
          `✅ Ваша вакансия "${vacancy.title}" одобрена и опубликована!\n\n` +
          "Студенты теперь могут подавать заявки."
        );
      }
      
      res.json({ message: 'Vacancy approved' });
    } else if (action === 'reject') {
      // Reject vacancy
      await pool.query(
        'UPDATE vacancies SET status = $1 WHERE id = $2',
        ['draft', id]
      );
      
      // Notify partner with comment
      if (vacancy.telegram_id) {
        bot.sendMessage(vacancy.telegram_id, 
          `❌ Ваша вакансия "${vacancy.title}" отклонена.\n\n` +
          `Причина: ${comment || 'Указана не указана'}`
        );
      }
      
      res.json({ message: 'Vacancy rejected' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error moderating vacancy:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get export requests
router.get('/export-requests', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT er.*, 
             v.title as vacancy_title,
             c.name as company_name,
             u.full_name as partner_name,
             u.telegram_id as partner_telegram_id
      FROM export_requests er
      JOIN vacancies v ON er.vacancy_id = v.id
      JOIN companies c ON v.company_id = c.id
      JOIN users u ON er.partner_id = u.id
      WHERE er.status = 'pending'
      ORDER BY er.created_at DESC
    `);
    
    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Error getting export requests:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate Excel with student data
router.get('/export/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get vacancy and applications
    const vacancyResult = await pool.query(`
      SELECT v.*, c.name as company_name
      FROM vacancies v
      JOIN companies c ON v.company_id = c.id
      WHERE v.id = $1
    `, [id]);
    
    if (vacancyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vacancy not found' });
    }
    
    const vacancy = vacancyResult.rows[0];
    
    // Get all applications with student data
    const applicationsResult = await pool.query(`
      SELECT a.created_at as applied_at,
             u.full_name,
             u.phone,
             u.course,
             m.name as major_name,
             string_agg(s.skill_name, ', ') as skills
      FROM applications a
      JOIN users u ON a.student_id = u.id
      LEFT JOIN majors m ON u.major_id = m.id
      LEFT JOIN skills s ON u.id = s.user_id AND s.is_verified = true
      WHERE a.vacancy_id = $1
      GROUP BY a.created_at, u.full_name, u.phone, u.course, m.name
      ORDER BY a.created_at DESC
    `, [id]);
    
    // Create Excel workbook
    const wb = xlsx.utils.book_new();
    
    // Create data array
    const data = [
      ['Вакансия', vacancy.title],
      ['Компания', vacancy.company_name],
      ['Дата выгрузки', new Date().toLocaleDateString('ru-RU')],
      [''],
      ['ФИО', 'Телефон', 'Курс', 'Направление', 'Навыки', 'Дата отклика']
    ];
    
    applicationsResult.rows.forEach(app => {
      data.push([
        app.full_name,
        app.phone,
        app.course,
        app.major_name,
        app.skills || '',
        new Date(app.applied_at).toLocaleDateString('ru-RU')
      ]);
    });
    
    // Create worksheet
    const ws = xlsx.utils.aoa_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 30 }, // ФИО
      { wch: 20 }, // Телефон
      { wch: 10 }, // Курс
      { wch: 40 }, // Направление
      { wch: 40 }, // Навыки
      { wch: 15 }  // Дата отклика
    ];
    
    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(wb, ws, 'Студенты');
    
    // Generate filename
    const filename = `students_${vacancy.title}_${Date.now()}.xlsx`;
    const filepath = path.join('/tmp', filename);
    
    // Write file
    xlsx.writeFile(wb, filepath);
    
    // Send file
    res.download(filepath, filename, (err) => {
      // Delete temp file after sending
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    });
    
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark export request as sent
router.put('/export/:id/sent', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update export request status
    const result = await pool.query(`
      UPDATE export_requests 
      SET status = 'sent', updated_at = CURRENT_TIMESTAMP
      WHERE vacancy_id = $1 AND status = 'pending'
      RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Export request not found' });
    }
    
    const request = result.rows[0];
    
    // Notify partner
    const partnerResult = await pool.query(
      'SELECT telegram_id FROM users WHERE id = $1',
      [request.partner_id]
    );
    
    if (partnerResult.rows.length > 0) {
      const vacancyResult = await pool.query(
        'SELECT title FROM vacancies WHERE id = $1',
        [request.vacancy_id]
      );
      
      const vacancyTitle = vacancyResult.rows.length > 0 ? vacancyResult.rows[0].title : 'вакансия';
      
      bot.sendMessage(partnerResult.rows[0].telegram_id, 
        `📧 Данные студентов по вакансии "${vacancyTitle}" отправлены на вашу электронную почту!\n\n` +
        "Проверьте письмо и свяжитесь с кандидатами."
      );
    }
    
    res.json({ message: 'Export marked as sent' });
  } catch (error) {
    console.error('Error marking export as sent:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;