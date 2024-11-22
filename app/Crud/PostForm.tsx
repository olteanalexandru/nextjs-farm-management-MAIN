"use client";

import { useState, useEffect } from 'react';
import FileBase from 'react-file-base64';
import { usePostContext } from '../providers/postStore'; 
import { Form, Button } from 'react-bootstrap';
import { Post } from '../types/api';

interface PostFormProps {
    post?: Post;
    onCancel?: () => void;
    onSuccess?: () => void;
}

function PostForm({ post, onCancel, onSuccess }: PostFormProps) {
    const [formData, setFormData] = useState({
        title: '',
        brief: '',
        description: '',
        image: ''
    });
    const { createPost, updatePost } = usePostContext();

    useEffect(() => {
        if (post) {
            setFormData({
                title: post.title,
                brief: post.brief || '',
                description: post.description || '',
                image: post.image || ''
            });
        }
    }, [post]);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.title) {
            alert('Title is required');
            return;
        }

        try {
            if (post) {
                await updatePost(post.id, formData);
            } else {
                await createPost(formData);
            }
            setFormData({ title: '', brief: '', description: '', image: '' });
            onSuccess?.();
        } catch (error) {
            console.error('Error saving post:', error);
        }
    };

    return (
        <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Brief</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.brief}
                    onChange={(e) => setFormData({...formData, brief: e.target.value})}
                />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Image</Form.Label>
                <div>
                    <FileBase
                        multiple={false}
                        onDone={({ base64 }: { base64: string }) => 
                            setFormData({...formData, image: base64})}
                    />
                </div>
            </Form.Group>
            <div className="d-flex gap-2">
                <Button type="submit">
                    {post ? 'Update' : 'Create'} Post
                </Button>
                {onCancel && (
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
            </div>
        </Form>
    );
}

export default PostForm;