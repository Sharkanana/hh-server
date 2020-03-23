
// init plan - just the initial search and display of results.  does not persist.

const { Router } = require('express');

// save plan - persists a plan that has been init already
module.exports = Router({mergeParams: true})
  .post('/initPlan', (req, res, next) => {

    try {

      let location = req.body.location;

      // lookup 10 breakfast, 10 lunch, 10 dinner spots from location

      return res.json({
        location: location,
        b: [
          { name: 'lunas'},
          { name: 'epples'},
          { name: 'sunrise'}
        ],
        l: [
          { name: 'bulldog'},
          { name: 'mcdonalds'},
          { name: 'bar louie'}
        ],
        d: [
          { name: 'sofi'},
          { name: 'sociale'},
          { name: 'nandos'}
        ]
      });

    } catch(error) {
      next(error);
    }

  });
