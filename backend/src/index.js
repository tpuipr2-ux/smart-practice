require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');

const { pool } = require('./models/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const vacancyRoutes = require('./routes/vacancies');
const applicationRoutes = require('./routes/applications');
const skillRoutes = require('./routes/skills');
const companyRoutes = require('./routes/companies');
const curatorRoutes = require('./routes/curator');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.BOT_TOKEN, { webHook: true });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vacancies', vacancyRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/curator', curatorRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Telegram Webhook
app.use(`/bot${process.env.BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Bot commands and handlers
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  try {
    // Check if user exists
    const result = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [userId]);
    
    if (result.rows.length === 0) {
      // New user - send registration message
      const opts = {
        reply_markup: {
          keyboard: [[{ text: "📱 Поделиться контактом", request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      };
      
      bot.sendMessage(chatId, 
        "Добро пожаловать в Smart Practice! 🎓\n\n" +
        "Для начала работы, пожалуйста, поделитесь своим контактом.",
        opts
      );
    } else {
      // Existing user
      const user = result.rows[0];
      const roleNames = {
        'student': 'Студент',
        'partner': 'Партнер',
        'curator': 'Куратор',
        'admin': 'Администратор'
      };
      
      bot.sendMessage(chatId, 
        `С возвращением, ${user.full_name || ''}! 👋\n\n` +
        `Ваша роль: ${roleNames[user.role] || user.role}\n\n` +
        "Откройте веб-приложение для продолжения работы.",
        {
          reply_markup: {
            inline_keyboard: [[
              { text: "🚀 Открыть приложение", web_app: { url: process.env.WEB_APP_URL } }
            ]]
          }
        }
      );
    }
  } catch (error) {
    console.error('Error in /start command:', error);
    bot.sendMessage(chatId, "Произошла ошибка. Попробуйте позже.");
  }
});

// Handle contact sharing
bot.on('contact', async (msg) => {
  const chatId = msg.chat.id;
  const contact = msg.contact;
  
  if (!contact) {
    bot.sendMessage(chatId, "Контакт не получен. Попробуйте еще раз.");
    return;
  }
  
  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [msg.from.id]);
    
    if (existingUser.rows.length === 0) {
      // Create new user with pending role selection
      await pool.query(
        'INSERT INTO users (telegram_id, phone, full_name) VALUES ($1, $2, $3)',
        [msg.from.id, contact.phone_number, contact.first_name + (contact.last_name ? ' ' + contact.last_name : '')]
      );
      
      // Send role selection
      bot.sendMessage(chatId, 
        "Спасибо! Теперь выберите вашу роль:",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "👨‍🎓 Студент", callback_data: "role_student" }],
              [{ text: "🏢 Партнер", callback_data: "role_partner" }]
            ]
          }
        }
      );
    }
  } catch (error) {
    console.error('Error handling contact:', error);
    bot.sendMessage(chatId, "Произошла ошибка при сохранении контакта.");
  }
});

// Handle role selection
bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;
  
  try {
    if (data.startsWith('role_')) {
      const role = data.replace('role_', '');
      
      // Update user role
      await pool.query('UPDATE users SET role = $1 WHERE telegram_id = $2', [role, userId]);
      
      // Create company for partner
      if (role === 'partner') {
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const companyResult = await pool.query(
          'INSERT INTO companies (name, invite_code) VALUES ($1, $2) RETURNING id',
          [`Компания ${callbackQuery.from.first_name}`, inviteCode]
        );
        
        await pool.query(
          'UPDATE users SET company_id = $1 WHERE telegram_id = $2',
          [companyResult.rows[0].id, userId]
        );
      }
      
      bot.answerCallbackQuery(callbackQuery.id, { text: "Роль сохранена!" });
      
      bot.sendMessage(chatId, 
        "✅ Регистрация завершена!\n\n" +
        "Теперь вы можете использовать веб-приложение.",
        {
          reply_markup: {
            inline_keyboard: [[
              { text: "🚀 Открыть приложение", web_app: { url: process.env.WEB_APP_URL } }
            ]]
          }
        }
      );
    }
  } catch (error) {
    console.error('Error in callback query:', error);
    bot.answerCallbackQuery(callbackQuery.id, { text: "Произошла ошибка" });
  }
});

// Daily cron job to archive expired vacancies
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily archive job...');
  try {
    const result = await pool.query(
      'UPDATE vacancies SET status = $1 WHERE deadline_date < CURRENT_DATE AND status = $2 RETURNING id',
      ['archived', 'active']
    );
    console.log(`Archived ${result.rowCount} expired vacancies`);
  } catch (error) {
    console.error('Error in archive job:', error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook URL: ${process.env.WEB_APP_URL}/bot${process.env.BOT_TOKEN}`);
});

// Export bot for use in routes
module.exports = { bot };