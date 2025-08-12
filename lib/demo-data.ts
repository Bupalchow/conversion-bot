// Demo data for development and testing purposes
import { Bot, ChatMessage, ChatSession } from './db';

export const demoBots: Bot[] = [
  {
    id: 'demo-bot-1',
    userId: 'demo-user',
    botName: 'Demo Sales Assistant',
    website: 'https://example.com',
    businessName: 'Demo Business',
    businessDescription: 'A sample business for demonstration purposes',
    businessType: 'E-commerce',
    targetAudience: 'Online shoppers looking for quality products',
    keyProducts: 'Digital products, subscriptions, and premium services',
    conversationGoals: 'Generate leads, provide product information, and guide users to purchase',
    brandTone: 'Friendly, professional, and helpful',
    customInstructions: 'Always be helpful and guide users toward making a purchase. Provide detailed product information when asked.',
    welcomeMessage: 'Hello! Welcome to Demo Business. How can I help you find the perfect product today?',
    fallbackMessage: 'I didn\'t quite understand that. Could you please rephrase your question?',
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      fontFamily: 'Inter',
      borderRadius: '8px'
    },
    isActive: true,
    createdAt: new Date('2024-01-15'),
    lastModified: new Date('2024-01-20')
  },
  {
    id: 'demo-bot-2',
    userId: 'demo-user',
    botName: 'Support Helper',
    website: 'https://support-demo.com',
    businessName: 'Tech Support Co',
    businessDescription: 'Providing technical support and customer service solutions',
    businessType: 'SaaS',
    targetAudience: 'Software users needing technical assistance',
    keyProducts: 'Technical support, troubleshooting guides, and premium support plans',
    conversationGoals: 'Resolve customer issues, provide technical guidance, and reduce support ticket volume',
    brandTone: 'Professional, patient, and solution-oriented',
    customInstructions: 'Focus on solving technical problems step-by-step. Always ask clarifying questions when needed.',
    welcomeMessage: 'Hi there! I\'m here to help with any technical questions or issues you might have.',
    fallbackMessage: 'I\'m not sure about that. Let me connect you with a human support agent who can better assist you.',
    theme: {
      primaryColor: '#059669',
      secondaryColor: '#047857',
      fontFamily: 'Roboto',
      borderRadius: '12px'
    },
    isActive: true,
    createdAt: new Date('2024-01-10'),
    lastModified: new Date('2024-01-18')
  }
];

export const demoChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    botId: 'demo-bot-1',
    sessionId: 'session-1',
    message: 'Hello! Welcome to Demo Business. How can I help you find the perfect product today?',
    sender: 'bot',
    timestamp: new Date('2024-01-20T10:00:00'),
    visitorInfo: {
      page: 'https://example.com',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  },
  {
    id: 'msg-2',
    botId: 'demo-bot-1',
    sessionId: 'session-1',
    message: 'I\'m looking for a good laptop for work',
    sender: 'user',
    timestamp: new Date('2024-01-20T10:01:00'),
    visitorInfo: {
      page: 'https://example.com',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  },
  {
    id: 'msg-3',
    botId: 'demo-bot-1',
    sessionId: 'session-1',
    message: 'Great choice! For work laptops, I\'d recommend looking at our business series. What type of work will you be using it for?',
    sender: 'bot',
    timestamp: new Date('2024-01-20T10:01:30'),
    visitorInfo: {
      page: 'https://example.com',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }
];

export const demoChatSessions: ChatSession[] = [
  {
    id: 'session-1',
    botId: 'demo-bot-1',
    sessionId: 'session-1',
    startTime: new Date('2024-01-20T10:00:00'),
    endTime: new Date('2024-01-20T10:15:00'),
    messageCount: 8,
    converted: true,
    visitorInfo: {
      page: 'https://example.com',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ip: '192.168.1.1'
    }
  },
  {
    id: 'session-2',
    botId: 'demo-bot-1',
    sessionId: 'session-2',
    startTime: new Date('2024-01-20T14:30:00'),
    endTime: new Date('2024-01-20T14:35:00'),
    messageCount: 4,
    converted: false,
    visitorInfo: {
      page: 'https://example.com/products',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
      ip: '192.168.1.2'
    }
  }
];

export const getDemoAnalytics = (botId: string) => {
  const sessions = demoChatSessions.filter(s => s.botId === botId);
  const messages = demoChatMessages.filter(m => m.botId === botId);
  
  return {
    totalSessions: sessions.length,
    totalMessages: messages.length,
    conversions: sessions.filter(s => s.converted).length,
    conversionRate: sessions.length > 0 ? (sessions.filter(s => s.converted).length / sessions.length) * 100 : 0,
    avgSessionDuration: sessions.reduce((acc, s) => {
      if (s.endTime) {
        return acc + (s.endTime.getTime() - s.startTime.getTime());
      }
      return acc;
    }, 0) / sessions.length / 1000 / 60, // in minutes
    sessions,
    messages
  };
};
