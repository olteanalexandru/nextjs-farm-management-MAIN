"use client";
import Image from 'next/image'
import Link from 'next/link'
import classNames from 'classnames';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Noutati from './pages/News/News';



export default function Home() {

  const titleClasses = classNames('h1', 'font-weight-bold', 'mb-4','align-items-center', 'justify-content-center');


  return (
    <Container >

      <h2 className={titleClasses}>
        Welcome to the main page of the agricultural platform!
      </h2>
      <div className="d-flex justify-content-center">
        {/* no border */}
        <Card className='noBorders' style={{
          border: 'none'
        }} >
          <Card.Body>
            <Card.Text  className='textFormating'>
               By using this platform, you will be able to easily plan an efficient crop rotation,
              which will help maintain healthy soil and achieve better yields. In addition, you will
              receive personalized recommendations for each crop, based on local conditions, soil history,
              and your preferences.

                To use this platform, you will need to create an account and provide information about your
              agricultural land, including soil type, climatic zone, previous crops, and other relevant details.
              Then, the platform will use APIs to obtain updated information about weather, soil, and other factors
              that may affect production.

                Based on this information, the platform will generate a personalized crop rotation plan, taking into
              account the requirements of each crop, soil type, and other relevant factors. You will also receive
              recommendations for soil preparation, plant nutrition, and pest and disease control.

                Our platform uses the latest technologies and updated data to provide you with the best recommendations
              and to help you achieve the best results on your farm. If you have any questions or issues, feel free
              to contact us through the platform.
            </Card.Text>
 
          </Card.Body>
        </Card>
      </div>
      <Noutati />


      
    </Container>
  );
}
