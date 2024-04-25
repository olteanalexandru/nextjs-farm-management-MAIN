export {};
const express = require('express');
const router = express.Router()
const { checkRole} = require('../middleware/authMiddleware')
const authCheck = require('../Middleware/authCheck');

import userController from '../Controllers/User/[Action]/route';
const userControllerClass = new userController();

router.post('/login', userControllerClass.loginUser)
router.get('/me',authCheck, userControllerClass.getMe)
router.get('/login', 
  function(req, res) {
    res = res.status(200);
    res.send('Hello World');
    });
router.route('/').put(userControllerClass.PutUser).post(userControllerClass.registerUser)
router.route('/').get(authCheck, checkRole('Administrator'), userControllerClass.registerUser)
router.route('/fermier').get(authCheck, userControllerClass.getFermierUsers);
router.route('/:id').delete(authCheck, userControllerClass.deleteUser);

export default router;