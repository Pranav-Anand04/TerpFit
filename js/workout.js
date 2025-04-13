// Workout logging and history functionality for TerpFit application

// Log a new workout
export function logWorkout(workoutData) {
    try {
        // Add a unique ID to the workout
        const workout = {
            ...workoutData,
            id: Date.now().toString()
        };
        
        // Get existing workout history
        const workoutHistory = getWorkoutHistory();
        
        // Add new workout to history
        workoutHistory.push(workout);
        
        // Save updated history
        localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
        
        return workout;
    } catch (error) {
        console.error('Error logging workout:', error);
        return null;
    }
}

// Get workout history
export function getWorkoutHistory() {
    try {
        const history = localStorage.getItem('workoutHistory');
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('Error getting workout history:', error);
        return [];
    }
}

// Get workout statistics
export function getWorkoutStats() {
    try {
        const history = getWorkoutHistory();
        
        if (history.length === 0) {
            return {
                totalWorkouts: 0,
                totalDuration: 0,
                totalCalories: 0,
                mostCommonType: null,
                averageDuration: 0,
                averageCalories: 0
            };
        }
        
        // Calculate statistics
        const stats = {
            totalWorkouts: history.length,
            totalDuration: 0,
            totalCalories: 0,
            typeCount: {},
            mostCommonType: null,
            maxTypeCount: 0
        };
        
        history.forEach(workout => {
            stats.totalDuration += workout.duration || 0;
            stats.totalCalories += workout.calories || 0;
            
            // Count workout types
            if (workout.type) {
                stats.typeCount[workout.type] = (stats.typeCount[workout.type] || 0) + 1;
                if (stats.typeCount[workout.type] > stats.maxTypeCount) {
                    stats.maxTypeCount = stats.typeCount[workout.type];
                    stats.mostCommonType = workout.type;
                }
            }
        });
        
        // Calculate averages
        stats.averageDuration = Math.round(stats.totalDuration / stats.totalWorkouts);
        stats.averageCalories = Math.round(stats.totalCalories / stats.totalWorkouts);
        
        return stats;
    } catch (error) {
        console.error('Error calculating workout stats:', error);
        return {
            totalWorkouts: 0,
            totalDuration: 0,
            totalCalories: 0,
            mostCommonType: null,
            averageDuration: 0,
            averageCalories: 0
        };
    }
}

// Get workouts by date range
export function getWorkoutsByDateRange(startDate, endDate) {
    try {
        const history = getWorkoutHistory();
        return history.filter(workout => {
            const workoutDate = new Date(workout.date);
            return workoutDate >= startDate && workoutDate <= endDate;
        });
    } catch (error) {
        console.error('Error getting workouts by date range:', error);
        return [];
    }
}

// Get workouts by gym
export function getWorkoutsByGym(gymName) {
    try {
        const history = getWorkoutHistory();
        return history.filter(workout => workout.gym === gymName);
    } catch (error) {
        console.error('Error getting workouts by gym:', error);
        return [];
    }
}

// Get workouts by type
export function getWorkoutsByType(workoutType) {
    try {
        const history = getWorkoutHistory();
        return history.filter(workout => workout.type.toLowerCase() === workoutType.toLowerCase());
    } catch (error) {
        console.error('Error getting workouts by type:', error);
        return [];
    }
}

// Get workout by ID
export function getWorkoutById(workoutId) {
    try {
        const history = getWorkoutHistory();
        return history.find(workout => workout.id === workoutId);
    } catch (error) {
        console.error('Error getting workout by ID:', error);
        return null;
    }
}

// Load workout history to the dashboard
export function loadWorkoutHistory() {
    try {
        const workoutList = document.getElementById('workout-list');
        if (!workoutList) {
            console.error('Workout list element not found');
            return;
        }
        
        const history = getWorkoutHistory();
        const stats = getWorkoutStats();
        
        // Update stats display
        document.getElementById('total-workouts').textContent = stats.totalWorkouts;
        document.getElementById('total-calories').textContent = stats.totalCalories;
        
        // Calculate streak (simplified)
        const streak = calculateStreak(history);
        document.getElementById('workout-streak').textContent = `${streak} days`;
        
        // Clear existing workout list
        workoutList.innerHTML = '';
        
        // Add workouts to the list
        if (history.length === 0) {
            const noWorkouts = document.createElement('div');
            noWorkouts.className = 'no-workouts';
            noWorkouts.textContent = 'No workouts logged yet. Start by logging a workout!';
            workoutList.appendChild(noWorkouts);
        } else {
            // Sort workouts by date (newest first)
            const sortedWorkouts = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            sortedWorkouts.forEach(workout => {
                const workoutItem = document.createElement('div');
                workoutItem.className = 'workout-item';
                workoutItem.dataset.id = workout.id;
                
                // Create workout content container
                const workoutContent = document.createElement('div');
                workoutContent.className = 'workout-content';
                
                const title = document.createElement('div');
                title.className = 'workout-item-title';
                title.textContent = workout.type || 'Workout';
                
                const details = document.createElement('div');
                details.className = 'workout-item-details';
                details.textContent = `${formatDate(workout.date)} • ${workout.duration || 0} min • ${workout.calories || 0} cal`;
                
                // Create delete button
                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-workout-btn';
                deleteButton.innerHTML = '&times;'; // X symbol
                deleteButton.title = 'Delete workout';
                deleteButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent triggering the workout item click
                    if (deleteWorkout(workout.id)) {
                        loadWorkoutHistory(); // Refresh the list
                    }
                });
                
                // Append elements
                workoutContent.appendChild(title);
                workoutContent.appendChild(details);
                workoutItem.appendChild(workoutContent);
                workoutItem.appendChild(deleteButton);
                workoutList.appendChild(workoutItem);
            });
        }
    } catch (error) {
        console.error('Error loading workout history:', error);
    }
}

// Calculate workout streak
function calculateStreak(workouts) {
    if (workouts.length === 0) return 0;
    
    // Sort workouts by date (newest first)
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if the most recent workout was today or yesterday
    const mostRecentWorkout = new Date(sortedWorkouts[0].date);
    mostRecentWorkout.setHours(0, 0, 0, 0);
    
    const daysSinceLastWorkout = Math.floor((today - mostRecentWorkout) / (1000 * 60 * 60 * 24));
    
    // If the last workout was more than 1 day ago, streak is broken
    if (daysSinceLastWorkout > 1) return 0;
    
    // Calculate streak
    let streak = 1;
    let currentDate = new Date(mostRecentWorkout);
    
    for (let i = 1; i < sortedWorkouts.length; i++) {
        const workoutDate = new Date(sortedWorkouts[i].date);
        workoutDate.setHours(0, 0, 0, 0);
        
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
        
        // If there's a workout on the previous day, increment streak
        if (workoutDate.getTime() === currentDate.getTime()) {
            streak++;
        } else {
            // Streak is broken
            break;
        }
    }
    
    return streak;
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'Not available';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Delete a workout
export function deleteWorkout(workoutId) {
    try {
        if (confirm('Are you sure you want to delete this workout?')) {
            const workoutHistory = getWorkoutHistory();
            const updatedHistory = workoutHistory.filter(workout => workout.id !== workoutId);
            localStorage.setItem('workoutHistory', JSON.stringify(updatedHistory));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting workout:', error);
        return false;
    }
} 