const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const users = require('../controllers/users');

// all the routes for user apis.
// all of the apis have middleware authorization process except /create and /login apis

router.post('/create', users.CreateUser);
router.post('/login', users.Login);
router.get('/list', auth.auth_chk, users.GetUserList);
router.put('/edit/:id', auth.auth_chk, users.EditUser);
router.delete('/delete/:id', auth.auth_chk, users.DeleteUser);



module.exports = router;