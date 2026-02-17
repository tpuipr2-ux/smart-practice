const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Placeholder router to keep API surface stable.
// Application creation and listing are handled in vacancies/users routes.
router.get('/', authMiddleware, async (req, res) => {
  res.json({
    message: 'Use /api/users/applications or /api/vacancies/:id/applications endpoints.',
  });
});

module.exports = router;
