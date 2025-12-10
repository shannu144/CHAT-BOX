const Message = require('../models/messageModel');
const User = require('../models/userModel');
const trainingData = require('./trainingData.json');

// Helper: Simple Levenshtein-like distance/overlap score
const getSimilarity = (s1, s2) => {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;

    const costs = new Array();
    for (let i = 0; i <= longer.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= shorter.length; j++) {
            if (i == 0) costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (longer.charAt(i - 1) != shorter.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[shorter.length] = lastValue;
    }
    return (longer.length - costs[shorter.length]) / parseFloat(longer.length);
};

const findBestMatch = (input) => {
    let bestMatch = null;
    let highestScore = 0;
    const lowerInput = input.toLowerCase().trim();

    trainingData.forEach(item => {
        const score = getSimilarity(lowerInput, item.input.toLowerCase());
        if (score > highestScore) {
            highestScore = score;
            bestMatch = item;
        }
    });

    // Threshold for valid match (e.g., 60% similarity)
    return highestScore > 0.4 ? bestMatch : null;
};

const { GoogleGenerativeAI } = require("@google/generative-ai");

const generateAIResponse = async (chatId, userMessage) => {
    try {
        // Priority 1: Check training data (Fast & Custom)
        const match = findBestMatch(userMessage);
        if (match && match.score > 0.8) { // High confidence match only
            return match.output;
        }

        // Priority 2: Use Real AI (Gemini) if Key exists and is valid
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith("AIza")) {
            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({
                    model: "gemini-1.5-flash-latest"
                });

                // Context Prompt
                const prompt = `You are VITCHAT Bot, a helpful and friendly AI assistant for the VITCHAT application. 
                User says: "${userMessage}". 
                Reply briefly and helpfully in plain text (no markdown).`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();
                return text;
            } catch (apiError) {
                console.error("Gemini API Error:", apiError.message);
                // Fall through to fuzzy match if API fails
            }
        } else if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith("AIza")) {
            console.log("Invalid Gemini Key format detected (should start with AIza)");
        }

        // Priority 3: Fuzzy Match (Lower confidence)
        if (match) {
            return match.output;
        }

        // Fallback for unknown
        const lowerMsg = userMessage.toLowerCase();
        if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
            return "Hello! I am VITCHAT Bot. Ask me anything about this app!";
        }

        return "I'm not sure about that. Connect me to Gemini AI (add GEMINI_API_KEY starting with 'AIza') to make me smarter!";

    } catch (error) {
        console.error("AI Error Details:", error);
        // Return the actual error to the chat for simpler debugging
        return `AI Error: ${error.message || "Something went wrong"}`;
    }
};

module.exports = { generateAIResponse };
