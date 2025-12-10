const express = require("express");
const { allMessages, sendMessage } = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/').post(protect, sendMessage);
router.route('/:chatId').get(protect, allMessages);
router.post('/upload', protect, upload.single('image'), (req, res) => {
    res.send(`/${req.file.path}`);
});

module.exports = router;
