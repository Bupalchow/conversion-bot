import { db } from "../firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc, orderBy } from "firebase/firestore";

// Add retry mechanism for Firebase operations
const retryOperation = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
};

// Input validation helpers
const validateBotInput = (bot: Partial<Bot>): void => {
  if (!bot.botName || bot.botName.trim().length === 0) {
    throw new Error('Bot name is required');
  }
  if (!bot.businessName || bot.businessName.trim().length === 0) {
    throw new Error('Business name is required');
  }
  if (!bot.website || !isValidUrl(bot.website)) {
    throw new Error('Valid website URL is required');
  }
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export type Bot = {
  id: string;
  userId: string;
  botName: string;
  website: string;
  businessName: string;
  businessDescription: string;
  businessType: string;
  targetAudience: string;
  keyProducts: string;
  conversationGoals: string;
  brandTone: string;
  customInstructions: string;
  welcomeMessage: string;
  fallbackMessage: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    borderRadius: string;
  };
  isActive: boolean;
  createdAt: Date;
  lastModified: Date;
};

export type ChatMessage = {
  id: string;
  botId: string;
  sessionId: string;
  message: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  visitorInfo?: {
    ip?: string;
    userAgent?: string;
    page?: string;
  };
};

export type ChatSession = {
  id: string;
  botId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  converted: boolean;
  visitorInfo?: {
    ip?: string;
    userAgent?: string;
    page?: string;
  };
};

export const createBot = async (
  userId: string, 
  botName: string, 
  website: string,
  businessInfo: Partial<Bot> = {}
) => {
  try {
    // Input validation
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    const defaultBot: Omit<Bot, 'id'> = {
      userId,
      botName: botName.trim(),
      website: website.trim(),
      businessName: businessInfo.businessName || '',
      businessDescription: businessInfo.businessDescription || '',
      businessType: businessInfo.businessType || '',
      targetAudience: businessInfo.targetAudience || '',
      keyProducts: businessInfo.keyProducts || '',
      conversationGoals: businessInfo.conversationGoals || 'Generate leads and increase conversions',
      brandTone: businessInfo.brandTone || 'friendly',
      customInstructions: businessInfo.customInstructions || '',
      welcomeMessage: businessInfo.welcomeMessage || 'Hi! How can I help you today?',
      fallbackMessage: businessInfo.fallbackMessage || "I'm not sure about that. Can you tell me more about what you're looking for?",
      theme: businessInfo.theme || {
        primaryColor: '#3B82F6',
        secondaryColor: '#F3F4F6',
        fontFamily: 'Inter',
        borderRadius: '8px'
      },
      isActive: true,
      createdAt: new Date(),
      lastModified: new Date(),
    };

    validateBotInput(defaultBot);

    const docRef = await retryOperation(() => addDoc(collection(db, "bots"), defaultBot));
    return docRef.id;
  } catch (error) {
    console.error("Error creating bot: ", error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create bot');
  }
};

export const getBots = async (userId: string): Promise<Bot[]> => {
  try {
    const q = query(
      collection(db, "bots"), 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data() 
    } as Bot));
  } catch (error) {
    console.error("Error getting bots: ", error);
    return [];
  }
};

export const getBot = async (botId: string): Promise<Bot | null> => {
  try {
    const docRef = doc(db, "bots", botId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Bot;
    }
    return null;
  } catch (error) {
    console.error("Error getting bot: ", error);
    return null;
  }
};

export const updateBot = async (botId: string, updates: Partial<Bot>) => {
  try {
    const botRef = doc(db, "bots", botId);
    await updateDoc(botRef, {
      ...updates,
      lastModified: new Date(),
    });
  } catch (error) {
    console.error("Error updating bot: ", error);
    throw error;
  }
};

export const deleteBot = async (botId: string) => {
  try {
    await deleteDoc(doc(db, "bots", botId));
  } catch (error) {
    console.error("Error deleting bot: ", error);
    throw error;
  }
};

// Chat Management Functions
export const saveChatMessage = async (message: Omit<ChatMessage, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, "chat_messages"), {
      ...message,
      timestamp: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving chat message: ", error);
    throw error;
  }
};

export const getChatHistory = async (botId: string, sessionId: string): Promise<ChatMessage[]> => {
  try {
    const q = query(
      collection(db, "chat_messages"),
      where("botId", "==", botId),
      where("sessionId", "==", sessionId),
      orderBy("timestamp", "asc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    } as ChatMessage));
  } catch (error) {
    console.error("Error getting chat history: ", error);
    return [];
  }
};

export const createChatSession = async (session: Omit<ChatSession, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, "chat_sessions"), {
      ...session,
      startTime: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating chat session: ", error);
    throw error;
  }
};

export const updateChatSession = async (sessionId: string, updates: Partial<ChatSession>) => {
  try {
    const sessionRef = doc(db, "chat_sessions", sessionId);
    await updateDoc(sessionRef, updates);
  } catch (error) {
    console.error("Error updating chat session: ", error);
    throw error;
  }
};

export const getBotAnalytics = async (botId: string, days: number = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessionsQuery = query(
      collection(db, "chat_sessions"),
      where("botId", "==", botId),
      where("startTime", ">=", startDate)
    );

    const messagesQuery = query(
      collection(db, "chat_messages"),
      where("botId", "==", botId),
      where("timestamp", ">=", startDate)
    );

    const [sessionsSnapshot, messagesSnapshot] = await Promise.all([
      getDocs(sessionsQuery),
      getDocs(messagesQuery)
    ]);

    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ChatSession));

    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ChatMessage));

    const totalSessions = sessions.length;
    const totalMessages = messages.length;
    const conversions = sessions.filter(s => s.converted).length;
    const averageMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0;
    const conversionRate = totalSessions > 0 ? (conversions / totalSessions) * 100 : 0;

    return {
      totalSessions,
      totalMessages,
      conversions,
      conversionRate,
      averageMessagesPerSession,
      sessions,
      messages
    };
  } catch (error) {
    console.error("Error getting bot analytics: ", error);
    return null;
  }
};
