import React, { useEffect } from 'react';
import Spinner from '../../Crud/Spinner';
import { usePostContext } from '../../providers/postStore'; // Corrected import
import Continut from '../../Crud/GetAllPosts/page';
import Card from 'react-bootstrap/Card';
import { useTranslations } from 'next-intl';

export default function Noutati() {
  const { data, loading, getAllPosts, clearData } = usePostContext();
  const t = useTranslations('News');

  useEffect(() => {
    const fetchData = async () => {
      clearData();
      await getAllPosts(0);
    };

    fetchData();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  // const data = allData.posts;
  console.log(data, 'data');

  // Check if data is available before rendering
  if (!data) {
    return null;
  }

  // Sort the data to get the two most recent posts
  let latestPosts = [];
  if (data && Array.isArray(data)) {
    latestPosts = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 2);
  } 

  return (
    <div className="container">
      <br />
      <br />
      <p>{t('Latest in our newsfeed:')}</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        {latestPosts.map((post) => {
          return (
            <Card key={post._id} style={{ marginBottom: '20px' }}>
              <Card.Body>
                <Continut data={post} />
                <p>{new Date(post.date).toLocaleDateString()}</p>
              </Card.Body>
            </Card>
          );
        })}
      </div>
    </div>
  );
}



