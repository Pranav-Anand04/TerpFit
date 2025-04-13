// Main JavaScript file for TerpFit application
import { initializeMap } from './map.js';
import { initializeChatbot, startWorkoutLogging, startGymAssistance } from './chatbot.js';
import { getWorkoutHistory, getWorkoutById, loadWorkoutHistory } from './workout.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing application...');
    
    try {
        // Initialize map without callback for gym selection
        initializeMap();
        
        // Initialize chatbot
        initializeChatbot();
        
        // Load workout history
        loadWorkoutHistory();
        
        // Set up navigation
        setupNavigation();
        
        // Set up workout detail view
        setupWorkoutDetailView();
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});

// Set up navigation between Dashboard and Map views
function setupNavigation() {
    const dashboardLink = document.getElementById('dashboard-link');
    const mapLink = document.getElementById('map-link');
    const mapView = document.getElementById('map-view');
    const dashboardView = document.getElementById('dashboard-view');
    
    if (!dashboardLink || !mapLink || !mapView || !dashboardView) {
        console.error('Navigation elements not found');
        return;
    }
    
    // Show dashboard view
    dashboardLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active link
        dashboardLink.classList.add('active');
        mapLink.classList.remove('active');
        
        // Show dashboard, hide map
        dashboardView.classList.add('active');
        mapView.classList.remove('active');
        
        // Refresh workout history
        loadWorkoutHistory();
    });
    
    // Show map view
    mapLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active link
        mapLink.classList.add('active');
        dashboardLink.classList.remove('active');
        
        // Show map, hide dashboard
        mapView.classList.add('active');
        dashboardView.classList.remove('active');
    });
}

// Set up workout detail view
function setupWorkoutDetailView() {
    const backButton = document.getElementById('back-to-dashboard');
    const workoutDetailView = document.getElementById('workout-detail-view');
    const dashboardView = document.getElementById('dashboard-view');
    
    if (!backButton || !workoutDetailView || !dashboardView) {
        console.error('Workout detail view elements not found');
        return;
    }
    
    // Back button handler
    backButton.addEventListener('click', () => {
        workoutDetailView.classList.remove('active');
        dashboardView.classList.add('active');
    });
    
    // Set up workout item click handlers
    document.addEventListener('click', (e) => {
        const workoutItem = e.target.closest('.workout-item');
        if (workoutItem) {
            const workoutId = workoutItem.dataset.id;
            showWorkoutDetail(workoutId);
        }
    });
}

// Show workout detail
function showWorkoutDetail(workoutId) {
    const workout = getWorkoutById(workoutId);
    if (!workout) {
        console.error('Workout not found:', workoutId);
        return;
    }
    
    // Hide dashboard, show detail view
    document.getElementById('dashboard-view').classList.remove('active');
    document.getElementById('workout-detail-view').classList.add('active');
    
    // Update workout detail content
    document.getElementById('workout-title').textContent = workout.title || 'Workout Details';
    document.getElementById('workout-date').textContent = formatDate(workout.date);
    document.getElementById('workout-location').textContent = workout.gym || 'Not specified';
    document.getElementById('workout-duration').textContent = workout.duration || 'Not specified';
    document.getElementById('workout-calories').textContent = workout.calories ? `${workout.calories} cal` : 'Not specified';
    
    // Get the workout notes textarea
    const notesTextarea = document.getElementById('workout-notes');
    
    // Create checklist HTML if it exists
    let checklistHtml = '';
    if (workout.checklist && workout.checklist.length > 0) {
        checklistHtml = '<div class="workout-checklist">' +
            workout.checklist.map(item => 
                `<div class="checklist-item">
                    <input type="checkbox" id="check-${item.replace(/\s+/g, '-')}">
                    <label for="check-${item.replace(/\s+/g, '-')}">${item}</label>
                </div>`
            ).join('') +
            '</div>';
    }
    
    // Update the notes section with both checklist and notes
    notesTextarea.value = workout.notes || '';
    
    // Get the exercises container
    const exercisesContainer = document.querySelector('.workout-exercises');
    
    // Create or update the checklist container
    let checklistContainer = exercisesContainer.querySelector('.workout-checklist');
    if (!checklistContainer) {
        checklistContainer = document.createElement('div');
        checklistContainer.className = 'workout-checklist';
        exercisesContainer.insertBefore(checklistContainer, notesTextarea);
    }
    
    // Update checklist content
    if (workout.checklist && workout.checklist.length > 0) {
        checklistContainer.innerHTML = workout.checklist.map(item => 
            `<div class="checklist-item">
                <input type="checkbox" id="check-${item.replace(/\s+/g, '-')}">
                <label for="check-${item.replace(/\s+/g, '-')}">${item}</label>
            </div>`
        ).join('');
        checklistContainer.style.display = 'block';
    } else {
        checklistContainer.style.display = 'none';
    }
    
    // Set up save notes button
    const saveNotesButton = document.getElementById('save-notes');
    saveNotesButton.onclick = () => saveWorkoutNotes(workoutId, notesTextarea.value);
}

// Save workout notes
function saveWorkoutNotes(workoutId, notes) {
    try {
        // Get workout history
        const workoutHistory = getWorkoutHistory();
        
        // Find the workout and update its notes
        const workoutIndex = workoutHistory.findIndex(workout => workout.id === workoutId);
        if (workoutIndex !== -1) {
            workoutHistory[workoutIndex].notes = notes;
            
            // Save updated history
            localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
            
            // Show success message
            alert('Notes saved successfully!');
        } else {
            console.error('Workout not found:', workoutId);
        }
    } catch (error) {
        console.error('Error saving workout notes:', error);
        alert('Error saving notes. Please try again.');
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'Not available';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
} 