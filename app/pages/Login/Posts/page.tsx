"use client";
import React, { useEffect } from 'react';
import { usePostContext } from '../../../providers/postStore'; // Corrected import
import Spinner from '../../../Crud/Spinner';
import { UserInfos } from '../../../components/UserInfos';
import { Container, Card, Button } from 'react-bootstrap';
import PostForm from '../../../Crud/PostForm';
import Continut from '../../../Crud/GetAllPosts/page';
import { useTranslations } from 'next-intl';

function Postari() {
    const { data, loading, getAllPosts, deletePost, clearData } = usePostContext();
    const t = useTranslations('Postari');

    useEffect(() => {
        const fetchData = async () => {
            clearData();
            await getAllPosts(0);
        };

        fetchData();
    }, []);

    return (
        <div>
            <Container>
                <Card>
                    <Card.Header>
                        <UserInfos />
                    </Card.Header>
                    <Card.Body>
                        <PostForm />
                    </Card.Body>
                </Card>
            </Container>
            <Container>
            </Container>

            <div>
                <h1>
                    {t('Postari')}
                </h1>
                <ul>
                    {Array.isArray(data) && data.map((post) => (
                        <li key={post.id}>
                            <h2>{post.title}</h2>
                            <p>{post.brief}</p>
                            <Button variant="danger" onClick={() => deletePost(post.id)}>
                                {t('Sterge')}
                            </Button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default Postari;
