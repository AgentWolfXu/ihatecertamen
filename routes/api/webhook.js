// Webhook functionality removed - was part of geoword/MODAQ integration
// This file is kept as a placeholder but contains no functionality

import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => {
  res.status(404).send('Webhook functionality removed');
});

export default router;
