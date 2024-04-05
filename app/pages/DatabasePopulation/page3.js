"use client"
import React, { useEffect } from 'react';
import axios from 'axios';


const data = [
     {
        "cropName": "Porumb",
        "nitrogenSupply": 150,
        "nitrogenDemand": 200,
        "pests": ["gândacul de porumb", "molii"],
        "diseases": ["putregaiul gri", "fusarioza"]
      }
      ,
       {
        "cropName": "Grau",
        "nitrogenSupply": 100,
        "nitrogenDemand": 180,
        "pests": ["afide", "nematode"],
        "diseases": ["rugină", "septorioza"]
      }
      ,
       {
        "cropName": "Orz",
        "nitrogenSupply": 120,
        "nitrogenDemand": 150,
        "pests": ["gândacul de cereale", "acarieni"],
        "diseases": ["oidium", "fuzarioza"]
      }
      ,
       {
        "cropName": "Soia",
        "nitrogenSupply": 110,
        "nitrogenDemand": 200,
        "pests": ["molii de soia", "gândacul japonez"],
        "diseases": ["putregaiul rădăcinilor", "căderea tulpinilor"]
      }
      ,
       {
        "cropName": "Rapiță",
        "nitrogenSupply": 130,
        "nitrogenDemand": 170,
        "pests": ["gândacul de rapiță", "molii"],
        "diseases": ["putregaiul alb", "fuzarioza"]
      }
      ,
       {
        "cropName": "Sfecla de zahăr",
        "nitrogenSupply": 80,
        "nitrogenDemand": 150,
        "pests": ["afide", "gândacul de sfeclă"],
        "diseases": ["cercosporioza", "fuzarioza"]
      }
      ,
      {
        "cropName": "Cartofi",
        "nitrogenSupply": 90,
        "nitrogenDemand": 140,
        "pests": ["gândacul de Colorado", "afide"],
        "diseases": ["putregaiul tuberculilor", "mană"]
      }
      ,
       {
        "cropName": "Morcovi",
        "nitrogenSupply": 70,
        "nitrogenDemand": 110,
        "pests": ["molii de morcovi", "gândacul de rădăcină"],
        "diseases": ["putregaiul rădăcinilor", "alternarioza"]
      }
      ,
       {
        "cropName": "Tomate",
        "nitrogenSupply": 100,
        "nitrogenDemand": 160,
        "pests": ["gândacul de Colorado", "afide"],
        "diseases": ["putregaiul cenușiu", "fuzarioza"]
      }
      ,
      {
        "cropName": "Varză",
        "nitrogenSupply": 90,
        "nitrogenDemand": 130,
        "pests": ["molii de varză", "gândacul de varză"],
        "diseases": ["putregaiul negru", "alternarioza"]
      }
      ,
       {
        "cropName": "Vinete",
        "nitrogenSupply": 90,
        "nitrogenDemand": 140,
        "pests": ["afide", "gândacul de Colorado"],
        "diseases": ["putregaiul cenușiu", "fuzarioza"]
      }
      ,
      {
        "cropName": "Ardei",
        "nitrogenSupply": 80,
        "nitrogenDemand": 120,
        "pests": ["afide", "gândacul de Colorado"],
        "diseases": ["putregaiul cenușiu", "alternarioza"]
      }
      ,
       {
        "cropName": "Castraveți",
        "nitrogenSupply": 100,
        "nitrogenDemand": 150,
        "pests": ["afide", "acarieni"],
        "diseases": ["putregaiul cenușiu", "mozaicul castraveților"]
      }
      ,
       {
        "cropName": "Căpșuni",
        "nitrogenSupply": 70,
        "nitrogenDemand": 110,
        "pests": ["afide", "gândacul de fructe"],
        "diseases": ["putregaiul cenușiu", "mucegaiul alb"]
      }
      ,
       {
        "cropName": "Mazăre",
        "nitrogenSupply": 80,
        "nitrogenDemand": 130,
        "pests": ["afide", "gândacul de mazăre"],
        "diseases": ["putregaiul rădăcinilor", "fuzarioza"]
      }
      ,
       {
        "cropName": "Fasole",
        "nitrogenSupply": 90,
        "nitrogenDemand": 140,
        "pests": ["afide", "gândacul de fasole"],
        "diseases": ["putregaiul cenușiu", "antracnoza"]
      }
      ,
       {
        "cropName": "Linte",
        "nitrogenSupply": 70,
        "nitrogenDemand": 110,
        "pests": ["afide", "gândacul de linte"],
        "diseases": ["putregaiul cenușiu", "fuzarioza"]
      }
      ,
      {
        "cropName": "Napi",
        "nitrogenSupply": 80,
        "nitrogenDemand": 130,
        "pests": ["afide", "gândacul de napi"],
        "diseases": ["putregaiul negru", "alternarioza"]
      },
      
      {
        "cropName": "Ridichi",
        "nitrogenSupply": 70,
        "nitrogenDemand": 120,
        "pests": ["afide", "gândacul de rădăcină"],
        "diseases": ["putregaiul rădăcinilor", "fuzarioza"]
      },
      
       {
        "cropName": "Țelină",
        "nitrogenSupply": 90,
        "nitrogenDemand": 140,
        "pests": ["afide", "gândacul de rădăcină"],
        "diseases": ["putregaiul rădăcinilor", "alternarioza"]
      },
];
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0NDIxNjVjMmMxOTcwYWU3NWQ4OWY2OSIsImlhdCI6MTY4MzgzMDUwOSwiZXhwIjoxNjg0MDAzMzA5fQ.i2ABGbSBNicz_6sNayhQ5d5nibDJwVVvG1uKYEBvVmA';

const CropRecommendationComponent = () => {
  useEffect(() => {
    data.forEach((item) => {
      axios.put('http://localhost:5000/api/crops/cropRotation/', item, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(response => {
        console.log(response.data);
        // Update state or perform any other logic with the response data
      })
      .catch(error => {
        console.error(error);
        // Handle errors or update state accordingly
      });
    });
  }, []);

  return (
    // JSX content for your component
    <div>
      {/* Your component JSX */}
    </div>
  );
};

export default CropRecommendationComponent;