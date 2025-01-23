// routes/privateroutes.js
import express from 'express';
import { 
  ViewSheets, 
  LoadSheet, 
  CreateSheet, 
  UpdateSheet,
  DeleteSheet,
  ShareSheet,
  LoadFromShare
} from '../controllers/ViewSheets.js';

const router = express.Router();

router.get('/mysheets/:owner_id', ViewSheets);  // GET /mysheets/{owner_id}
router.get('/sheets/:id', LoadSheet);           // GET /sheets/{id}
router.post('/sheets', (req, res) => {
    console.log('POST /sheets called with body:', req.body);
    CreateSheet(req, res);
  });
router.put('/sheets/:id', UpdateSheet);         // PUT /sheets/{id}

router.delete('/sheets/:id', DeleteSheet);        // DELETE /sheets/:id
router.post('/sheets/:id/share', ShareSheet);     // POST /sheets/:id/share
router.get('/share/:share_token', LoadFromShare); // GET /share/:share_token

export default router;
