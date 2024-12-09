import React, { useEffect } from 'react';
import Spinner from '../Crud/Spinner';
import { usePostContext } from '../providers/postStore';
import { PostContent } from '../components/PostContent';
import Card from 'react-bootstrap/Card';
import { useTranslations } from 'next-intl';
import { Post } from '../types/api';

export default function Noutati() {
  const { data, loading, getAllPosts, clearData } = usePostContext();
  const t = useTranslations('News');

  useEffect(() => {
    const fetchData = async () => {
      try {
        clearData();
        await getAllPosts(0);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  // Use actual data if available, otherwise don't show any posts
  const displayPosts = (data && Array.isArray(data) && data.length > 0) 
    ? [...data].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      }).slice(0, 2)
    : [];

  return (
    <div className="container">
      <br />
      <br />
      <h3 className="text-2xl font-bold mb-6">{t('Latest in our newsfeed:')}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayPosts.length > 0 ? (
          displayPosts.map((post: Post) => (
            <Card key={post.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <Card.Body>
                <PostContent data={post} />
              </Card.Body>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center py-8 text-gray-600">
            {t('No news available at the moment')}
          </div>
        )}
      </div>
    </div>
  );
}
