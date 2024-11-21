import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_KEY = 'YOUR_API_KEY';
const CITY = 'Cluj Napoca,RO';
const DAYS = 7;
const API_ENDPOINT = `http://api.openweathermap.org/data/2.5/forecast/daily?q=${CITY}&cnt=${DAYS}&appid=${API_KEY}&units=metric`;

export interface WeatherData {
  date: string;
  temperature: number;
  description: string;
  precipitation: number;
}

const WeatherTable: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);

  useEffect(() => {
    axios.get(API_ENDPOINT)
      .then(response => {
        const data = response.data;
        const weatherData: WeatherData[] = data.list.map((day: any) => ({
          date: new Date(day.dt * 1000).toLocaleDateString(),
          temperature: day.temp.day,
          description: day.weather[0].description,
          precipitation: day.rain ? day.rain : 0
        }));
        setWeatherData(weatherData);
      })
      .catch(error => console.error(error));
  }, []);

  return (
    <div className="weather-table">
      <h2>Weather Forecast</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Temperature (°C)</th>
            <th>Description</th>
            <th>Precipitation (mm)</th>
          </tr>
        </thead>
        <tbody>
          {weatherData.map((day, index) => (
            <tr key={index}>
              <td>{day.date}</td>
              <td>{day.temperature.toFixed(1)}</td>
              <td>{day.description}</td>
              <td>{day.precipitation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeatherTable;
