const express = require('express');
const { getCourseVideos, createVideo, updateVideo, deleteVideo } = require('../controllers/videoController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/course/:courseId', auth, getCourseVideos);
router.post('/', auth, adminAuth, createVideo);
router.put('/:id', auth, adminAuth, updateVideo);
router.delete('/:id', auth, adminAuth, deleteVideo);

module.exports = router;