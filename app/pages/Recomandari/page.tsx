"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobalContextCrop } from "../../Context/culturaStore";
import { useGlobalContext } from "../../Context/UserStore";
import useRecommendations from "./recomandari";
import { Alert, Container, Card, Table } from "react-bootstrap";
import React from "react";


function RotationItem({ item }) {
  const recommendations = useRecommendations(item.nitrogenBalance, item.crop);

  return (
    <tr>
      <th>{item.division}</th>
      <td>{item.cropName}</td>
      <td>{item.plantingDate.toString().slice(0, 10)}</td>
      <td>{item.harvestingDate.toString().slice(0, 10)}</td>
      <td>{item.divisionSize}</td>
      <td>{item.nitrogenBalance}</td>
      <td>
        <ul>
          {recommendations.map((recommendation, index) => (
            <li key={index}>{recommendation}</li>
          ))}
        </ul>
      </td>
    </tr>
  );
}

function RecommendationDashboard() {
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState("");
  const { data } = useGlobalContext();
  const token = data?.token; 
  const { getCropRotation, cropRotation } = useGlobalContextCrop();
  const navigate = useRouter();

  useEffect(() => {
    if (isError) {
      console.error(message);
    }
    if (!data) {
      navigate.replace('/login');
    } else {
      getCropRotation(token);
    }
  }, [token, isError, message, data, navigate]);

  if (isError) {
    return <Alert variant="danger">{message}</Alert>;
  }

  if (data?.rol === "Fermier") {
    return (
      <Container className="mt-4 mb-4">
        <Card className="p-4">
          <section className="heading mb-3">
            <h1>Salut {data && data.name}</h1>
          </section>
          <section className="content">
            {Array.isArray(cropRotation) && (
              <div className="rotation mt-4 mb-4">
                <h3>Recomandări bazate pe rotația culturilor:</h3>
                {cropRotation.map((rotation, index) => (
                  <div key={index}>
                    <h2>{rotation.rotationName}</h2>
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>Parcela</th>
                          <th>Recoltă</th>
                          <th>Data de plantare</th>
                          <th>Data de recoltare</th>
                          <th>Dimensiunea parcela</th>
                          <th>Balans azot</th>
                          <th>Recomandări</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rotation.rotationPlan.map((plan, planIndex) => (
                          <React.Fragment key={planIndex}>
                            <tr>
                              <th colSpan="7">Anul: {plan.year}</th>
                            </tr>
                            {plan.rotationItems.map((item, itemIndex) => (
                              <RotationItem key={itemIndex} item={item} />
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ))}
              </div>
            )}
          </section>
        </Card>
      </Container>
    );
  }

  return null;
}

export default RecommendationDashboard;