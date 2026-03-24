const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');

// The API key provided in the instructions
const API_KEY = 'AIzaSyA4pFxgxgUrX8fbZWt970LPHBauDs-HcNU';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

// The knowledge base and rules
const SYSTEM_PROMPT = `You are an intelligent AI assistant specialized strictly and ONLY in the "Farm Bot" project.
Your knowledge source is the following information about Farm Bot:
- Farm Bot is an intelligent agricultural robot fully designed and built in Jordan by the students Abdulrahman Al-Maaytah and Haitham Al-Maaytah.
- It assists farmers and improves farming processes in a modern and efficient way.
- It monitors crops, tracks their growth, and identifies plants ready for harvest.
- It helps maintain plant health by detecting harmful plants and removing them automatically.
- It can operate independently and make accurate agricultural decisions based on surrounding data.
- It can be controlled and monitored remotely, providing detailed reports on the land and crop conditions.
- It increases productivity, reduces resource waste, and operates continuously throughout the day with high efficiency.
- It represents the integration of modern technology with traditional farming.
- It has a 3D model available on its website.
- It uses a "Teachable Machine" AI-powered model to detect plant diseases and provide recommendations.
- A PDF document (FARM8OT.pdf) is available with comprehensive features, specifications, and technical details.
- Contact Phone: +962 7XXXXXXXX.
- Instagram: farm8ot

Rules for your behavior:
1. You MUST ONLY answer questions related to the Farm Bot project.
2. If a user asks a question NOT related to Farm Bot, you MUST respond exactly with:
"I am specialized only in Farm Bot. Please ask about that topic." 
(Or the Arabic equivalent if the user speaks Arabic: "أنا متخصص فقط في Farm Bot. يرجى السؤال عن هذا الموضوع.")
3. You must act as a smart and technical assistant. Provide clear and accurate explanations based ONLY on the provided knowledge.
4. Auto-detect language: If the user speaks Arabic, respond in Arabic. If English, respond in English.
5. Tone: Friendly, clear, and informative. Avoid unnecessary long answers unless the user asks for a detailed explanation.`;

// Keep track of conversation history for context
let conversationHistory = [];

function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (isUser) {
        contentDiv.textContent = text;
    } else {
        // Parse markdown text using marked.js
        contentDiv.innerHTML = marked.parse(text);
    }
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function generateResponse(userMessage) {
    typingIndicator.classList.remove('hidden');
    sendBtn.disabled = true;
    
    try {
        const contents = [
            {
                role: "user",
                parts: [{ text: SYSTEM_PROMPT }]
            },
            {
                role: "model",
                parts: [{ text: "Understood. I will strictly follow these instructions." }]
            }
        ];

        // Add history
        for (const msg of conversationHistory) {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            });
        }
        
        // Add current message
        contents.push({
            role: "user",
            parts: [{ text: userMessage }]
        });

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.2,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const botResponse = data.candidates[0].content.parts[0].text;
            
            // Add to history
            conversationHistory.push({ role: 'user', text: userMessage });
            conversationHistory.push({ role: 'model', text: botResponse });
            
            // Keep history length manageable
            if (conversationHistory.length > 10) {
                conversationHistory = conversationHistory.slice(-10);
            }
            
            addMessage(botResponse, false);
        } else {
            addMessage("Sorry, I encountered an error processing your request.", false);
        }
        
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        addMessage("Sorry, I couldn't connect to my brain. Please try again later.", false);
    } finally {
        typingIndicator.classList.add('hidden');
        sendBtn.disabled = false;
        userInput.focus();
    }
}

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;
    
    addMessage(text, true);
    userInput.value = '';
    
    generateResponse(text);
});

// Initial focus
userInput.focus();
