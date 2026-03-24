// LMJO 09 - المساعد الذكي للمواد الوزارية
// نظام مزدوج: Gemini + OpenAI مع تحويل تلقائي

// 🔑 المفاتيح الخاصة بك
const GEMINI_API_KEY = "AIzaSyAI37J4XImXv4u9QFCcg3gVXug_7yqQs28";
const OPENAI_API_KEY = "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";

let currentSubject = 'all';
let currentService = 'gemini'; // يبدأ بـ Gemini

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
    
    // محاولة الإجابة من Gemini أولاً
    let response = null;
    let usedService = '';
    
    try {
        // المحاولة الأولى: Gemini
        addSystemMessage('🔄 جاري الاتصال بـ Gemini...', typingId);
        response = await callGemini(message);
        usedService = 'Gemini';
    } catch (geminiError) {
        console.log('Gemini failed:', geminiError);
        addSystemMessage('⚠️ Gemini غير متاح، جاري التحويل إلى ChatGPT...', typingId);
        
        try {
            // المحاولة الثانية: OpenAI
            response = await callOpenAI(message);
            usedService = 'ChatGPT';
        } catch (openaiError) {
            console.log('OpenAI failed:', openaiError);
            removeTypingIndicator(typingId);
            addMessage('❌ عذراً، كلا النظامين غير متاحين حالياً.\n\n🔧 يرجى المحاولة لاحقاً أو التحقق من الاتصال بالإنترنت.', 'bot');
            return;
        }
    }
    
    removeTypingIndicator(typingId);
    addMessage(response, 'bot');
    
    // إضافة ملاحظة صغيرة عن الخدمة المستخدمة (اختيارية)
    if (usedService === 'ChatGPT') {
        addSystemMessage(`✨ تمت الإجابة عبر ${usedService}`, null);
    }
}

async function callGemini(message) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    
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
        throw new Error(errorData.error?.message || 'خطأ في Gemini');
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(message) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
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
        throw new Error(error.error?.message || 'خطأ في OpenAI');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `<div class="message-content">${formatText(text)}</div>`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addSystemMessage(text, typingId) {
    // إذا كان هناك مؤشر كتابة، نضيف الرسالة النظامية في مكانه
    if (typingId) {
        const typingElement = document.getElementById(typingId);
        if (typingElement) {
            const contentDiv = typingElement.querySelector('.message-content');
            if (contentDiv) {
                contentDiv.innerHTML = `<span class="system-message">${text}</span>`;
            }
        }
    } else {
        // رسالة نظامية منفصلة
        const messagesContainer = document.getElementById('chatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message system';
        msgDiv.innerHTML = `<div class="message-content system-message">${text}</div>`;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // إخفاء الرسالة بعد 3 ثواني
        setTimeout(() => {
            msgDiv.remove();
        }, 3000);
    }
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
    typingDiv.innerHTML = '<div class="message-content"><span class="typing-dots">⏳ جاري التفكير...</span></div>';
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

// إضافة CSS للأنماط الجديدة
const style = document.createElement('style');
style.textContent = `
    .typing-dots {
        color: #6c757d;
        font-style: italic;
    }
    .system-message {
        color: #ff8c00;
        font-size: 0.85rem;
        font-style: italic;
        text-align: center;
        display: block;
    }
    .message.system .message-content {
        background: transparent;
        text-align: center;
        padding: 5px;
        box-shadow: none;
    }
`;
document.head.appendChild(style);
