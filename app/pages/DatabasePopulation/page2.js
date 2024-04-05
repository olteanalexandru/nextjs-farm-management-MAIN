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

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0NDIxNjVjMmMxOTcwYWU3NWQ4OWY2OSIsImlhdCI6MTY4MzgzMDUwOSwiZXhwIjoxNjg0MDAzMzA5fQ.i2ABGbSBNicz_6sNayhQ5d5nibDJwVVvG1uKYEBvVmA';

const PostComponent = () => {
  useEffect(() => {
    postData.forEach((post) => {
      axios.post('http://localhost:5000/api/posts/', post, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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