"use client"
import {useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Card, Row, Col, Table } from 'react-bootstrap';
import LinkParola from '../Elements/page';
import { useGlobalContext } from '../../../Context/UserStore';
import { useGlobalContextCrop } from '../../../Context/culturaStore';
import Continut from '../../../Crud/GetAllInRotatie/page';
import CropRotationForm from './RotatieForm';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Label } from 'recharts';
import {  Typography } from 'antd';
import { useUser } from '@auth0/nextjs-auth0/client';

const { Title } = Typography;

const colors = ['8884d8', '82ca9d', 'ffc658', 'a4de6c', 'd0ed57', 'ffc658', '00c49f', 'ff7300', 'ff8042'];

function RotatieDashboard() {
  const navigate = useRouter();
  const { crops,selections, isError, message, getCropRotation, cropRotation, updateNitrogenBalanceAndRegenerateRotation, getAllCrops, updateDivisionSizeAndRedistribute } = useGlobalContextCrop();
  const { data: userData } = useGlobalContext();




  const [activeIndex, setActiveIndex] = useState(null);
  const [divisionSizeValues, setDivisionSizeValues] = useState([]);
const [nitrogenBalanceValues, setNitrogenBalanceValues] = useState([]);
const { user, error: authError, isLoading: isUserLoading  } = useUser();
  useEffect(() => {
    if (isError) {
      console.log(message);
    }
 
    getCropRotation();
    getAllCrops();

    return () => {
      setActiveIndex(null);
    };
  }, [ isError, message]);

  let filteredCrops = crops.filter((crop) => 
    selections.some((selection) => 
      selection.user === user.sub && selection.crop === crop._id
    )
  );
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

  if (userData.role.toLowerCase() === 'farmer') {
    return (
      <>
        <Container style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <Card style={{ padding: '2rem' }}>
            <section className="heading" style={{ marginBottom: '1rem' }}>
              <h1>Salut {userData && userData.name}</h1>
            </section>
            <section className="content">
              {crops.length > 0 ? (
                <div className="crops">
                  <CropRotationForm filteredCrops={filteredCrops}  />
                  <h3>Ai selectat pentru rotatie:</h3>

                  {filteredCrops.length === 0 ? (
                    <p>Nu ai selectat nicio cerere</p>
                  ) : (
                    <Row>
                    {filteredCrops.map((crop) => (
                        <Col key={crop._id} xs={12} sm={6} md={4}>
                            <Continut crop={crop} />
                        </Col>
                    ))}
                </Row>
                  )}
                </div>
              ) : (
                <h3>Nicio cultura selectata</h3>
              )}

              { cropRotation.length > 0 &&  (
                <div className="rotation" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                  <h3>Rotatia generata:</h3>
                  {cropRotation.map((rotation, index) => {
                    const chartData = prepareChartData(rotation.rotationPlan, rotation.numberOfDivisions);
                    return (
                      <Row key={index}>
                        <Col xs={12} md={6}>
                          <h2>{rotation.rotationName}</h2>
                          
                          <p>Field size: {rotation.fieldSize}</p>
                          <p>Number of divisions: {rotation.numberOfDivisions}</p>
                          {rotation.rotationPlan.map((plan, planIndex) => (
                            <div key={planIndex}>
                              <h3>Anul: {plan.year}</h3>
                              <Table striped bordered hover>
                                <thead>
                                  <tr>
                                    <th>Nr. Parcelă</th>
                                    <th>Recoltă</th>
                                    <th>Data de plantare</th>
                                    <th>Data de recoltare</th>
                                    <th>Dimensiune parcelă</th>
                                    <th>Balans azot per hectar</th>
                                    <th>Azot total</th>
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
                                        placeholder="Modifica dimensiunea" 
                                        value={divisionSizeValues[itemIndex] || ''} 
                                        onChange={e => {
                                          let newDivisionSizeValues = [...divisionSizeValues];
                                          newDivisionSizeValues[itemIndex] = e.target.value;
                                          setDivisionSizeValues(newDivisionSizeValues);
                                        }}
                                        onBlur={e => {
                                          if(isNaN(e.target.value)) {
                                            alert("Nu este numar");
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
                                            updateDivisionSizeAndRedistribute(  data);
                                          }
                                        }}
                                      />
                                      )}
                                      </td>
                                      <td>{item.nitrogenBalance} 
                                                                            <input type="text" 
                                        placeholder="Azot suplimentat" 
                                        value={nitrogenBalanceValues[itemIndex] || ''} 
                                        onChange={e => {
                                          let newNitrogenBalanceValues = [...nitrogenBalanceValues];
                                          newNitrogenBalanceValues[itemIndex] = e.target.value;
                                          setNitrogenBalanceValues(newNitrogenBalanceValues);
                                        }} 
                                        onBlur={e => {
                                          if(isNaN(e.target.value)) {
                                            alert("Nu este numar");
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
                                            updateNitrogenBalanceAndRegenerateRotation(  data);
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
                          <Title level={3}>Evolutia Anuala</Title>
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
                                              
