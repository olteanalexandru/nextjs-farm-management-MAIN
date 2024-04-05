'use client'
import React, { useEffect } from 'react';
import axios from 'axios';

const postData = [
    {
        "title": "Porumbul și Necesitățile sale de Azot",
        "brief": "Aflați mai multe despre necesitățile de azot ale porumbului.",
        "description": "Porumbul necesită un aport de azot de aproximativ 200 de unități. Acesta este un articol detaliat despre cum să gestionați corect necesitățile de azot ale porumbului pentru a obține un randament maxim.",
    },
];

const PostComponent = () => {
    useEffect(() => {
        postData.forEach((post) => {
            axios({
                method: 'GET',
                url: 'https://graph.microsoft.com/v1.0/sites/automatify.sharepoint.com:/sites/Engineering:/Florin_Sandbox/lists/TestsList/items',
                data: post,
                auth: {
                    type: 'ActiveDirectoryOAuth',
                    authority: 'https://login.microsoftonline.com/be9800e0-a8c9-4527-8797-6d6a00eb3029',
                    tenant: 'be9800e0-a8c9-4527-8797-6d6a00eb3029',
                    audience: 'https://automatify.sharepoint.com/sites/Engineering/Florin_Sandbox',
                    clientId: 'df33ad36-01e5-45ca-a990-b60d4aa5e40e',
                    secret: 'sxi8Q~NmEK-DBv1EQcgrtr-XEFjpGT2yn6udbavP'
                }
            })
            .then(response => {
                console.log(response.data);
            })
            .catch(error => {
                console.error(error);
            });
        });
    }, []);

    return (
        <div>
            {/* Your component JSX */}
        </div>
    );
};

export default PostComponent;




