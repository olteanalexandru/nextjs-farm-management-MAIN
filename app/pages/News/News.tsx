"use client"
import React from 'react';
import Spinner from '../../Crud/Spinner';
import { useGlobalContextPost } from '../../Context/postStore';
import Continut from '../../Crud/GetAllPosts/page';
import { useEffect } from 'react';
import Card from 'react-bootstrap/Card'; // Import Card from react-bootstrap

export default function Noutati() {
  const { data, loading, getAllPosts, clearData } = useGlobalContextPost();
  
  useEffect(() => {
    clearData();
    getAllPosts(0);
  }, []);

  if (loading) {
    return <Spinner />;
  }

  // Sort the data to get the two most recent posts
  const latestPosts = [...data].sort((a, b) => b.date - a.date).slice(0, 2);

  // If there are no posts, return null
  if (latestPosts.length === 0) {
    return null;
  }

  return (
    
    <div className="container" >
        <br />
        <br />
        <p>
          Latest in our newsfeed:
        </p>
   
      {/* <h4 className="mb-4">News</h4> */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        {latestPosts.map((post) => {
          return (
            <Card key={post._id} style={{  marginBottom: '20px' }}>
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