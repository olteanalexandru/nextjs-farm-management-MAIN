import { NextResponse, NextRequest } from 'next/server';
import Post from '../../../../../Models/postModel';
import User from '../../../../../Models/userModel';
import { connectDB } from '../../../../../../db';
import { getSession } from '@auth0/nextjs-auth0';


connectDB()


//paths :
// for single post
// API_URL + "/post/id/" + id
// for all posts
// API_URL + "/post/count/" + count
// for search
// API_URL + "/post/search/" + search
// for all posts
// API_URL + "/post"

export async function GET(request: Request, context: any) {
  const { params } = context;
  let posts;
  let message
  if (params.posts === 'posts' && params.postsRoutes == "count") {
    const limit = 5;
    const count = Number(params.dinamicAction) || 0;
    const skip = count * limit;
    posts = await Post.find().skip(skip).limit(limit);




    if (posts.length === 0) {
      //include a message for no more posts in posts
      message = "No more posts";
    }

  } else if (params.posts === 'posts' && params.postsRoutes == "search") {
    posts = await Post.find({ title: { $regex: params.dinamicAction, $options: 'i' } });
  } else if (params.posts === 'post' && params.postsRoutes == "id") {
    posts = await Post.findById(params.dinamicAction);
  } else if (
    params.posts === 'posts' &&
    params.postsRoutes == "retrieve" && params.dinamicAction == "all"

  ) {
    posts = await Post.find();
  }

  return NextResponse.json({ posts, message });
}


//POST paths and params docs
// for single post
// API_URL + "/post/new/" + Userid

export async function POST(request: NextRequest, context: any) {
  const { params } = context;
  const { title, brief, description, image } = await request.json();
  const Checkuser = await User.findOne({ auth0_id: params.dinamicAction.toString() });
  const { user } = await getSession();

  if (user === null || user.sub !== Checkuser) {
    return NextResponse.json({ message: 'User not found / not the same user as in token' }, { status: 404 });
  }
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  if (
    !user.userRoles.toString().toLowerCase().includes("admin")
  ) {
    return NextResponse.json({ message: 'User not Admin' }, { status: 401 });
  }
  if (!title) {
    return NextResponse.json({ message: 'Title missing' }, { status: 400 });
  }
  if (!brief) {
    return NextResponse.json({ message: 'Brief missing' }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ message: 'Description missing' }, { status: 400 });
  }
  if (
    params.posts == "post" && params.postsRoutes == "new"
  ) {
    const post = new Post({
      user: user.sub,
      title,
      brief,
      description,
      image
    });
    await post.save();
    console.log("post post triggered")
    return NextResponse.json({ message: 'Post Created' }, { status: 201 });
  }
}

//PUT paths and params docs
// for single post
// API_URL + "/post/:postId/:userId"

export async function PUT(request: NextRequest, context: any) {
  const { params } = context;
  if (
    params.posts == "post"
  ) {
    const { title, brief, description, image } = await request.json();
    const post = await Post.findById(params.dinamicAction);
    const Checkuser = await User.findOne({ auth0_id: params.dinamicAction.toString() });
    const { user } = await getSession();
    if (user === null || user.sub !== Checkuser) {
      return NextResponse.json({ message: 'User not authorized' }, { status: 401 });
    }
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    if (post.user.toString() !== user.sub.toString()) {
      return NextResponse.json({ message: 'User not authorized' }, { status: 401 });
    }
    post.title = title;
    post.brief = brief;
    post.description = description;
    post.image = image;
    await post.save();
    console.log("post put triggered")
    return NextResponse.json({ message: 'Post Updated' }, { status: 200 });
  }
}

//API
//DELETE paths and params docs
// for single post
// API_URL + "/post/:postId/:userId"

export async function DELETE(request: NextRequest, context: any) {
  const { params } = context;
  if (
    params.posts == "post" && params.postsRoutes
  ) {
    const post = await Post.findById(params.postRoutes);
    const checkuser = await User.findOne({ auth0_id: params.dinamicAction.toString() });
    const { user } = await getSession();
    if (user === null || user.sub !== checkuser) {
      return NextResponse.json({ message: 'User not authorized' }, { status: 401 });
    }
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    if (post.user.toString() == user.auth0_id.toString() || user.role.includes('admin')) {

      await post.remove();
      console.log("post delete triggered")
      return NextResponse.json({ message: 'Post Deleted' }, { status: 200 });
    }
  }
}


