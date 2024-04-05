'use client'
import React, { useEffect } from 'react';
import axios from 'axios';

const dateCulturi = [
    {
        "cropName": "Porumb",
        "cropType": "Cereală",
        "cropVariety": "Iubirea",
        "plantingDate": "2023-04-15",
        "harvestingDate": "2023-10-01",
        "description": "Porumbul este o cultură importantă pentru economia României",
        "soilType": "Argilos",
        "climate": "Temperat",
        "ItShouldNotBeRepeatedForXYears": 3,
        "fertilizers": "NPK",
        "pests": "Larvele de gândac",
        "diseases": "Fuzarioza",
        "nitrogenSupply": 200,
        "nitrogenDemand": 300
      },
      {
        "cropName": "Grau",
        "cropType": "Cereală",
        "cropVariety": "Aurora",
        "plantingDate": "2023-09-15",
        "harvestingDate": "2024-06-01",
        "description": "Grâul este o cereală de bază în România",
        "soilType": "Argilos",
        "climate": "Temperat",
        "ItShouldNotBeRepeatedForXYears": 2,
        "fertilizers": "NPK",
        "pests": "Gândacul de grâu",
        "diseases": "Rugina",
        "nitrogenSupply": 150,
        "nitrogenDemand": 200
   
    },
    {
        "cropName": "Orz",
        "cropType": "Cereală",
        "cropVariety": "Spring",
        "plantingDate": "2023-04-01",
        "harvestingDate": "2023-08-15",
        "description": "Orzul este o cereală versatilă, folosită în special pentru bere",
        "soilType": "Nisipos",
        "climate": "Temperat",
        "ItShouldNotBeRepeatedForXYears": 3,
        "fertilizers": "NPK",
        "pests": "Afide",
        "diseases": "Antracnoza",
        "nitrogenSupply": 120,
        "nitrogenDemand": 180

    },
    {
        "cropName": "Ovăz",
        "cropType": "Cereală",
        "cropVariety": "Albina",
        "plantingDate": "2023-03-20",
        "harvestingDate": "2023-08-10",
        "description": "Ovăzul este cultivat pentru grăunțe și furaj",
        "soilType": "Nisipos",
        "climate": "Temperat rece",
        "ItShouldNotBeRepeatedForXYears": 2,
        "fertilizers": "NPK",
        "pests": "Gândacul de ovăz",
        "diseases": "Făinarea",
        "nitrogenSupply": 140,
        "nitrogenDemand": 200
  
    },
    {
        "cropName": "Secară",
        "cropType": "Cereală",
        "cropVariety": "Rubin",
        "plantingDate": "2023-09-01",
        "harvestingDate": "2024-07-01",
        "description": "Secara este o cereală rezistentă la condiții dificile",
        "soilType": "Argilos",
        "climate": "Temperat rece",
        "ItShouldNotBeRepeatedForXYears": 2,
        "fertilizers": "NPK",
        "pests": "Gândacul de secară",
        "diseases": "Rugina neagră",
        "nitrogenSupply": 150,
        "nitrogenDemand": 200,
        
    },
    {
        "cropName": "Triticale",
        "cropType": "Cereală",
        "cropVariety": "Titus",
        "plantingDate": "2023-09-10",
        "harvestingDate": "2024-06-20",
        "description": "Triticale este o cereală hibridă, o încrucișare între grâu și secară",
        "soilType": "Argilos",
        "climate": "Temperat",
        "ItShouldNotBeRepeatedForXYears": 2,
        "fertilizers": "NPK",
        "pests": "Moliile de cereale",
        "diseases": "Fuzarioza",
        "nitrogenSupply": 160,
        "nitrogenDemand": 210,
    },
    {
        "cropName": "Sorg",
        "cropType": "Cereală",
        "cropVariety": "Milo",
        "plantingDate": "2023-05-15",
        "harvestingDate": "2023-10-15",
        "description": "Sorgul este o cereală rezistentă la secetă, utilizată pentru furaj",
        "soilType": "Nisipos",
        "climate": "Temperat cald",
        "ItShouldNotBeRepeatedForXYears": 3,
        "fertilizers": "NPK",
        "pests": "Larvele de gândac",
        "diseases": "Antracnoza",
        "nitrogenSupply": 180,
        "nitrogenDemand": 240,
    },
    {
        "cropName": "Hrișcă",
        "cropType": "Pseudocereală",
        "cropVariety": "Kasha",
        "plantingDate": "2023-05-01",
        "harvestingDate": "2023-09-15",
        "description": "Hrișca este o pseudocereală folosită pentru făină și furaj",
        "soilType": "Argilos",
        "climate": "Temperat rece",
        "ItShouldNotBeRepeatedForXYears": 2,
        "fertilizers": "NPK",
        "pests": "Afide",
        "diseases": "Mucegaiul cenușiu",
        "nitrogenSupply": 120,
        "nitrogenDemand": 160,
    },
    {
        "cropName": "Quinoa",
        "cropType": "Pseudocereală",
        "cropVariety": "Red Royal",
        "plantingDate": "2023-04-15",
        "harvestingDate": "2023-09-01",
        "description": "Quinoa este o pseudocereală rezistentă, cu un conținut ridicat de proteine",
        "soilType": "Nisipos",
        "climate": "Temperat",
        "ItShouldNotBeRepeatedForXYears": 2,
        "fertilizers": "NPK",
        "pests": "Gândacul de quinoa",
        "diseases": "Fuzarioza",
        "nitrogenSupply": 150,
        "nitrogenDemand": 200
    },
    {"cropName": "Mazăre",
        "cropType": "Leguminoasă",
        "cropVariety": "Dacia",
        "plantingDate": "2023-03-15",
        "harvestingDate": "2023-06-15",
        "description": "Mazărea este o leguminoasă folosită pentru boabe și furaj",
        "soilType": "Argilos",
        "climate": "Temperat",
        "ItShouldNotBeRepeatedForXYears": 3,
        "fertilizers": "NPK",
        "pests": "Afide",
        "diseases": "Mucegaiul cenușiu",
        "nitrogenSupply": 120,
        "nitrogenDemand": 160,
},
{
    "cropName": "Soia",
    "cropType": "Leguminoasă",
    "cropVariety": "Pioneer",
    "plantingDate": "2023-05-01",
    "harvestingDate": "2023-10-10",
    "description": "Soia este o cultură importantă pentru producția de proteine vegetale",
    "soilType": "Argilos",
    "climate": "Temperat",
    "ItShouldNotBeRepeatedForXYears": 2,
    "fertilizers": "NPK",
    "pests": "Gândacul de soia",
    "diseases": "Fuzarioza",
    "nitrogenSupply": 180,
    "nitrogenDemand": 250,
},
{
    "cropName": "Mazăre",
    "cropType": "Leguminoasă",
    "cropVariety": "Sweet",
    "plantingDate": "2023-04-01",
    "harvestingDate": "2023-07-15",
    "description": "Mazărea este o cultură folosită atât pentru consum uman, cât și pentru furaj",
    "soilType": "Argilos",
    "climate": "Temperat",
    "ItShouldNotBeRepeatedForXYears": 2,
    "fertilizers": "NPK",
    "pests": "Afide",
    "diseases": "Fuzarioza",
    "nitrogenSupply": 120,
    "nitrogenDemand": 180,
},
{
    "cropName": "Năut",
    "cropType": "Leguminoasă",
    "cropVariety": "Chickpea",
    "plantingDate": "2023-04-15",
    "harvestingDate": "2023-09-01",
    "description": "Năutul este o leguminoasă nutritivă, folosită în diverse bucătării ale lumii",
    "soilType": "Nisipos",
    "climate": "Temperat cald",
    "ItShouldNotBeRepeatedForXYears": 2,
    "fertilizers": "NPK",
    "pests": "Larvele de gândac",
    "diseases": "Fuzarioza",
    "nitrogenSupply": 150,
    "nitrogenDemand": 200,
},
{
    "cropName": "Linte",
    "cropType": "Leguminoasă",
    "cropVariety": "Green",
    "plantingDate": "2023-04-01",
    "harvestingDate": "2023-08-20",
    "description": "Lintea este o sursă excelentă de proteine și fibre alimentare",
    "soilType": "Argilos",
    "climate": "Temperat",
    "ItShouldNotBeRepeatedForXYears": 2,
    "fertilizers": "NPK",
    "pests": "Afide",
    "diseases": "Fuzarioza",
    "nitrogenSupply": 140,
    "nitrogenDemand": 180,
}

];

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0M2ZiMTkzZjk5YWRiYTQyY2UyMDQ0MSIsImlhdCI6MTY4NDA2NTc4NiwiZXhwIjoxNjg0MjM4NTg2fQ.dLdu3dhrI2El7srV8q7wWT94PCVZ0kdWo3JiTAjsh5A';

const PostareCultura = () => {
  useEffect(() => {
    dateCulturi.forEach((cultura) => {
      axios.post('http://localhost:5000/api/crops/', cultura, {
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

export default PostareCultura;

