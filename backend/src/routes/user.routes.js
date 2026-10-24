const express = require('express');
const router = express.Router();
const { createUser, getUsers, getUserById, deleteUser } = require('../controllers/user.controller');
const { validateObjectId, validateUserBody } = require('../middleware/validator.middleware');

router.post('/', validateUserBody, createUser);
router.get('/', getUsers);
router.get('/:id', validateObjectId('id'), getUserById);
router.delete('/:id', validateObjectId('id'), deleteUser);

module.exports = router;
