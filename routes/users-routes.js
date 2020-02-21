const express = require('express');

const router = express.Router();

router.get('/:uid', (req, res, next) => {
  const userId = req.params.pid; // { pid: 'p1' }
  const user = DUMMY_PLACES.find(p => {
    return p.id === userId;
  });
  res.json({user}); // => { place } => { place: place }
});

module.exports = router;