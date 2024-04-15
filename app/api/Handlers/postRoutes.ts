// import express from 'express';
// const router = express.Router();

// const authCheck = require('../Middleware/authCheck');
// import postController from '../Controllers/postController';
// const postControllerClass = new postController();



// router.route('/').get(authCheck, postControllerClass.getPost).post(authCheck, postControllerClass.SetPost);
// router.route('/posts').get(postControllerClass.getAllPosts);
// router.route('/posts/:id').get(postControllerClass.GetSpecific);
// router.route('/:id').delete(authCheck, postControllerClass.deletePost).put(authCheck, postControllerClass.updatePost);
// router.route('/testingConsoleLog').get(
//     (req, res) => {
//         console.log('Testing Console Log');
//         res.status(200).json({ message: 'Testing Console Log' });
//     }
// );
// export default router;

// pages/api/posts.js
import getPost from '../Controllers/Post/postController';
import getAllPosts from '../Controllers/Post/postController';
import GetSpecific from '../Controllers/Post/postController';
import SetPost from '../Controllers/Post/postController';
import deletePost from '../Controllers/Post/postController';
import updatePost from '../Controllers/Post/postController';
import PostController from '../Controllers/Post/postController';

export async function postRoutesHandler(req: any, res: any) {
    const { method } = req;

    switch (method) {
        case 'GET':
            if (req.query.id) {
                return await new PostController().getPost(req, res);
            } else {
                return await new PostController().getAllPosts(req, res);
            }
        case 'POST':
            return await new PostController().SetPost(req, res);
        case 'PUT':
            return await new PostController().updatePost(req, res);
        case 'DELETE':
            return await new PostController().deletePost(req, res);
        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

// pages/api/posts/[id].js

export async function postsIdHandler(req: any, res: any) {
    const { method } = req;

    switch (method) {
        case 'GET':
            return await new PostController().GetSpecific(req, res);
        case 'PUT':
            return await new PostController().updatePost(req, res);
        case 'DELETE':
            return await new PostController().deletePost(req, res);
        default:
            res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}

// pages/api/testingConsoleLog.js
export async function testingConsoleLogHandler(req: any, res: any) {
    console.log('Testing Console Log');
    res.status(200).json({ message: 'Testing Console Log' });
}

