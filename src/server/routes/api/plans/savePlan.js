
const { Router } = require('express');

// save plan - persists a plan that has been init already
module.exports = Router({mergeParams: true})
  .post('/savePlan', (req, res, next) => {

    try {

    } catch(error) {
      next(error);
    }

  });
