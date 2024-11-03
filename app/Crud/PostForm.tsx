"use client"

import { useState } from 'react'
import FileBase from 'react-file-base64';
import { useGlobalContextPost } from '../providers/postStore';
import { useGlobalContext } from '../providers/UserStore';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

function PostForm() {
    const [title, setTitle] = useState('');
    const [brief, setBrief] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const { createPost } = useGlobalContextPost();
    const { data } = useGlobalContext();

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!title || !brief || !description) {
            alert('Ceva lipseste');
            return;
        }
        createPost({ title, brief, description, image, id: '', _id: '', user: '', token: '' }, data.token);
        setTitle('');
        setBrief('');
        setDescription('');
        setImage('');
    };

    return (
        <section className='form'>
            <Form onSubmit={onSubmit}>
                <Form.Group>
                    <Form.Label htmlFor='title'>Titlu:</Form.Label>
                    <Form.Control
                        type='title'
                        name='title'
                        id='title'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <Form.Label htmlFor='text'>Descriere pe scurt:</Form.Label>
                    <Form.Control
                        type='text'
                        name='text'
                        id='text'
                        value={brief}
                        onChange={(e) => setBrief(e.target.value)}
                    />
                    <Form.Label htmlFor='description'>Continut:</Form.Label>
                    <Form.Control
                        type='description'
                        name='description'
                        id='description'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Form.Label htmlFor='image'>Imagine:</Form.Label>
                    <FileBase
                        multiple={false}
                        onDone={({ base64 }: { base64: string }) => setImage(base64)}
                    />
                    <Button type='submit' variant='primary' className='btn-block'>
                        Adauga
                    </Button>
                </Form.Group>
            </Form>
        </section>
    );
}

export default PostForm;