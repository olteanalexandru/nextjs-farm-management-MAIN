export { };
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
import User from '../Models/userModel';
//Generate JWT Token
const generateToken = (id: string) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '2d' });




interface Response {
    status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; rol: any; _id: any; name: any; email: any; token: any; }): void; new(): any; } }

    json: (arg0: { rol: any; _id: any; name: any; email: any; token: any; }) => void;
}

interface Request {
    user: {
        id: string
        message: string;
        rol: string;
        _id: string;
        name: string;
        email: string;
        token: string;
    },
    body: {
        rol: string;
        _id: string;
        name: string;
        email: string;
        password: string;
    }
    params: { _id: string; }
}
class userController { 
    //constructor
    constructor() {
        this.registerUser = this.registerUser.bind(this);
        this.loginUser = this.loginUser.bind(this);
        this.getMe = this.getMe.bind(this);
        this.PutUser = this.PutUser.bind(this);
        this.getFermierUsers = this.getFermierUsers.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
    }

    router = require('express').Router();
    
    registerUser = asyncHandler(async (req: Request, res: Response) => {
        const { rol, name, email, password } = req.body;
        if (!rol || !name || !email || !password) {
            res.status(401);
            throw new Error('Toate campurile trebuie completate');
        }
    
        //check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(402);
            throw new Error('Userul exista deja!');
        }
        //hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
    
        if (rol === 'Administrator' && (!req.user || req.user.rol !== 'Administrator')) {
            res.status(403);
            throw new Error('Not authorized to create an administrator account');
        }


        if ( password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,20}$/) === null) {
            res.status(401);
            throw new Error('Password must be between 6 and 20 characters, and contain at least one uppercase letter, one lowercase letter, one number and one special character');
        }
        //Create user
        const user = await User.create({
            rol,
            name,
            email,
            password: hashedPassword
        });
        if (user) {
            res.status(201).json({
                message: 'User Registered',
                rol: user.rol,
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id)
            });
        }
    });
    //@desc auth users
    //@route POST /api/users/login
    //@acces Public
    loginUser = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        } 

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            res.status(401);
            throw new Error('Wrong password');
        } 

        res.json({
            rol: user.rol,
            _id: user.id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    })


    //@desc get  users data
    //@route GET /api/users/me
    //@acces Private
    getMe = asyncHandler(async (req: Request, res: Response) => {
        res.status(200).json(req.user);
    });

    //@desc modificare date
    //@route PUT /api/users
    //@acces Private
    //@Params _id
    //@Body password

    PutUser = asyncHandler(async (req: Request, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; }): void; new(): any; }; }; }) => {
        const { password } = req.body; 
        if (!password) {
            res.status(401);
            throw new Error('missing password');
        }
        const { _id } = req.body;

        const user = await User.findById(_id);
    if (!user) {
        res.status(403);
        throw new Error('User not found');
    }
    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);



    await user.update({
        password: hashedPassword
    })


    if (user) {
        res.status(201).json({
            message: 'User Updated'
        });
    }

})

    //@desc Get all users with role 'Fermier'
    //@route GET /api/users/fermier
    //@access Private/Admin
    getFermierUsers = asyncHandler(async (req: Request, res: Response) => {
        if (req.user && req.user.rol === 'Administrator') {
            const fermierUsers = await User.find({ rol: 'Fermier' }) as  any;
            res.status(200).json(fermierUsers);
        } else {
            res.status(401);
            throw new Error('Not authorized as an admin');
        }
    });

    //@desc Delete user
    //@route DELETE /api/users/:id
    //@access Private/Admin
    deleteUser = asyncHandler(async (req, res) => {
        if (req.user && req.user.rol === 'Administrator' || req.user.id === req.params.id) {
            const user = await User.findById(req.params.id);
    
            if (user) {
                await user.remove();
                res.status(200).json({ message: 'User removed' });
            } else {
                res.status(404);
                throw new Error('User not found');
            }
        } else {
            res.status(401);
            throw new Error('Not authorized as an admin');
        }
    });
}

export default userController;





