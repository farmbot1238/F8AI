// LMJO 09 - المساعد الذكي للمواد الوزارية
let currentSubject = 'all';

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    console.log('LMJO 09 جاهز للعمل ✅');
});

function setupEventListeners() {
    document.querySelectorAll('.subject-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSubject = btn.dataset.subject;
            document.getElementById('subjectTag').innerText = `الموضوع: ${getSubjectName(currentSubject)}`;
        });
    });

    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('userInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
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

المادة الحالية المختارة: ${getSubjectName(currentSubject)}
${currentSubject !== 'all' ? `يرجى التركيز على الإجابة في مادة ${getSubjectName(currentSubject)} فقط.` : ''}`;
}

async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessage(message, 'user');
    input.value = '';
    
    const typingId = showTypingIndicator();
    
    try {
        const response = await callGemini(message);
        removeTypingIndicator(typingId);
        addMessage(response, 'bot');
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessage('❌ عذراً: ' + error.message, 'bot');
    }
}

async function callGemini(message) {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: message,
            systemPrompt: getSystemPrompt()
        })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'فشل الاتصال');
    }
    
    return data.reply;
}

function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `<div class="message-content">${text.replace(/\n/g, '<br>')}</div>`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'message bot';
    typingDiv.innerHTML = '<div class="message-content"><span>⏳ جاري التفكير...</span></div>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}
