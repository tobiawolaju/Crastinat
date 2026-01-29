import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

const CONFIG = {
    startHour: 0,
    endHour: 24,
    minZoom: 0.1,  // Roughly 24h in view
    maxZoom: 5.0,
    zoomStep: 0.1
};

let currentZoom = 1.0;

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyDy7BCBM_WnfjLffKOQDup-Y6jRC_RoePA",
    authDomain: "everyotherday-db39f.firebaseapp.com",
    databaseURL: "https://everyotherday-db39f-default-rtdb.firebaseio.com",
    projectId: "everyotherday-db39f",
    storageBucket: "everyotherday-db39f.firebasestorage.app",
    messagingSenderId: "879562247905",
    appId: "1:879562247905:web:afa33c4295e4db98d3f1a0",
    measurementId: "G-Y6Z2ZDNJQW"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const database = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();
// Add scopes for Google Calendar
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');

let currentUser = null;
let googleAccessToken = null;

// --- Auth Functions ---

function initAuth() {
    const paramsSignInBtn = document.getElementById('params-signin-btn');
    const signOutBtn = document.getElementById('signout-btn');
    const userProfile = document.getElementById('user-profile');
    const userPhoto = document.getElementById('user-photo');
    const landingPage = document.getElementById('landing-page');
    const appContainer = document.querySelector('.app-container');
    const heroSignInBtn = document.getElementById('hero-signin-btn');

    // Sign-in function
    const handleSignIn = () => {
        const provider = new firebase.auth.GoogleAuthProvider(); // Provider moved inside
        auth.signInWithPopup(provider).then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = result.credential;
            googleAccessToken = credential.accessToken;
            // The signed-in user info.
            const user = result.user;
            console.log("User signed in:", user.displayName);
        }).catch((error) => {
            console.error("Sign in error:", error);
            alert("Sign in failed: " + error.message);
        });
    };

    userProfile.addEventListener('click', (e) => {
        // Only redirect if they didn't click the signout button
        if (!e.target.closest('#signout-btn')) {
            window.location.href = 'dashboard.html';
        }
    });

    if (paramsSignInBtn) paramsSignInBtn.addEventListener('click', handleSignIn);
    if (heroSignInBtn) heroSignInBtn.addEventListener('click', handleSignIn);

    signOutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            console.log("User signed out");
            googleAccessToken = null;
        });
    });

    auth.onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            // User is signed in - show app, hide landing page
            landingPage.classList.add('hidden');
            appContainer.style.display = 'flex';

            // UI Updates
            paramsSignInBtn.classList.add('hidden');
            userProfile.classList.remove('hidden');
            userPhoto.src = user.photoURL;

            // Load Data
            loadUserSchedule(user.uid);
        } else {
            // User is signed out - show landing page, hide app
            landingPage.classList.remove('hidden');
            appContainer.style.display = 'none';

            // UI Updates
            paramsSignInBtn.classList.remove('hidden');
            userProfile.classList.add('hidden');

            // Clear Data
            document.getElementById('tracks-container').innerHTML = '';
        }
    });
}

function loadUserSchedule(uid) {
    const scheduleRef = database.ref('users/' + uid + '/schedule');
    scheduleRef.on('value', (snapshot) => {
        const activities = snapshot.val() || {};

        // Convert object to array and ensure we have an 'id' that matches backend expectations
        const activitiesArray = Object.keys(activities).map(key => {
            const data = activities[key];
            return {
                ...data,
                id: data.id || key // Prefer internal ID if set by backend tools
            };
        });

        document.getElementById('tracks-container').innerHTML = '';
        renderTimeRuler();
        layoutAndRenderActivities(activitiesArray);
    });
}

function renderAttendeesHtml(attendees) {
    if (!attendees || attendees.length === 0) return '';

    const attendeesHtml = attendees.map(name => `<span class="attendee-chip">${name}</span>`).join('');
    return `
        <div class="detail-item">
            <h3>Attendees</h3>
            <div class="attendees-list">
                ${attendeesHtml}
            </div>
        </div>
    `;
}

