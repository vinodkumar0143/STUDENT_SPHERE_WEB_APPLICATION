/**
 * SPHERE BOT - Frontend Logic
 * Handles the dynamic UI, model interactions, and message rendering
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Create Bot UI Elements Dynamically (So it's on every page)
    const botHTML = `
        <div class="sphere-bot-launcher" id="bot-launcher" title="Chat with Sphere Bot">
            <span>🤖</span>
        </div>

        <div class="sphere-bot-container" id="bot-window">
            <div class="sphere-bot-header">
                <div class="bot-avatar">🤖</div>
                <div class="bot-info">
                    <h3>Sphere Bot</h3>
                    <p>AI Academic Companion</p>
                </div>
            </div>
            
            <div id="sphere-bot-messages">
                <div class="msg bot-msg">
                    Hello! I am your Sphere Bot assistant. How can I help you excel in your studies today?
                </div>
            </div>

            <div class="sphere-bot-input">
                <input type="text" id="bot-input-field" placeholder="Ask anything..." autocomplete="off">
                <button id="bot-send-btn">➤</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', botHTML);

    const launcher = document.getElementById('bot-launcher');
    const botWindow = document.getElementById('bot-window');
    const sendBtn = document.getElementById('bot-send-btn');
    const inputField = document.getElementById('bot-input-field');
    const messageContainer = document.getElementById('sphere-bot-messages');

    // Toggle Window
    launcher.addEventListener('click', () => {
        botWindow.classList.toggle('active');
        if (botWindow.classList.contains('active')) {
            inputField.focus();
        }
    });

    // Send Message Logic
    async function sendMessage() {
        const text = inputField.value.trim();
        if (!text) return;

        // Add user message to UI
        appendMessage('user', text);
        inputField.value = '';

        // Add "Thinking..." placeholder
        const thinkingId = 'thinking-' + Date.now();
        appendMessage('bot', 'Thinking...', thinkingId);

        try {
            const response = await fetch('http://localhost:5000/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();
            
            // Replace thinking message with real response
            const thinkingMsg = document.getElementById(thinkingId);
            if (thinkingMsg) {
                thinkingMsg.innerHTML = data.reply;
            }
        } catch (error) {
            console.error('Bot Error:', error);
            const thinkingMsg = document.getElementById(thinkingId);
            if (thinkingMsg) {
                thinkingMsg.textContent = "Sorry, I'm having trouble connecting to my brain right now.";
            }
        }
    }

    function appendMessage(sender, content, id = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${sender}-msg`;
        if (id) msgDiv.id = id;
        msgDiv.textContent = content;
        messageContainer.appendChild(msgDiv);
        
        // Auto-scroll
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});
