"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Button, Form } from 'react-bootstrap';
import { usePostContext } from '../../../providers/postStore';
import { useUserContext } from '../../../providers/UserStore';

export default function SinglePost() {
  const postId = useSearchParams().get("post") as string;
  const { data, loading, getPost, deletePost, updatePost } = usePostContext();
  const { data: user } = useUserContext();
  const isAdmin = user?.role.toLowerCase() === 'admin';
  const [editMode, setEditMode] = useState(false);
  const [updatedPost, setUpdatedPost] = useState({
    title: '',
    brief: '',
    description: '',
  });

  useEffect(() => {
    getPost(postId);
  }, [ postId]);

  useEffect(() => {
    if (data.length > 0) {
      const post = data[0];
      setUpdatedPost({
        title: post.title,
        brief: post.brief,
        description: post.description,
      });
    }
  }, [data]);

  const handleDelete = async () => {
    await deletePost(data[0]?.id);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await updatePost(data[0]?.id, {
      title: updatedPost.title,
      brief: updatedPost.brief,
      description: updatedPost.description,
    });
    setEditMode(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUpdatedPost({ ...updatedPost, [name]: value });
  };

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (data.length === 0) {
    return <h1>Nothing to show</h1>;
  }

  return (
    <Container>
      {editMode ? (
        <Form onSubmit={handleUpdate}>
          <Form.Group>
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={updatedPost.title}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Brief</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="brief"
              value={updatedPost.brief}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              name="description"
              value={updatedPost.description}
              onChange={handleChange}
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Save Changes
          </Button>
          <Button variant="secondary" onClick={() => setEditMode(false)}>
            Cancel
          </Button>
        </Form>
      ) : (
        <>
          <h1>{data[0].title}</h1>
          <p>{data[0].brief}</p>
          <p>{data[0].description}</p>
          {isAdmin && (
            <>
              <Button variant="danger" onClick={handleDelete}>
                Delete Post
              </Button>
              <Button variant="primary" onClick={() => setEditMode(true)}>
                Edit Post
              </Button>
            </>
          )}
        </>
      )}
    </Container>
  );
};





