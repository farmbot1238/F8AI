// LMJO 09 - المساعد الذكي للمواد الوزارية
let currentSubject = 'all';
let apiKey = localStorage.getItem('lmjo_api_key') || '';
let apiType = localStorage.getItem('lmjo_api_type') || 'openai';

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupEventListeners();
    checkApiKey();
});

function setupEventListeners() {
    // أزرار المواد
    document.querySelectorAll('.subject-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSubject = btn.dataset.subject;
            document.getElementById('subjectTag').innerText = `الموضوع: ${getSubjectName(currentSubject)}`;
        });
    });

    // إرسال الرسالة
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('userInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // إعدادات API
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('saveApiBtn').addEventListener('click', saveApiSettings);
    document.querySelector('.close').addEventListener('click', closeSettings);
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('settingsModal')) closeSettings();
    });
}

function getSubjectName(subject) {
    const names = {
        'all': 'الكل',
        'history': '📜 التاريخ',
        'religion': '🕌 الدين',
        'english': '🇬🇧 الإنجليزية',
        'arabic': '📖 العربية'
    };
    return names[subject] || 'الكل';
}

function getSystemPrompt() {
    return `أنت مساعد ذكي متخصص اسمه LMJO 09. أنت خبير في المواد الوزارية التالية فقط:
    
1. التاريخ (الفصل الأول والثاني) - جميع الوحدات
2. الدين الإسلامي (الفصل الأول والثاني) - جميع الدروس
3. اللغة الإنجليزية (القواعد، المفردات، الترجمة، المحادثة)
4. اللغة العربية (النحو، الصرف، البلاغة، الأدب)

مهمتك: الإجابة على أسئلة الطلاب في هذه المواد فقط.
إذا سأل الطالب عن موضوع خارج هذه المواد، اعتذر بلطف وأخبره أن تخصصك فقط في المواد الوزارية المذكورة.

كن دقيقاً في إجاباتك، استخدم لغة عربية فصيحة، وقدم أمثلة عند الحاجة.
الطلاب يعتمدون عليك للاستعداد للامتحانات الوزارية للفصلين الأول والثاني.

المادة الحالية المختارة: ${getSubjectName(currentSubject)}
${currentSubject !== 'all' ? `يرجى التركيز على الإجابة في مادة ${getSubjectName(currentSubject)} فقط.` : ''}`;
}

async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    if (!apiKey) {
        openSettings();
        document.getElementById('apiWarning').classList.add('show');
        return;
    }
    
    // عرض رسالة المستخدم
    addMessage(message, 'user');
    input.value = '';
    
    // عرض مؤشر الكتابة
    const typingId = showTypingIndicator();
    
    try {
        let response;
        if (apiType === 'openai') {
            response = await callOpenAI(message);
        } else {
            response = await callGemini(message);
        }
        
        removeTypingIndicator(typingId);
        addMessage(response, 'bot');
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessage('❌ عذراً، حدث خطأ: ' + error.message + '\n\nيرجى التحقق من مفتاح API الخاص بك.', 'bot');
    }
}

async function callOpenAI(message) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: getSystemPrompt() },
                { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 1000
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'خطأ في الاتصال');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

async function callGemini(message) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `${getSystemPrompt()}\n\nسؤال المستخدم: ${message}`
                }]
            }]
        })
    });
    
    if (!response.ok) {
        throw new Error('خطأ في الاتصال بـ Gemini API');
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `<div class="message-content">${formatText(text)}</div>`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatText(text) {
    // تحويل النص إلى HTML مع الحفاظ على الفقرات
    return text.replace(/\n/g, '<br>');
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'message bot';
    typingDiv.innerHTML = '<div class="message-content"><span class="typing-dots">...</span></div>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

function openSettings() {
    document.getElementById('apiKey').value = apiKey;
    document.getElementById('apiType').value = apiType;
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

function saveApiSettings() {
    apiKey = document.getElementById('apiKey').value.trim();
    apiType = document.getElementById('apiType').value;
    
    localStorage.setItem('lmjo_api_key', apiKey);
    localStorage.setItem('lmjo_api_type', apiType);
    
    closeSettings();
    document.getElementById('apiWarning').classList.remove('show');
    
    addMessage('✅ تم حفظ إعدادات API بنجاح! يمكنك الآن البدء بالأسئلة.', 'bot');
}

function loadSettings() {
    apiKey = localStorage.getItem('lmjo_api_key') || '';
    apiType = localStorage.getItem('lmjo_api_type') || 'openai';
}

function checkApiKey() {
    if (!apiKey) {
        document.getElementById('apiWarning').classList.add('show');
    }
}

// إضافة CSS للـ typing indicator
const style = document.createElement('style');
style.textContent = `
    .typing-dots {
        display: inline-block;
        animation: typing 1.4s infinite;
    }
    @keyframes typing {
        0%, 60%, 100% { opacity: 0.3; content: '.'; }
        30% { opacity: 1; content: '..'; }
    }
`;
document.head.appendChild(style);
