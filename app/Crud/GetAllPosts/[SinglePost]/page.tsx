"use client"
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Button, Form } from 'react-bootstrap';
import { useGlobalContextPost } from '../../../Context/postStore';
import { useGlobalContext } from '../../../Context/UserStore';


// interface SinglePostProps {
//   postId: string;
// }

export default function SinglePost() {
  const postId = useSearchParams().get("post") as string;
  const { data: allData, loading, getPost, deletePost, updatePost } = useGlobalContextPost();
  const data = allData?.posts;
  const { data: user } = useGlobalContext();
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
    if (data) {
      setUpdatedPost({
        title: data.title,
        brief: data.brief,
        description: data.description,
      });
    }
  }, [data]);

  const handleDelete = async () => {
    await deletePost(data?._id);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await updatePost(data?._id, {
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

  if (!data) {
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
          <h1>{data.title}</h1>
          <p>{data.brief}</p>
          <p>{data.description}</p>
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

 



