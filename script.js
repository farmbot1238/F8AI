// LMJO 09 - المساعد الذكي للمواد الوزارية
// نظام مزدوج مع اتصال عبر Vercel API Functions

let currentSubject = 'all';

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    console.log('LMJO 09 جاهز للعمل ✅');
});

function setupEventListeners() {
    // أزرار المواد
    document.querySelectorAll('.subject-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSubject = btn.dataset.subject;
            document.getElementById('subjectTag').innerText = `الموضوع: ${getSubjectName(currentSubject)}`;
            console.log('تم تغيير المادة إلى:', getSubjectName(currentSubject));
        });
    });

    // إرسال الرسالة
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    console.log('تم إعداد الأزرار بنجاح');
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
    
    if (!message) {
        console.log('الرسالة فارغة');
        return;
    }
    
    console.log('تم إرسال السؤال:', message);
    
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
        updateTypingMessage(typingId, '🔄 جاري الاتصال بـ Gemini...');
        response = await callGemini(message);
        usedService = 'Gemini';
        console.log('تمت الإجابة عبر Gemini');
    } catch (geminiError) {
        console.log('Gemini فشل:', geminiError);
        updateTypingMessage(typingId, '⚠️ Gemini غير متاح، جاري التحويل إلى ChatGPT...');
        
        try {
            // المحاولة الثانية: OpenAI
            response = await callOpenAI(message);
            usedService = 'ChatGPT';
            console.log('تمت الإجابة عبر ChatGPT');
        } catch (openaiError) {
            console.log('OpenAI فشل:', openaiError);
            removeTypingIndicator(typingId);
            addMessage('❌ عذراً، كلا النظامين غير متاحين حالياً.\n\n🔧 يرجى المحاولة لاحقاً.', 'bot');
            return;
        }
    }
    
    removeTypingIndicator(typingId);
    addMessage(response, 'bot');
    
    if (usedService === 'ChatGPT') {
        addSystemMessage(`✨ تمت الإجابة عبر ${usedService}`);
    }
}

async function callGemini(message) {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: message,
            systemPrompt: getSystemPrompt()
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.reply) throw new Error('لم يتم الحصول على رد');
    return data.reply;
}

async function callOpenAI(message) {
    const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: message,
            systemPrompt: getSystemPrompt()
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.reply) throw new Error('لم يتم الحصول على رد');
    return data.reply;
}

function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `<div class="message-content">${formatText(text)}</div>`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addSystemMessage(text) {
    const messagesContainer = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message system';
    msgDiv.innerHTML = `<div class="message-content system-message">${text}</div>`;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    setTimeout(() => {
        if (msgDiv.parentNode) msgDiv.remove();
    }, 3000);
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

function updateTypingMessage(id, text) {
    const element = document.getElementById(id);
    if (element) {
        const contentDiv = element.querySelector('.message-content');
        if (contentDiv) {
            contentDiv.innerHTML = `<span class="typing-dots">${text}</span>`;
        }
    }
}

function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
}

// إضافة CSS للأنماط
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