function renderTagsHtml(tags) {
    if (!tags || tags.length === 0) return '';
    const tagsHtml = tags.map(tag => `<span class="tag-chip">${tag}</span>`).join('');

    return `
        <div class="detail-section">
            <h3>Tags</h3>
            <div class="tags-list">
                ${tagsHtml}
            </div>
        </div>
    `;
}

function renderDaysHtml(days) {
    if (!days || days.length === 0) return '';

    // Sort logic to ensure predictable order
    const order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const sortedDays = [...days].sort((a, b) => order.indexOf(a) - order.indexOf(b));

    const isDaily = order.every(d => days.includes(d)) && days.length === 7;
    const isWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].every(d => days.includes(d)) && days.length === 5;

    let content = "";
    if (isDaily) {
        content = '<span class="tag-chip day-chip">Every Day</span>';
    } else if (isWeekdays) {
        content = '<span class="tag-chip day-chip">Weekdays</span>';
    } else {
        content = sortedDays.map(day => `<span class="tag-chip day-chip">${day}</span>`).join('');
    }

    return `
        <div class="detail-section">
            <h3>Active Days</h3>
            <div class="tags-list">
                ${content}
            </div>
        </div>
    `;
}

function renderDetails(activity) {
    const panel = document.getElementById('details-panel');
    const overlay = document.getElementById('details-overlay');

    // Status color mapping
    const statusColors = {
        'Completed': '#4CAF50',
        'In Progress': '#2196F3',
        'Pending': '#FFC107',
        'Missed': '#F44336'
    };
    const statusColor = statusColors[activity.status] || '#999';

    panel.innerHTML = `
        <div class="detail-container">
            <header class="detail-header">
                <div class="detail-title-row">
                    <h2>${activity.title}</h2>
                    <span class="status-chip" style="background-color: ${hexToRgba(statusColor, 0.1)}; color: ${statusColor}; border: 1px solid ${hexToRgba(statusColor, 0.2)}">${activity.status || 'Scheduled'}</span>
                </div>
                <div class="detail-time">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    ${activity.startTime} — ${activity.endTime}
                </div>
            </header>
            
            ${activity.description ? `
            <div class="detail-section">
                <h3>Description</h3>
                <p>${activity.description}</p>
            </div>` : ''}
            
            <div class="detail-grid">
                <div class="detail-section">
                    <h3>Location</h3>
                    <div class="detail-value">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        ${activity.location || 'Remote / None'}
                    </div>
                </div>
                
                ${activity.attendees?.length > 0 ? `
                <div class="detail-section">
                    <h3>Attendees</h3>
                    <div class="tags-list">
                        ${activity.attendees.map(name => `<span class="tag-chip">${name}</span>`).join('')}
                    </div>
                </div>` : ''}
            </div>

            ${renderTagsHtml(activity.tags)}
            ${renderDaysHtml(activity.days)}

            <div class="detail-actions">
                <button class="action-button primary" id="edit-btn">Edit Details</button>
                <button class="action-button secondary" id="delete-btn">Delete</button>
            </div>
        </div>
    `;

    // Button Listeners
    panel.querySelector('#delete-btn').addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete "${activity.title}" ? `)) {
            deleteActivity(activity.id);
        }
    });

    panel.querySelector('#edit-btn').addEventListener('click', () => {
        editActivity(activity);
    });

    // Open sheet on mobile
    panel.classList.add('open');
    overlay.classList.add('active');
    document.querySelector('.chat-input-container').classList.add('hidden-mobile');
}

function editActivity(activity) {
    const panel = document.getElementById('details-panel');
    panel.innerHTML = `
        <div class="detail-container edit-container">
            <header class="detail-header">
                <h2>Edit Activity</h2>
                <p style="color: var(--text-tertiary); font-size: 0.875rem;">Modify the details of your scheduled activity.</p>
            </header>

            <div class="form-group">
                <label>Activity Title</label>
                <input type="text" id="edit-title" value="${activity.title}" placeholder="e.g., Deep Work Session">
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label>Start Time</label>
                    <input type="time" id="edit-start" value="${activity.startTime}">
                </div>
                <div class="form-group">
                    <label>End Time</label>
                    <input type="time" id="edit-end" value="${activity.endTime}">
                </div>
            </div>

            <div class="form-group">
                <label>Location</label>
                <input type="text" id="edit-location" value="${activity.location || ''}" placeholder="Add a location">
            </div>

            <div class="form-group">
                <label>Tags (comma separated)</label>
                <input type="text" id="edit-tags" value="${(activity.tags || []).join(', ')}" placeholder="Work, Urgent, Personal">
            </div>

            <div class="form-group">
                <label>Recurrence Days (comma separated)</label>
                <input type="text" id="edit-days" value="${(activity.days || []).join(', ')}" placeholder="Monday, Wednesday, Friday">
            </div>

            <div class="form-group">
                <label>Notes / Description</label>
                <textarea id="edit-description" placeholder="Add any additional details here...">${activity.description || ''}</textarea>
            </div>

            <div class="detail-actions">
                <button class="action-button primary" id="save-edit">Save Changes</button>
                <button class="action-button secondary" id="cancel-edit">Cancel</button>
            </div>
        </div>
    `;

    document.getElementById('cancel-edit').addEventListener('click', () => {
        renderDetails(activity);
    });

    document.getElementById('save-edit').addEventListener('click', async () => {
        const saveBtn = document.getElementById('save-edit');
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        const updatedData = {
            title: document.getElementById('edit-title').value,
            startTime: document.getElementById('edit-start').value,
            endTime: document.getElementById('edit-end').value,
            location: document.getElementById('edit-location').value,
            description: document.getElementById('edit-description').value,
            tags: document.getElementById('edit-tags').value.split(',').map(t => t.trim()).filter(t => t),
            days: document.getElementById('edit-days').value.split(',').map(t => t.trim()).filter(t => t),
            status: activity.status || 'Scheduled'
        };

        await updateActivity(activity.id, updatedData);
    });
}

async function updateActivity(activityId, data) {
    if (!currentUser) return;
    const saveBtn = document.getElementById('save-edit');

    try {
        const response = await fetch("https://to-do-iun8.onrender.com/api/activities/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: activityId,
                updates: data,
                userId: currentUser.uid,
                accessToken: googleAccessToken
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to update activity");
        }

        // Show "Saved" feedback
        if (saveBtn) {
            saveBtn.textContent = 'Saved ✓';
            saveBtn.disabled = true;
        }

        // Wait for Firebase to sync the updated data (give it a moment)
        await new Promise(resolve => setTimeout(resolve, 800));

        // Get the updated activity from Firebase and show detail view
        const scheduleRef = database.ref('users/' + currentUser.uid + '/schedule');
        const snapshot = await scheduleRef.once('value');
        const activities = snapshot.val() || {};

        // Find the updated activity
        const activitiesArray = Object.keys(activities).map(key => ({
            ...activities[key],
            id: activities[key].id || key
        }));

        const updatedActivity = activitiesArray.find(a => a.id === parseInt(activityId));

        if (updatedActivity) {
            // Render the detail view with updated data
            renderDetails(updatedActivity);
        } else {
            // Fallback: just close if we can't find it
            closeDetails();
        }

    } catch (error) {
        console.error("Error updating activity:", error);
        alert("Failed to update activity: " + error.message);

        // Reset button state on error
        if (saveBtn) {
            saveBtn.textContent = 'Save Changes';
            saveBtn.disabled = false;
        }
    }
}

async function deleteActivity(activityId) {
    if (!currentUser) return;
    try {
        const response = await fetch("https://to-do-iun8.onrender.com/api/activities/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: activityId,
                userId: currentUser.uid,
                accessToken: googleAccessToken
            })
        });

        if (!response.ok) throw new Error("Failed to delete activity");

        closeDetails();
    } catch (error) {
        console.error("Error deleting activity:", error);
        alert("Failed to delete activity.");
    }
}

function closeDetails() {
    const panel = document.getElementById('details-panel');
    const overlay = document.getElementById('details-overlay');
    panel.classList.remove('open');
    overlay.classList.remove('active');
    document.querySelector('.chat-input-container').classList.remove('hidden-mobile');
}

function init() {
    renderTimeRuler();
    setupCurrentTimeIndicator();
    scrollToInitialTime();
    setupChatInput();
    setupZoomListeners();
    initAuth(); // Initialize auth listeners

    // Close details when clicking overlay
    document.getElementById('details-overlay').addEventListener('click', closeDetails);

    // Splash Screen Timer (2.5s)
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.classList.add('fade-out');
    }, 2500);

    // Set date
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', dateOptions);
}



function setupChatInput() {
    const chatInput = document.getElementById('chat-input');
    const actionBtn = document.getElementById('action-btn');
    const micIcon = actionBtn.querySelector('.icon-mic');
    const sendIcon = actionBtn.querySelector('.icon-send');

    // Handle Input & Icon Toggling
    chatInput.addEventListener('input', () => {
        // Auto-resize textarea
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';

        if (chatInput.value.trim().length > 0) {
            micIcon.classList.add('hidden');
            sendIcon.classList.remove('hidden');
        } else {
            micIcon.classList.remove('hidden');
            sendIcon.classList.add('hidden');
        }
    });

    // Handle Action Button Click (Mic or Send)
    actionBtn.addEventListener('click', () => {
        if (chatInput.value.trim().length > 0) {
            handleChatSubmit();
        } else {
            startVoiceInput();
        }
    });

    async function handleChatSubmit() {
        const message = chatInput.value.trim();
        if (!message || !currentUser) {
            if (!currentUser) alert("Please sign in to use the AI assistant.");
            return;
        }

        // Reset UI immediately
        chatInput.value = '';
        chatInput.style.height = 'auto';
        micIcon.classList.remove('hidden');
        sendIcon.classList.add('hidden');

        const originalPlaceholder = chatInput.placeholder;
        chatInput.placeholder = "Thinking...";
        chatInput.disabled = true;

        try {
            const response = await fetch("https://to-do-iun8.onrender.com/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    userId: currentUser.uid,
                    accessToken: googleAccessToken || null
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error("Backend error:", errData);
                alert("Error: " + (errData.reply || errData.error || "Unknown error"));
                return;
            }

            const data = await response.json();
            if (data.reply) {
                // In a real OpenAI style app, we might want a toast or a floating notification
                alert("AI: " + data.reply);
            }
        } catch (error) {
            console.error("Error communicating with AI:", error);
            alert("Error communicating with AI Assistant.");
        } finally {
            chatInput.placeholder = originalPlaceholder;
            chatInput.disabled = false;
            chatInput.focus();
        }
    }

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatSubmit();
        }
    });
}

function startVoiceInput() {
    console.log("Voice input triggered (not implemented)");
    alert("Voice input is not implemented yet.");
}

function setupZoomListeners() {
    const timeline = document.querySelector('.timeline-container');
    let lastTouchDistance = 0;

    // Mouse Wheel Zoom (Ctrl + Wheel)
    timeline.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = -e.deltaY;
            const factor = delta > 0 ? 1.1 : 0.9;
            applyZoom(currentZoom * factor, e.clientX);
        }
    }, { passive: false });

    // Touch Pinch Zoom
    timeline.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            lastTouchDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
        }
    });

    timeline.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const distance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );

            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const factor = distance / lastTouchDistance;

            applyZoom(currentZoom * factor, centerX);
            lastTouchDistance = distance;
        }
    }, { passive: false });
}

function applyZoom(newZoom, centerX = window.innerWidth / 2) {
    const timeline = document.querySelector('.timeline-container');
    const oldZoom = currentZoom;

    // Clamp zoom
    currentZoom = Math.max(CONFIG.minZoom, Math.min(CONFIG.maxZoom, newZoom));

    if (oldZoom === currentZoom) return;

    // Calculate mouse position relative to content to maintain focus
    const rect = timeline.getBoundingClientRect();
    const relativeX = centerX - rect.left + timeline.scrollLeft;
    const ratio = currentZoom / oldZoom;

    // Apply zoom to CSS
    document.documentElement.style.setProperty('--zoom-level', currentZoom);

    // Adjust scroll to keep focus point
    timeline.scrollLeft = relativeX * ratio - (centerX - rect.left);
}



function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.trim().split(':');
    if (parts.length < 2) return 0;
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
}

function formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function renderTimeRuler() {
    const ruler = document.getElementById('time-ruler');
    // Clear existing to prevent duplicates if re-rendering
    ruler.innerHTML = '';
    for (let i = CONFIG.startHour; i < CONFIG.endHour; i++) {
        const marker = document.createElement('div');
        marker.className = 'time-marker';
        marker.textContent = `${String(i).padStart(2, '0')}:00`;
        ruler.appendChild(marker);
    }
}

function layoutAndRenderActivities(activities) {
    if (!activities) return;

    // Filter by current day of the week (case-insensitive)
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const filteredActivities = activities.filter(activity => {
        if (!activity.days || activity.days.length === 0) return true; // Show if no days specified
        return activity.days.some(day => day.toString().toLowerCase() === currentDay);
    });

    // 1. Sort by start time
    const sorted = [...filteredActivities].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

    // 2. Assign tracks
    const tracks = [];

    sorted.forEach(activity => {
        const start = parseTime(activity.startTime);
        let placed = false;

        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const lastActivityInTrack = track[track.length - 1];
            const lastEnd = parseTime(lastActivityInTrack.endTime);

            if (start >= lastEnd) {
                track.push(activity);
                activity.trackIndex = i;
                placed = true;
                break;
            }
        }

        if (!placed) {
            tracks.push([activity]);
            activity.trackIndex = tracks.length - 1;
        }
    });

    // 3. Render
    const container = document.getElementById('tracks-container');
    const trackHeight = 80; // Match CSS
    const trackGap = 16;  // Match CSS

    container.style.height = `${tracks.length * (trackHeight + trackGap)}px`;

    sorted.forEach(activity => {
        const el = document.createElement('div');
        el.className = 'activity-block';
        el.innerHTML = `
    <div class="activity-title">${activity.title}</div>
        <div class="activity-time">${activity.startTime} - ${activity.endTime}</div>
`;

        const start = parseTime(activity.startTime);
        const end = parseTime(activity.endTime);
        const duration = end - start;

        // Use CSS variables for time-based positioning
        el.style.left = `calc(${start} * var(--pixels-per-minute))`;
        el.style.width = `calc(${duration} * var(--pixels-per-minute))`;
        el.style.top = `${activity.trackIndex * (80 + 16)}px`; // 80 is trackHeight, 16 is trackGap

        let bgColor = activity.color || '#5865F2';
        el.style.backgroundColor = hexToRgba(bgColor, 0.15);
        el.style.borderLeft = `4px solid ${bgColor}`;
        el.style.color = 'var(--text-primary)';


        el.addEventListener('click', (e) => {
            e.stopPropagation();
            renderDetails(activity);
        });

        container.appendChild(el);
    });
}

function hexToRgba(hex, alpha) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
    }
    return hex;
}

function setupCurrentTimeIndicator() {
    const indicator = document.getElementById('current-time-indicator');

    function update() {
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();
        indicator.style.left = `calc(${minutes} * var(--pixels-per-minute))`;
        requestAnimationFrame(update);
    }
    update();
}

function scrollToInitialTime() {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const scrollArea = document.querySelector('.timeline-container');

    // Calculate position based on current zoom
    const pixelsPerMinute = (200 * currentZoom) / 60;
    const targetX = minutes * pixelsPerMinute - (window.innerWidth / 2);
    scrollArea.scrollLeft = Math.max(0, targetX);
}

// Start
init();
