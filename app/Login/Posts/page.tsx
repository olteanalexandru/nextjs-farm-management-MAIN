"use client";
import React, { useEffect, useState } from 'react';
import { usePostContext } from '../../providers/postStore';
import Spinner from '../../Crud/Spinner';
import { UserInfos } from '../../components/UserInfos';
import { Container, Card, Alert } from 'react-bootstrap';
import PostForm from '../../Crud/PostForm';
import PostItem from '../../Crud/PostItem';
import { useTranslations } from 'next-intl';

function Postari() {
    const { data, loading, error, getAllPosts, clearData } = usePostContext();
    const t = useTranslations('Postari');
    const [page, setPage] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                clearData();
                await getAllPosts(page);
            } catch (error) {
                console.error('Error fetching posts:', error);
            }
        };

        fetchData();
    }, [page]);

    const loadMore = async () => {
        setPage(prev => prev + 1);
    };

    if (loading && data.length === 0) {
        return <Spinner />;
    }

    return (
        <div className="posts-page">
            <Container className="mb-4">
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
                <h1 className="mb-4">{t('Postari')}</h1>
                
                {error && (
                    <Alert variant="danger" className="mb-4">
                        {error}
                    </Alert>
                )}

                {data.length === 0 ? (
                    <Alert variant="info">
                        {t('Nu exista postari')}
                    </Alert>
                ) : (
                    <>
                        <div className="posts-grid">
                            {data.map((post) => (
                                <PostItem key={post.id} post={post} />
                            ))}
                        </div>
                        
                        {!error && data.length >= 5 && (
                            <div className="text-center mt-4">
                                <button 
                                    className="btn btn-primary"
                                    onClick={loadMore}
                                    disabled={loading}
                                >
                                    {loading ? t('Se incarca...') : t('Incarca mai mult')}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </Container>
        </div>
    );
}

export default Postari;
