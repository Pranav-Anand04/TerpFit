// Chatbot functionality for TerpFit application
import { logWorkout, getWorkoutHistory, getWorkoutStats } from './workout.js';
import gyms from '../data/gyms.js';
import { GEMINI_API_KEY } from './config.js';

let currentGym = null;
let workoutLoggingState = {
    isLogging: false,
    currentStep: null,
    workoutData: {
        type: null,
        duration: null,
        calories: null,
        gym: null,
        date: new Date().toISOString()
    }
};

// Initialize chatbot functionality
export function initializeChatbot() {
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('send-message');
    
    if (!chatInput || !chatSend) {
        console.error('Chat elements not found in the DOM');
        return;
    }
    
    // Add event listeners
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput(chatInput.value.trim());
            chatInput.value = '';
        }
    });
    
    chatSend.addEventListener('click', () => {
        handleUserInput(chatInput.value.trim());
        chatInput.value = '';
    });
    
    // Display welcome message
    addMessageToChat('bot', 'Hello! I\'m your TerpFit assistant. I can help you log workouts, find gyms, and provide workout recommendations. How can I assist you today?');
}

// Handle user input
async function handleUserInput(message) {
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Check if we're in workout logging mode
    if (workoutLoggingState.isLogging) {
        await handleWorkoutLogging(message);
        return;
    }
    
    // Check for workout logging command
    if (message.toLowerCase().includes('log workout') || message.toLowerCase().includes('record workout')) {
        startWorkoutLogging();
        return;
    }
    
    // Check for gym assistance command
    if (message.toLowerCase().includes('find gym') || message.toLowerCase().includes('locate gym')) {
        startGymAssistance();
        return;
    }
    
    // Get AI response for normal chat
    try {
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chat-message bot-message typing-indicator';
        typingIndicator.textContent = 'Typing...';
        document.getElementById('chat-messages').appendChild(typingIndicator);
        
        // Scroll to bottom
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Get response from Gemini API
        const response = await getChatbotResponse(message);
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Add bot response to chat
        addMessageToChat('bot', response);
    } catch (error) {
        console.error('Error getting chatbot response:', error);
        addMessageToChat('bot', 'I apologize, but I encountered an error. Please try again later.');
    }
}

// Handle workout logging flow
async function handleWorkoutLogging(message) {
    switch (workoutLoggingState.currentStep) {
        case 'type':
            workoutLoggingState.workoutData.type = message;
            workoutLoggingState.currentStep = 'duration';
            addMessageToChat('bot', 'Great! How long did you workout for? (in minutes)');
            break;
            
        case 'duration':
            const duration = parseInt(message);
            if (isNaN(duration) || duration <= 0) {
                addMessageToChat('bot', 'Please enter a valid duration in minutes.');
                return;
            }
            workoutLoggingState.workoutData.duration = duration;
            workoutLoggingState.currentStep = 'calories';
            addMessageToChat('bot', 'How many calories did you burn?');
            break;
            
        case 'calories':
            const calories = parseInt(message);
            if (isNaN(calories) || calories <= 0) {
                addMessageToChat('bot', 'Please enter a valid number of calories.');
                return;
            }
            workoutLoggingState.workoutData.calories = calories;
            
            // Get any pending checklist
            const pendingChecklist = localStorage.getItem('pendingWorkoutChecklist');
            if (pendingChecklist) {
                workoutLoggingState.workoutData.checklist = JSON.parse(pendingChecklist);
                localStorage.removeItem('pendingWorkoutChecklist');
            }
            
            // Save workout
            const workout = logWorkout(workoutLoggingState.workoutData);
            
            // Reset state
            workoutLoggingState.isLogging = false;
            workoutLoggingState.currentStep = null;
            workoutLoggingState.workoutData = {
                type: null,
                duration: null,
                calories: null,
                gym: null,
                date: new Date().toISOString()
            };
            
            // Confirm workout logged
            let confirmMessage = `Great! I've logged your ${workout.type} workout. You worked out for ${workout.duration} minutes and burned ${workout.calories} calories.`;
            if (workout.checklist) {
                confirmMessage += ' I\'ve also attached the workout checklist to your log.';
            }
            addMessageToChat('bot', confirmMessage);
            break;
    }
}

// Start workout logging process
export function startWorkoutLogging(gymName) {
    workoutLoggingState.isLogging = true;
    workoutLoggingState.currentStep = 'type';
    workoutLoggingState.workoutData.gym = gymName || null;
    addMessageToChat('bot', 'What is the name of the workout you did? (e.g., Basketball, Chest, Cardio, Yoga)');
}

// Start gym assistance mode
export function startGymAssistance(gymName) {
    workoutLoggingState.isLogging = false;
    currentGym = gymName;
    
    // Add a message to the chat
    addMessageToChat('bot', `I can help you with information about ${gymName}. What would you like to know?`);
    
    // Focus the input field
    document.getElementById('chat-input').focus();
}

