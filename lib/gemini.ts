import { GoogleGenerativeAI } from '@google/generative-ai';
import { Bot } from './db';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export interface ChatContext {
  bot: Bot;
  chatHistory: Array<{ role: 'user' | 'model'; parts: string }>;
  userMessage: string;
  visitorInfo?: {
    page?: string;
    userAgent?: string;
  };
}

export const generateBotResponse = async (context: ChatContext): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const systemPrompt = createSystemPrompt(context.bot);
    const conversationHistory = formatChatHistory(context.chatHistory);
    
    const prompt = `${systemPrompt}

CONVERSATION HISTORY:
${conversationHistory}

CURRENT USER MESSAGE: ${context.userMessage}

VISITOR CONTEXT:
- Current page: ${context.visitorInfo?.page || 'Unknown'}
- User agent: ${context.visitorInfo?.userAgent || 'Unknown'}

Please respond as the AI assistant for ${context.bot.businessName}. Keep your response conversational, helpful, and focused on the business goals. Always try to guide the conversation toward ${context.bot.conversationGoals}.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Fallback to default message if response is empty or problematic
    if (!text || text.trim().length === 0) {
      return context.bot.fallbackMessage;
    }

    return text.trim();
  } catch (error) {
    console.error('Error generating bot response:', error);
    return context.bot.fallbackMessage;
  }
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

const formatChatHistory = (history: Array<{ role: 'user' | 'model'; parts: string }>): string => {
  if (!history || history.length === 0) {
    return 'No previous conversation.';
  }

  return history
    .map(msg => `${msg.role.toUpperCase()}: ${msg.parts}`)
    .join('\n');
};

export const validateApiKey = (): boolean => {
  return !!(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
};

export const testGeminiConnection = async (): Promise<boolean> => {
  try {
    if (!validateApiKey()) {
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
