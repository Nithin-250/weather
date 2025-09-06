// Weather App JavaScript
// Author: Weather Forecast App
// Features: Search by city, current location, 5-day forecast, error handling

class WeatherApp {
    constructor() {
        // OpenWeatherMap API configuration
        this.API_KEY = '8b516ae8e0cfa139f06ffe72673cf0ff'; // Your OpenWeatherMap API key
        this.BASE_URL = 'https://api.openweathermap.org/data/2.5';
        this.GEO_URL = 'https://api.openweathermap.org/geo/1.0';
        
        // DOM elements
        this.elements = {
            cityInput: document.getElementById('cityInput'),
            searchBtn: document.getElementById('searchBtn'),
            locationBtn: document.getElementById('locationBtn'),
            loading: document.getElementById('loading'),
            errorMessage: document.getElementById('errorMessage'),
            errorText: document.getElementById('errorText'),
            weatherContainer: document.getElementById('weatherContainer'),
            cityName: document.getElementById('cityName'),
            countryName: document.getElementById('countryName'),
            dateTime: document.getElementById('dateTime'),
            weatherIcon: document.getElementById('weatherIcon'),
            mainTemp: document.getElementById('mainTemp'),
            weatherDesc: document.getElementById('weatherDesc'),
            feelsLike: document.getElementById('feelsLike'),
            visibility: document.getElementById('visibility'),
            humidity: document.getElementById('humidity'),
            windSpeed: document.getElementById('windSpeed'),
            pressure: document.getElementById('pressure'),
            sunrise: document.getElementById('sunrise'),
            sunset: document.getElementById('sunset'),
            forecastCards: document.getElementById('forecastCards')
        };
        
        this.init();
    }
    
