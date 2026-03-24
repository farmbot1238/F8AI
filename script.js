// استبدل دالة callGemini بهذه
async function callGemini(message) {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: message,
            systemPrompt: getSystemPrompt()
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Gemini API error');
    }
    
    const data = await response.json();
    return data.reply;
}

// استبدل دالة callOpenAI بهذه
async function callOpenAI(message) {
    const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: message,
            systemPrompt: getSystemPrompt()
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'OpenAI API error');
    }
    
    const data = await response.json();
    return data.reply;
}
