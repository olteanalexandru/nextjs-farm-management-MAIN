type postType = {
    _id: string
    title: string
    text: string
    createdAt: string
    }

export default function PostItem(  { post }: { post: postType }  ) {
    
    return (
        <div className='post'>
            <h3>{post.title}</h3>
            <p>{post.text}</p>
            <div>{new Date(post.createdAt).toLocaleString('en-US')}</div>
        </div>
    );
}
