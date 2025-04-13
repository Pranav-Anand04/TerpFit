// Map functionality for TerpFit application
import gyms from '../data/gyms.js';
import { MAP_CONFIG } from './config.js';
import { startWorkoutLogging, startGymAssistance } from './chatbot.js';

let map;

// Initialize the map with gym locations
export function initializeMap() {
    // Check if map element exists
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map element not found in the DOM');
        return;
    }

    try {
        // Center on UMD campus by default
        map = L.map('map').setView(MAP_CONFIG.center, MAP_CONFIG.zoom);
        
        L.tileLayer(MAP_CONFIG.tileUrl, {
            attribution: MAP_CONFIG.attribution
        }).addTo(map);

        // Add gym markers with custom icons
        gyms.forEach(gym => {
            const customIcon = L.divIcon({
                className: 'gym-marker',
                html: '<i class="fas fa-dumbbell"></i>',
                iconSize: [30, 30]
            });

            const marker = L.marker(gym.location, { icon: customIcon })
                .addTo(map)
                .bindPopup(`
                    <div class="gym-popup">
                        <h3>${gym.name}</h3>
                        <p>${gym.description}</p>
                        <p><strong>Hours:</strong> ${gym.hours}</p>
                        <p><strong>Facilities:</strong></p>
                        <ul>
                            ${gym.facilities.map(facility => `<li>${facility}</li>`).join('')}
                        </ul>
                        <div class="gym-actions">
                            <button class="gym-action-btn log-workout-btn" data-gym="${gym.name}">Log a Workout</button>
                            <button class="gym-action-btn assistance-btn" data-gym="${gym.name}">Further Assistance</button>
                        </div>
                    </div>
                `);
        });
        
        // Add event listeners for the buttons after they're added to the DOM
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('log-workout-btn')) {
                const gymName = e.target.getAttribute('data-gym');
                // Close the popup
                if (map) {
                    map.closePopup();
                }
                startWorkoutLogging(gymName);
            } else if (e.target.classList.contains('assistance-btn')) {
                const gymName = e.target.getAttribute('data-gym');
                // Close the popup
                if (map) {
                    map.closePopup();
                }
                startGymAssistance(gymName);
            }
        });
        
        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

// Get the map instance
export function getMap() {
    return map;
}

// Show gym information when marker is clicked
function showGymInfo(gym) {
    const infoDiv = document.getElementById('gym-info');
    infoDiv.innerHTML = `
        <h3>${gym.name}</h3>
        <p>${gym.description}</p>
        <p><strong>Hours:</strong> ${gym.hours}</p>
        <p><strong>Equipment:</strong> ${gym.equipment.join(', ')}</p>
        <div class="gym-actions">
            <button onclick="startWorkoutLogging('${gym.name}')" class="btn btn-primary">Log a Workout</button>
            <button onclick="startGymAssistance('${gym.name}')" class="btn btn-secondary">Further Assistance</button>
        </div>
    `;
    infoDiv.style.display = 'block';
    
    // Don't automatically send a message to the chatbot
    // The user will need to click one of the buttons to interact with the chatbot
} 