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

export default const WeatherTable: React.FC = () => {
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
};

