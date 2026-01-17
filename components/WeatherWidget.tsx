import React, { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, CloudSnow, Wind, Droplets, Minimize, Maximize, X } from 'lucide-react';

interface WeatherWidgetProps {
  isActive: boolean;
  locationQuery: string; // "London", "current", etc.
  onClose: () => void;
  onDataLoaded: (description: string) => void;
}

interface WeatherData {
  temp: number;
  conditionCode: number;
  windSpeed: number;
  humidity: number;
  city: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ isActive, locationQuery, onClose, onDataLoaded }) => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (isActive && locationQuery) {
      fetchWeather(locationQuery);
    }
  }, [isActive, locationQuery]);

  const fetchWeather = async (query: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      let lat = 0;
      let lon = 0;
      let cityName = query;

      // 1. Get Coordinates
      if (query.toLowerCase() === 'current' || query === '') {
        try {
            const pos: any = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
            cityName = "Local Sector";
        } catch (e) {
            throw new Error("Geolocation Failed");
        }
      } else {
        // Geocoding API
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("Location not found");
        }
        lat = geoData.results[0].latitude;
        lon = geoData.results[0].longitude;
        cityName = geoData.results[0].name;
      }

      // 2. Get Weather
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh`);
      const weatherData = await weatherRes.json();
      const current = weatherData.current;

      const result = {
        temp: current.temperature_2m,
        conditionCode: current.weather_code,
        windSpeed: current.wind_speed_10m,
        humidity: current.relative_humidity_2m,
        city: cityName
      };

      setData(result);
      onDataLoaded(`Atmospheric sensor active. ${cityName} is currently ${result.temp} degrees.`);
    } catch (err) {
      console.error(err);
      setError("SENSOR ERROR");
      onDataLoaded("Atmospheric sensors failing. Unable to retrieve data.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get Icon and Description based on WMO code
  const getWeatherVisuals = (code: number) => {
    // 0: Clear sky
    // 1, 2, 3: Mainly clear, partly cloudy, and overcast
    // 45, 48: Fog
    // 51, 53, 55: Drizzle
    // 61, 63, 65: Rain
    // 71, 73, 75: Snow
    // 95: Thunderstorm
    
    if (code === 0) return { icon: <Sun className="text-yellow-400 animate-spin-slow" size={48} />, label: "CLEAR SKY", color: "from-yellow-500/20 to-orange-500/10" };
    if (code <= 3) return { icon: <Cloud className="text-gray-300 animate-cloud" size={48} />, label: "CLOUDY", color: "from-gray-500/20 to-gray-700/10" };
    if (code <= 48) return { icon: <Cloud className="text-gray-400 blur-sm" size={48} />, label: "FOG", color: "from-gray-600/30 to-gray-800/20" };
    if (code <= 67) return { 
        icon: <div className="relative"><CloudRain className="text-cyan-400" size={48} /><div className="weather-rain"><i></i><i></i><i></i></div></div>, 
        label: "RAIN", color: "from-blue-600/30 to-cyan-900/20" 
    };
    if (code <= 77) return { icon: <CloudSnow className="text-white" size={48} />, label: "SNOW", color: "from-white/20 to-blue-200/10" };
    if (code >= 95) return { icon: <CloudLightning className="text-purple-400 animate-pulse" size={48} />, label: "THUNDERSTORM", color: "from-purple-600/30 to-indigo-900/20" };
    
    return { icon: <CloudRain className="text-cyan-400" size={48} />, label: "RAIN", color: "from-blue-600/20 to-cyan-900/20" };
  };

  if (!isActive) return null;

  return (
    <div className={`absolute transition-all duration-500 ease-in-out z-40 glass-panel border border-cyan-500/30 shadow-[0_0_30px_rgba(0,255,255,0.15)] overflow-hidden ${isMinimized ? 'top-32 left-4 w-48 h-12 rounded-lg' : 'top-32 left-4 w-72 h-80 rounded-2xl'}`}>
       
       {/* Header */}
       <div className="flex justify-between items-center bg-cyan-900/40 p-2 border-b border-cyan-500/30">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-ping' : 'bg-cyan-400'}`}></div>
            <span className="text-[10px] font-display text-cyan-400 tracking-widest">ATMOSPHERE</span>
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setIsMinimized(!isMinimized)} className="text-cyan-400 hover:text-white transition-colors">
                {isMinimized ? <Maximize size={12} /> : <Minimize size={12} />}
            </button>
            <button onClick={onClose} className="text-red-400 hover:text-white transition-colors"><X size={12} /></button>
          </div>
       </div>

       {isMinimized && (
           <div className="flex items-center justify-center h-full pb-2">
                <span className="text-cyan-500 text-[10px] truncate px-2 font-mono">
                    {data ? `${data.temp}°C | ${data.city}` : 'SCANNING...'}
                </span>
           </div>
       )}

       {!isMinimized && (
         <div className="relative w-full h-[calc(100%-32px)] flex flex-col items-center justify-center p-4">
            
            {loading && (
                <div className="flex flex-col items-center animate-pulse">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <span className="text-xs font-mono text-cyan-400">SCANNING SATELLITES...</span>
                </div>
            )}

            {error && (
                <div className="text-center">
                    <span className="text-red-500 font-display text-lg">SIGNAL LOST</span>
                    <p className="text-[10px] text-gray-400 mt-2">{error}</p>
                </div>
            )}

            {!loading && !error && data && (
                <>
                    {/* Background Dynamic Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-b ${getWeatherVisuals(data.conditionCode).color} opacity-50`}></div>
                    
                    {/* Main Icon */}
                    <div className="z-10 mb-4 scale-125 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                        {getWeatherVisuals(data.conditionCode).icon}
                    </div>

                    {/* Temp & City */}
                    <div className="z-10 text-center mb-6">
                        <h1 className="text-5xl font-display font-bold text-white tracking-tighter drop-shadow-lg">{data.temp}°</h1>
                        <h2 className="text-cyan-300 font-display text-sm tracking-widest mt-1 uppercase">{data.city}</h2>
                        <div className="text-[10px] bg-cyan-900/50 px-2 py-1 rounded mt-2 inline-block border border-cyan-500/30 text-cyan-100">
                            {getWeatherVisuals(data.conditionCode).label}
                        </div>
                    </div>

                    {/* Grid Stats */}
                    <div className="z-10 w-full grid grid-cols-2 gap-2 mt-auto">
                        <div className="bg-black/40 rounded p-2 flex items-center space-x-2 border border-white/5">
                            <Wind size={16} className="text-gray-400" />
                            <div>
                                <div className="text-[9px] text-gray-500">WIND</div>
                                <div className="text-xs font-mono text-white">{data.windSpeed} km/h</div>
                            </div>
                        </div>
                        <div className="bg-black/40 rounded p-2 flex items-center space-x-2 border border-white/5">
                            <Droplets size={16} className="text-blue-400" />
                            <div>
                                <div className="text-[9px] text-gray-500">HUMIDITY</div>
                                <div className="text-xs font-mono text-white">{data.humidity}%</div>
                            </div>
                        </div>
                    </div>
                </>
            )}
         </div>
       )}
    </div>
  );
};