import { NextResponse , NextRequest } from 'next/server';
import Post from '../../../../../Models/postModel';
import { connectDB } from '../../../../../../db';
connectDB();







//paths :
// for single post
// API_URL + "/post/id/" + id
// for all posts
// API_URL + "/post/count/" + count
// for search
// API_URL + "/post/search/" + search
// for all posts
// API_URL + "/post"

export async function GET(request:Request,context: any) {
   const {params} = context;
     let posts;
     let message
      if(params.posts === 'posts' && params.postsRoutes == "count"){
      const limit = 5;
      const count = Number(params.dinamicAction) || 0;
      const skip = count * limit;
   posts = await Post.find().skip(skip).limit(limit);
   if (posts.length === 0) {
    //include a message for no more posts in posts
message = "No more posts";
   }
      
  } else if(params.posts === 'posts' && params.postsRoutes == "search"){
    posts = await Post.find({ title: { $regex: params.dinamicAction, $options: 'i' } });
  } else if (params.posts === 'post' && params.postsRoutes !== undefined || params.postsRoutes == "id" || params.postRoutes !== "search"){
       posts = await Post.findById(params.dinamicAction);
  } else {
    posts = await Post.find();
  }
  return NextResponse.json( {posts,message});
}