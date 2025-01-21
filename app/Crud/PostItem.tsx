import { Post } from '../types/api';
import { Button } from 'react-bootstrap';
import { usePostContext } from '../providers/postStore';
import { useTranslations } from 'next-intl';

export default function PostItem({ post }: { post: Post }) {
    const { deletePost } = usePostContext();
    const t = useTranslations('Postari');
    
    const handleDelete = async () => {
        try {
            await deletePost(post.id);
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    };

    return (
        <div className='post'>
            <h3>{post.title}</h3>
            {post.brief && (
                <div className='brief'>{post.brief}</div>
            )}
            {post.description && (
                <div className='description'>{post.description}</div>
            )}
            {post.imageUrl && (
                <div className='image'>
                    <img src={post.imageUrl} alt={post.title} />
                </div>
            )}
            <div className='meta'>
                <span>{new Date(post.createdAt).toLocaleString()}</span>
                {post.user && <span> • {post.user.name}</span>}
            </div>
            <div className='actions'>
                <Button 
                    variant="danger" 
                    onClick={handleDelete}
                    className="mt-2"
                >
                    {t('Sterge')}
                </Button>
            </div>
        </div>
    );
}
