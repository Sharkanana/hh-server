import { Router } from 'express';

const router = new Router();

// simple test for login session
router.get('/test', (req, res, next) => {
  return res.json(true);
});

module.exports = router;
