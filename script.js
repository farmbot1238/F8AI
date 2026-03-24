// LMJO 09 - المساعد الذكي للمواد الوزارية
// المفتاح مضمن مباشرة - لا يحتاج المستخدم لإدخاله
const API_KEY = "AIzaSyDuqTXw956vY9TG7YwZyjH_r4pKiOvttJE";
const API_TYPE = "gemini"; // استخدام Gemini API

let currentSubject = 'all';

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
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
    
    // عرض رسالة المستخدم
    addMessage(message, 'user');
    input.value = '';
    
    // عرض مؤشر الكتابة
    const typingId = showTypingIndicator();
    
    try {
        const response = await callGemini(message);
        removeTypingIndicator(typingId);
        addMessage(response, 'bot');
    } catch (error) {
        removeTypingIndicator(typingId);
        addMessage('❌ عذراً، حدث خطأ: ' + error.message, 'bot');
    }
}

async function callGemini(message) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
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
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'خطأ في الاتصال');
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
    return text.replace(/\n/g, '<br>');
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = id;
    typingDiv.className = 'message bot';
    typingDiv.innerHTML = '<div class="message-content"><span class="typing-dots">⏳ جاري الكتابة...</span></div>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

// إضافة CSS للـ typing indicator
const style = document.createElement('style');
style.textContent = `
    .typing-dots {
        color: #6c757d;
        font-style: italic;
    }
`;
document.head.appendChild(style);