    init() {
        // Event listeners
        this.elements.searchBtn.addEventListener('click', () => this.handleSearch());
        this.elements.cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        this.elements.locationBtn.addEventListener('click', () => this.getCurrentLocation());
        
        // Load default weather (optional)
        this.loadDefaultWeather();
        
        // Update date and time
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 60000); // Update every minute
    }
    
    /**
     * Load default weather for a popular city
     */
    async loadDefaultWeather() {
        try {
            await this.getWeatherByCity('New York');
        } catch (error) {
            console.log('Could not load default weather');
        }
    }
    
    /**
     * Handle search button click or Enter key press
     */
    async handleSearch() {
        const city = this.elements.cityInput.value.trim();
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }
        
        await this.getWeatherByCity(city);
    }
    
    /**
     * Get user's current location and fetch weather
     */
    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser');
            return;
        }
        
        this.showLoading();
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await this.getWeatherByCoordinates(latitude, longitude);
            },
            (error) => {
                this.hideLoading();
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        this.showError('Location access denied by user');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        this.showError('Location information is unavailable');
                        break;
                    case error.TIMEOUT:
                        this.showError('Location request timed out');
                        break;
                    default:
                        this.showError('An unknown error occurred while retrieving location');
                        break;
                }
            }
        );
    }
    
    /**
     * Fetch weather data by city name
     */
    async getWeatherByCity(city) {
        try {
            this.showLoading();
            
            // First, get coordinates for the city
            const geoResponse = await fetch(
                `${this.GEO_URL}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${this.API_KEY}`
            );
            
            if (!geoResponse.ok) {
                throw new Error('City not found');
            }
            
            const geoData = await geoResponse.json();
            
            if (geoData.length === 0) {
                throw new Error('City not found');
            }
            
            const { lat, lon } = geoData[0];
            await this.getWeatherByCoordinates(lat, lon);
            
        } catch (error) {
            this.hideLoading();
            this.showError(error.message || 'City not found. Please try again.');
        }
    }
    
    /**
     * Fetch weather data by coordinates
     */
    async getWeatherByCoordinates(lat, lon) {
        try {
            // Fetch current weather and forecast data
            const [currentResponse, forecastResponse] = await Promise.all([
                fetch(`${this.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`),
                fetch(`${this.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`)
            ]);
            
            if (!currentResponse.ok || !forecastResponse.ok) {
                throw new Error('Weather data not available');
            }
            
            const currentData = await currentResponse.json();
            const forecastData = await forecastResponse.json();
            
            this.displayWeather(currentData, forecastData);
            this.hideLoading();
            
        } catch (error) {
            this.hideLoading();
            this.showError(error.message || 'Failed to fetch weather data');
        }
    }
    
    /**
     * Display weather data on the UI
     */
    displayWeather(currentData, forecastData) {
        // Hide error and loading states
        this.hideError();
        this.hideLoading();
        
        // Show weather container
        this.elements.weatherContainer.classList.remove('hidden');
        
        // Update current weather
        this.updateCurrentWeather(currentData);
        
        // Update forecast
        this.updateForecast(forecastData);
        
        // Clear search input
        this.elements.cityInput.value = '';
    }
    
    /**
     * Update current weather display
     */
    updateCurrentWeather(data) {
        const {
            name,
            sys: { country, sunrise, sunset },
            main: { temp, feels_like, humidity, pressure },
            weather: [weather],
            visibility,
            wind: { speed }
        } = data;
        
        // Location information
        this.elements.cityName.textContent = name;
        this.elements.countryName.textContent = this.getCountryName(country);
        
        // Weather icon and description
        this.elements.weatherIcon.src = `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;
        this.elements.weatherIcon.alt = weather.description;
        
        // Temperature information
        this.elements.mainTemp.textContent = `${Math.round(temp)}°C`;
        this.elements.weatherDesc.textContent = weather.description;
        this.elements.feelsLike.textContent = `${Math.round(feels_like)}°C`;
        
        // Weather stats
        this.elements.visibility.textContent = Math.round(visibility / 1000); // Convert to km
        this.elements.humidity.textContent = humidity;
        this.elements.windSpeed.textContent = Math.round(speed * 3.6); // Convert m/s to km/h
        this.elements.pressure.textContent = pressure;
        
        // Sun times
        this.elements.sunrise.textContent = this.formatTime(sunrise);
        this.elements.sunset.textContent = this.formatTime(sunset);
    }
    
    /**
     * Update 5-day forecast display
     */
    updateForecast(data) {
        // Get daily forecast data (one per day at 12:00 PM)
        const dailyForecasts = this.processForecastData(data.list);
        
        // Clear existing forecast cards
        this.elements.forecastCards.innerHTML = '';
        
        // Create forecast cards
        dailyForecasts.forEach(forecast => {
            const card = this.createForecastCard(forecast);
            this.elements.forecastCards.appendChild(card);
        });
    }
    
    /**
     * Process forecast data to get daily forecasts
     */
    processForecastData(forecastList) {
        const dailyForecasts = [];
        const today = new Date().getDate();
        
        // Group forecasts by date
        const groupedByDate = {};
        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toDateString();
            
            if (!groupedByDate[dateKey]) {
                groupedByDate[dateKey] = [];
            }
            groupedByDate[dateKey].push(item);
        });
        
        // Get one forecast per day (prefer midday forecast)
        Object.keys(groupedByDate).slice(0, 5).forEach(dateKey => {
            const dayForecasts = groupedByDate[dateKey];
            // Find forecast closest to 12:00 PM
            const midday = dayForecasts.find(f => {
                const hour = new Date(f.dt * 1000).getHours();
                return hour >= 11 && hour <= 13;
            }) || dayForecasts[0];
            
            dailyForecasts.push(midday);
        });
        
        return dailyForecasts;
    }
    
    /**
     * Create a forecast card element
     */
    createForecastCard(forecast) {
        const date = new Date(forecast.dt * 1000);
        const dayName = this.getDayName(date);
        
        const card = document.createElement('div');
        card.className = 'forecast-card';
        
        card.innerHTML = `
            <div class="day">${dayName}</div>
            <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" 
                 alt="${forecast.weather[0].description}">
            <div class="temp">${Math.round(forecast.main.temp)}°C</div>
            <div class="desc">${forecast.weather[0].description}</div>
        `;
        
        return card;
    }
    
    /**
     * Utility functions
     */
    
    updateDateTime() {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        
        this.elements.dateTime.textContent = now.toLocaleDateString('en-US', options);
    }
    
    formatTime(timestamp) {
        return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    getDayName(date) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { weekday: 'long' });
        }
    }
    
    getCountryName(countryCode) {
        const countries = {
            'US': 'United States',
            'GB': 'United Kingdom',
            'CA': 'Canada',
            'AU': 'Australia',
            'DE': 'Germany',
            'FR': 'France',
            'JP': 'Japan',
            'CN': 'China',
            'IN': 'India',
            'BR': 'Brazil',
            'RU': 'Russia',
            'IT': 'Italy',
            'ES': 'Spain',
            'MX': 'Mexico',
            'KR': 'South Korea',
            'NL': 'Netherlands',
            'SE': 'Sweden',
            'NO': 'Norway',
            'DK': 'Denmark',
            'FI': 'Finland'
        };
        
        return countries[countryCode] || countryCode;
    }
    
    /**
     * UI state management
     */
    
    showLoading() {
        this.elements.loading.classList.remove('hidden');
        this.elements.errorMessage.classList.add('hidden');
        this.elements.weatherContainer.classList.add('hidden');
    }
    
    hideLoading() {
        this.elements.loading.classList.add('hidden');
    }
    
    showError(message) {
        this.elements.errorText.textContent = message;
        this.elements.errorMessage.classList.remove('hidden');
        this.elements.weatherContainer.classList.add('hidden');
    }
    
    hideError() {
        this.elements.errorMessage.classList.add('hidden');
    }
}

// API Key validation and setup instructions
function checkAPIKey() {
    const app = new WeatherApp();
    
    if (app.API_KEY === 'YOUR_API_KEY_HERE') {
        console.warn(`
🌤️  WEATHER APP SETUP REQUIRED 🌤️

To use this weather app, you need to:

1. Get a free API key from OpenWeatherMap:
   → Visit: https://openweathermap.org/api
   → Sign up for a free account
   → Get your API key

2. Replace 'YOUR_API_KEY_HERE' in script.js with your actual API key

3. Save the file and reload the page

Example:
this.API_KEY = 'abcd1234efgh5678ijkl'; // Your actual API key

The app will work once you complete these steps!
        `);
        
        // Show helpful message to user
        setTimeout(() => {
            const errorElement = document.getElementById('errorMessage');
            const errorText = document.getElementById('errorText');
            if (errorElement && errorText) {
                errorText.innerHTML = `
                    <strong>Setup Required!</strong><br>
                    Please add your OpenWeatherMap API key to script.js<br>
                    <small>Check the browser console for detailed instructions</small>
                `;
                errorElement.classList.remove('hidden');
            }
        }, 1000);
    }
}

// Initialize the weather app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkAPIKey();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherApp;
}
