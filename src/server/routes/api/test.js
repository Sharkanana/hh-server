
const { Router } = require('express');

// simple test for login session
module.exports = Router({mergeParams: true})
  .get('/test', (req, res, next) => {
    return res.json(true);
  });
