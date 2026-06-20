// Generate unique room name
function createRoom(customName) {
    if (customName && customName.trim() !== '') {
        // Sanitize to basic alphanumeric and dashes for Jitsi room
        return customName.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    }
    const randomString = Math.random().toString(36).substring(2, 12);
    return "StudentSphere_" + randomString;
}

// Load Jitsi Meet iframe
function loadMeeting() {
    const urlParams = new URLSearchParams(window.location.search);
    let roomName = urlParams.get('room');
    
    if (!roomName) {
        roomName = createRoom(); // fallback
    }

    // Update room badge display
    const roomDisplay = document.getElementById('room-display');
    if (roomDisplay) {
        roomDisplay.textContent = "Room: " + roomName;
    }

    const meetingContainer = document.getElementById('meeting-container');
    const iframe = document.createElement('iframe');
    
    // Jitsi meet URL parameters
    // config.disableDeepLinking=true forces web version inside iframe instead of prompting app
    iframe.src = `https://meet.jit.si/${roomName}?config.disableDeepLinking=true`;
    iframe.allow = "camera; microphone; fullscreen; display-capture; autoplay";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    
    meetingContainer.innerHTML = '';
    meetingContainer.appendChild(iframe);
}

// Check which page we are on and bind events accordingly
document.addEventListener('DOMContentLoaded', () => {
    // If on meeting page, automatically load the meeting
    if (window.location.pathname.includes('meeting.html')) {
        loadMeeting();
    }
    
    // If on dashboard, bind the start meeting card click
    const meetingCard = document.getElementById('meeting-card');
    if (meetingCard) {
        meetingCard.addEventListener('click', (e) => {
            // Do not trigger meeting redirection if clicking inside the input field
            if (e.target.id === 'custom-room-input') {
                return;
            }
            
            e.preventDefault();
            const inputField = document.getElementById('custom-room-input');
            let roomName = "";
            
            if (inputField && inputField.value) {
                roomName = inputField.value;
            }
            
            // Redirect to meeting.html with the generated or custom room
            const finalRoom = createRoom(roomName);
            window.location.href = `meeting.html?room=${finalRoom}`;
        });
    }
});
