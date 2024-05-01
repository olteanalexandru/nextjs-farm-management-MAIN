"use client"
import {useEffect, useState } from 'react';
import { Container, Card, Row, Col, Table } from 'react-bootstrap';
import { useGlobalContext } from '../../../Context/UserStore';
import { useGlobalContextCrop } from '../../../Context/culturaStore';
import Continut from '../../../Crud/GetAllInRotatie/page';
import CropRotationForm from './RotatieForm';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Label } from 'recharts';
import {  Typography } from 'antd';
const { Title } = Typography;
const colors = ['8884d8', '82ca9d', 'ffc658', 'a4de6c', 'd0ed57', 'ffc658', '00c49f', 'ff7300', 'ff8042'];

function RotatieDashboard() {
  const { crops,
    selections,
    isLoading,
    isCropRotationLoading,
     getCropRotation,
     cropRotation: cropRotationObj,
      updateNitrogenBalanceAndRegenerateRotation,
       getAllCrops,
        updateDivisionSizeAndRedistribute,
        loadingStateAtTheMoment
       } = useGlobalContextCrop();
  const { data: userData } = useGlobalContext();
  const [divisionSizeValues, setDivisionSizeValues] = useState([]);
const [nitrogenBalanceValues, setNitrogenBalanceValues] = useState([]);

useEffect(() => {
  const fetchData = async () => {
    try {
      // loadingStateAtTheMoment()
      await getAllCrops()
       await getCropRotation()
    } catch (error) {
      console.error(error);
    }
  };

  fetchData();
}, [
  userData
]);

console.log(
  `cropRotation: ${JSON.stringify(cropRotationObj)}`
)




let cropRotation = cropRotationObj 
  if ( isCropRotationLoading) {
    return <div>Loading Rotation...</div>;
  } 

  if (isLoading) {
    return <div>Loading Crops...</div>;
  }
  


const getCropsRepeatedBySelection = (crops, selections) => {
  let uniqueId = 0; // Initialize a unique ID counter

  return selections
    .map(selection => ({
      count: selection.selectionCount,
      cropId: selection.crop
    }))
    .flatMap(({ count, cropId }) => {
      const crop = crops.find(crop => crop._id === cropId);
      // Create an array with unique objects containing the crop and a unique ID
      return Array.from({ length: count }, () => ({ ...crop, uniqueId: uniqueId++ }));
    });
};

  const filteredCrops = getCropsRepeatedBySelection(crops, selections);

  const prepareChartData = (rotationPlan, numberOfDivisions) => {
    let chartData = [];
    let previousYearData = {};
    rotationPlan.forEach(yearPlan => {
      let yearData = { year: yearPlan.year };
      yearPlan.rotationItems.forEach(item => {
        yearData[`Parcela${item.division}`] = item.nitrogenBalance;
      });

      // Add missing divisions from the previous year
      for (let division = 1; division <= numberOfDivisions; division++) {
        const key = `Parcela ${division}`;
        if (!(key in yearData) && (key in previousYearData)) {
          yearData[key] = previousYearData[key];
        }
      }
      chartData.push(yearData);
      previousYearData = yearData;
    });
    return chartData;
  };

  if (userData?.role?.toLowerCase() === 'farmer') {
    return (
      <>
        <Container style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <Card style={{ padding: '2rem' }}>
            <section className="heading" style={{ marginBottom: '1rem' }}>
              <h1>Salut {userData && userData.name}</h1>
            </section>
            <section className="content">
              {crops?.length > 0 ? (
                <div className="crops">
                  <CropRotationForm filteredCrops={filteredCrops}  />
                  <h3>Ai selectat pentru rotatie:</h3>

                  {filteredCrops.length === 0 ? (
                    <p>Nu ai selectat nicio cerere</p>
                  ) : (
                    <Row>
                    {filteredCrops.map((crop , index) => (
                        <Col key={index} xs={12} sm={6} md={4}>
                            <Continut crop={crop} />
                        </Col>
                    ))}
                </Row>
                  )}
                </div>
              ) : (
                <h3>Nicio cultura selectata</h3>
              )}

{cropRotation && cropRotation.data && (
                <div className="rotation" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                  <h3>Rotatia generata:</h3>
                  {cropRotation.data.map((rotation, index) => {
                    const chartData = prepareChartData(rotation.rotationPlan, rotation.numberOfDivisions);
                    return (
                      <Row key={index}>
                        <Col xs={12} md={6}>
                          <h2>{rotation.rotationName}</h2>
                          
                          <p>Field size: {rotation.fieldSize}</p>
                          <p>Number of divisions: {rotation.numberOfDivisions}</p>
                          {rotation.rotationPlan.map((plan, planIndex) => (
                            <div key={planIndex}>
                              <h3>Year: {plan.year}</h3>
                              <Table striped bordered hover>
                                <thead>
                                  <tr>
                                    <th>Parcel number</th>
                                    <th>Crop</th>
                                    <th>Planting date</th>
                                    <th>Harvesting date</th>
                                    <th>Parcel size</th>
                                    <th>Nitrogen balance per hectare</th>
                                    <th>Total nitrogen</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {plan.rotationItems.map((item, itemIndex) => (
                                    <tr key={itemIndex}>
                                      
                                      <td><b>{item.division}</b></td>
                                      <td>{item.cropName}</td>
                                      <td>{item.plantingDate.toString().slice(0, 10)}</td>
                                      <td>{item.harvestingDate.toString().slice(0, 10)}</td>
                                      <td>{item.divisionSize}
                                      {planIndex === 0 && ( // Show input only in the first year
                                        <input type="text" 
                                        placeholder="Modify size" 
                                        value={divisionSizeValues[itemIndex] || ''} 
                                        onChange={e => {
                                          let newDivisionSizeValues = [...divisionSizeValues];
                                          newDivisionSizeValues[itemIndex] = e.target.value;
                                          setDivisionSizeValues(newDivisionSizeValues);
                                        }}
                                        onBlur={e => {
                                          if(isNaN(parseFloat(e.target.value))) {
                                            alert("Not a number");
                                          }
                                          else {
                                            let newDivisionSizeValues = [...divisionSizeValues];
                                            newDivisionSizeValues[itemIndex] = parseFloat(e.target.value);
                                            setDivisionSizeValues(newDivisionSizeValues);
                                            let data = {
                                              rotationName: rotation.rotationName,
                                              division: item.division,
                                              newDivisionSize: parseFloat(e.target.value),
                                            };
                                            updateDivisionSizeAndRedistribute(data);
                                          }
                                        }}
                                      />
                                      )}
                                      </td>
                                      <td>{item.nitrogenBalance} 
                                      <input type="text" 
                                        placeholder="Supplemental nitrogen" 
                                        value={nitrogenBalanceValues[itemIndex] || ''} 
                                        onChange={e => {
                                          let newNitrogenBalanceValues = [...nitrogenBalanceValues];
                                          newNitrogenBalanceValues[itemIndex] = e.target.value;
                                          setNitrogenBalanceValues(newNitrogenBalanceValues);
                                        }} 
                                        onBlur={e => {
                                          if(isNaN(parseFloat(e.target.value))) {
                                            alert("Not a number");
                                          }
                                          else {
                                            let newNitrogenBalanceValues = [...nitrogenBalanceValues];
                                            newNitrogenBalanceValues[itemIndex] = parseFloat(e.target.value);
                                            setNitrogenBalanceValues(newNitrogenBalanceValues);
                                            let data = {
                                              rotationName: rotation.rotationName,
                                              year: plan.year,
                                              division: item.division,
                                              nitrogenBalance: parseFloat(e.target.value),
                                            };
                                            updateNitrogenBalanceAndRegenerateRotation(data);
                                          }
                                        }}
                                      />
                                      </td>
                                      <td>{(item.nitrogenBalance * (item.divisionSize / 10000)).toFixed(2)} </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          ))}
                        </Col>
                        <Col xs={24} md={12}>
                          <Title level={3}>Annual Evolution</Title>
                          <ResponsiveContainer width="100%" height={500}>
                            <LineChart
                              width={500}
                              height={300}
                              data={chartData}
                              margin={{
                                top: 5, right: 30, left: 20, bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" padding={{ left: 30, right: 30 }}>
                                <Label value="Year" offset={-5} position="insideBottom" />
                              </XAxis>
                              <YAxis label={{ value: 'Nitrogen balance', angle: -90, position: 'insideLeft' }} />
                              <Tooltip />
                              <Legend />

                              {chartData[0] && Object.keys(chartData[0]).map((key, i) => {
                                if (key !== 'year') {
                                  return (
                                    <Line type="monotone" dataKey={key} stroke={`#${colors[i % colors.length]}`} activeDot={{ r: 8 }} />
                                  );
                                }
                              })}
                            </LineChart>
                          </ResponsiveContainer>
                        </Col>
                      </Row>
                    );
                  })}
                </div>
              )}
            </section>
          </Card>
        </Container>
      </>
    );
  } else {
    return null;
  }
}
export default RotatieDashboard;
                                              