// Add message to chat
function addMessageToChat(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
        console.error('Chat messages element not found');
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    // Use innerHTML for bot messages (which may contain HTML) and textContent for user messages
    if (sender === 'bot') {
        messageDiv.innerHTML = message;
    } else {
        messageDiv.textContent = message;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Get chatbot response using Gemini API
async function getChatbotResponse(message) {
    try {
        // Check if the API key is valid
        if (!GEMINI_API_KEY) {
            console.error('Invalid or missing Gemini API key');
            throw new Error('Invalid or missing Gemini API key');
        }

        console.log('Sending request to Gemini API with key:', GEMINI_API_KEY.substring(0, 10) + '...');
        
        // Create a more detailed prompt for the AI
        const prompt = `You are a fitness assistant for TerpFit, a fitness app for University of Maryland students. 
        The user's message is: "${message}". 
        
        Provide a helpful, fitness-focused response. If they're asking about workouts, consider their workout history: ${JSON.stringify(getWorkoutHistory())}.
        
        If they're asking for a specific workout (like a leg workout), format your response as a checklist with the following structure:
        WORKOUT_PLAN
        - Exercise 1: sets x reps
        - Exercise 2: sets x reps
        - Exercise 3: sets x reps
        END_WORKOUT_PLAN
        
        Add brief instructions or rest periods between exercises.
        If they're just saying hello or thank you, respond naturally as a fitness assistant.
        If they're asking about gyms, mention that TerpFit can help them find gyms on campus.
        
        Keep your response concise and focused on fitness.`;
        
        // Use the correct API endpoint URL and request format
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            
            // Try a different model if the first one fails
            console.log('Trying alternative model...');
            const alternativeResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                })
            });
            
            if (!alternativeResponse.ok) {
                const alternativeErrorText = await alternativeResponse.text();
                console.error('Alternative model error:', alternativeErrorText);
                
                // Try one more model as a last resort
                console.log('Trying last resort model...');
                const lastResortResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 1024,
                        }
                    })
                });
                
                if (!lastResortResponse.ok) {
                    const lastResortErrorText = await lastResortResponse.text();
                    console.error('Last resort model error:', lastResortErrorText);
                    throw new Error(`API error: ${response.status} ${errorText}`);
                }
                
                const lastResortData = await lastResortResponse.json();
                console.log('Last resort API Response:', lastResortData);
                
                if (!lastResortData.candidates || lastResortData.candidates.length === 0 || !lastResortData.candidates[0].content || !lastResortData.candidates[0].content.parts || lastResortData.candidates[0].content.parts.length === 0) {
                    console.error('Unexpected last resort API response format:', lastResortData);
                    throw new Error('Unexpected API response format');
                }
                
                console.log('Successfully received response from last resort Gemini API');
                return lastResortData.candidates[0].content.parts[0].text;
            }
            
            const alternativeData = await alternativeResponse.json();
            console.log('Alternative API Response:', alternativeData);
            
            if (!alternativeData.candidates || alternativeData.candidates.length === 0 || !alternativeData.candidates[0].content || !alternativeData.candidates[0].content.parts || alternativeData.candidates[0].content.parts.length === 0) {
                console.error('Unexpected alternative API response format:', alternativeData);
                throw new Error('Unexpected API response format');
            }
            
            console.log('Successfully received response from alternative Gemini API');
            return alternativeData.candidates[0].content.parts[0].text;
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
            console.error('Unexpected API response format:', data);
            throw new Error('Unexpected API response format');
        }
        
        let responseText = data.candidates[0].content.parts[0].text;
        
        // Check if the response contains a workout plan
        if (responseText.includes('WORKOUT_PLAN') && responseText.includes('END_WORKOUT_PLAN')) {
            // Extract the workout plan
            const planStart = responseText.indexOf('WORKOUT_PLAN') + 'WORKOUT_PLAN'.length;
            const planEnd = responseText.indexOf('END_WORKOUT_PLAN');
            const workoutPlan = responseText.substring(planStart, planEnd).trim();
            
            // Format the workout plan as HTML checklist
            const checklistItems = workoutPlan.split('\n')
                .map(line => line.trim())
                .filter(line => line.startsWith('-'))
                .map(line => line.substring(1).trim());
                
            // Save the checklist to local storage for the next workout logging
            localStorage.setItem('pendingWorkoutChecklist', JSON.stringify(checklistItems));
            
            // Format the response with the checklist
            const checklistHtml = checklistItems
                .map(item => {
                    const itemId = `check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    return `<div class="checklist-item">
                        <input type="checkbox" id="${itemId}">
                        <label for="${itemId}">${item}</label>
                    </div>`;
                })
                .join('');
                
            // Remove the WORKOUT_PLAN and END_WORKOUT_PLAN markers and any markdown
            let cleanResponse = responseText.substring(0, planStart).replace('WORKOUT_PLAN', '').trim();
            if (cleanResponse) {
                cleanResponse += '<br><br>';
            }
            
            responseText = cleanResponse +
                '<div class="workout-checklist">\n' +
                checklistHtml +
                '\n</div>\n' +
                responseText.substring(planEnd + 'END_WORKOUT_PLAN'.length).trim();
        }
        
        console.log('Successfully received response from Gemini API');
        return responseText;
    } catch (error) {
        console.error('Error getting chatbot response:', error);
        return `I'm having trouble connecting to my AI brain right now. Please try again in a moment. Error: ${error.message}`;
    }
}

// Delete a workout
export function deleteWorkout(workoutId) {
    if (confirm('Are you sure you want to delete this workout?')) {
        const workoutHistory = getWorkoutHistory();
        const updatedHistory = workoutHistory.filter(workout => workout.id !== workoutId);
        localStorage.setItem('workoutHistory', JSON.stringify(updatedHistory));
        return true;
    }
    return false;
}

// Make functions available globally
window.startWorkoutLogging = startWorkoutLogging;
window.startGymAssistance = startGymAssistance; 