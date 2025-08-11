import { GoogleGenerativeAI } from '@google/generative-ai';
import { Bot } from './db';

// Validate API key on module load
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
  console.warn('Gemini API key is not configured. Bot responses will use fallback messages.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface ChatContext {
  bot: Bot;
  chatHistory: Array<{ role: 'user' | 'model'; parts: string }>;
  userMessage: string;
  visitorInfo?: {
    page?: string;
    userAgent?: string;
  };
}

const formatChatHistory = (history: Array<{ role: 'user' | 'model'; parts: string }>): string => {
  if (!history || history.length === 0) {
    return 'No previous conversation.';
  }

  return history
    .map(msg => `${msg.role.toUpperCase()}: ${msg.parts}`)
    .join('\n');
};

const createSystemPrompt = (bot: Bot): string => {
  return `You are an AI sales assistant for ${bot.businessName}. Here's your business context:

BUSINESS INFORMATION:
- Business Name: ${bot.businessName}
- Business Type: ${bot.businessType}
- Description: ${bot.businessDescription}
- Website: ${bot.website}
- Target Audience: ${bot.targetAudience}
- Key Products/Services: ${bot.keyProducts}

CONVERSATION GOALS: ${bot.conversationGoals}

BRAND TONE: ${bot.brandTone}

CUSTOM INSTRUCTIONS: ${bot.customInstructions}

GUIDELINES:
1. Always stay in character as a representative of ${bot.businessName}
2. Be helpful, friendly, and professional
3. Focus on understanding the visitor's needs and how your business can help
4. Ask qualifying questions to understand their requirements better
5. When appropriate, try to capture their contact information
6. If you don't know something specific, be honest but redirect to how you can help
7. Keep responses concise but informative (2-3 sentences max usually)
8. Always try to move the conversation toward your business goals: ${bot.conversationGoals}
9. Use the brand tone: ${bot.brandTone}
10. If the user asks about pricing, competition, or technical details you're unsure about, suggest they speak with a human team member

Remember: Your goal is to be helpful and build trust while guiding visitors toward ${bot.conversationGoals}.`;
};

export const generateBotResponse = async (context: ChatContext): Promise<string> => {
  // Input validation
  if (!context || !context.bot || !context.userMessage) {
    throw new Error('Invalid chat context provided');
  }

  if (!genAI) {
    console.warn('Gemini AI not initialized, using fallback message');
    return context.bot.fallbackMessage || "I'm sorry, I'm having trouble responding right now.";
  }

  try {
    // Sanitize user input
    const sanitizedMessage = context.userMessage.trim().slice(0, 1000); // Limit message length
    if (!sanitizedMessage) {
      return "I didn't receive your message. Could you please try again?";
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const systemPrompt = createSystemPrompt(context.bot);
    const conversationHistory = formatChatHistory(context.chatHistory);
    
    const prompt = `${systemPrompt}

CONVERSATION HISTORY:
${conversationHistory}

CURRENT USER MESSAGE: ${sanitizedMessage}

VISITOR CONTEXT:
- Current page: ${context.visitorInfo?.page || 'Unknown'}
- User agent: ${context.visitorInfo?.userAgent || 'Unknown'}

Please respond as the AI assistant for ${context.bot.businessName}. Keep your response conversational, helpful, and focused on the business goals. Always try to guide the conversation toward ${context.bot.conversationGoals}.

IMPORTANT: Keep responses under 200 words and be direct and helpful.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Validate response
    if (!text || text.trim().length === 0) {
      console.warn('Empty response from Gemini, using fallback');
      return context.bot.fallbackMessage || "I'm not sure how to respond to that. Could you tell me more about what you're looking for?";
    }

    // Sanitize and limit response length
    const sanitizedResponse = text.trim().slice(0, 500);
    return sanitizedResponse;

  } catch (error) {
    console.error('Error generating bot response:', error);
    
    // Different error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        return "I'm experiencing technical difficulties with my AI service. Please try again later.";
      }
      if (error.message.includes('QUOTA')) {
        return "I'm currently experiencing high demand. Please try again in a moment.";
      }
      if (error.message.includes('SAFETY')) {
        return "I can't respond to that type of message. Let's talk about how I can help you with our products or services.";
      }
    }
    
    return context.bot.fallbackMessage || "I'm having trouble responding right now. Can you tell me more about what you're looking for?";
  }
};

export const validateApiKey = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
};

export const testGeminiConnection = async (): Promise<boolean> => {
  try {
    if (!validateApiKey() || !genAI) {
      return false;
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Hello, this is a test message.');
    const response = await result.response;
    const text = response.text();
    
    return !!(text && text.length > 0);
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
};
