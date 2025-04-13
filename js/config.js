// Configuration for TerpFit application

// Gemini AI API key
export const GEMINI_API_KEY = 'AIzaSyB4X3tnA0ZM5hiAR8USs54-4yENKXuzkXM';

// Map configuration
export const MAP_CONFIG = {
    center: [38.987052, -76.940018], // UMD campus center
    zoom: 15,
    tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// Application settings
export const APP_SETTINGS = {
    maxWorkoutHistory: 100, // Maximum number of workouts to store
    defaultWorkoutDuration: 60, // Default workout duration in minutes
    defaultCaloriesPerMinute: 5 // Default calories burned per minute
}; 