'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../../firebase';
import { getBot, saveChatMessage, getChatHistory, Bot, ChatMessage } from '../../../../lib/db';
import { generateBotResponse } from '../../../../lib/gemini';
import { v4 as uuidv4 } from 'uuid';

export default function BotChat() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const [bot, setBot] = useState<Bot | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(uuidv4());

  useEffect(() => {
    const loadBot = async () => {
      try {
        const botData = await getBot(botId);
        if (botData) {
          setBot(botData);
          // Load chat history
          const history = await getChatHistory(botId, sessionId);
          setMessages(history);
          
          // If no history, send welcome message
          if (history.length === 0) {
            const welcomeMessage: ChatMessage = {
              id: uuidv4(),
              botId,
              sessionId,
              message: botData.welcomeMessage,
              sender: 'bot',
              timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
            await saveChatMessage(welcomeMessage);
          }
        } else {
          alert('Bot not found');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error loading bot:', error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        loadBot();
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [botId, router, sessionId]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !bot || isLoading) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      botId,
      sessionId,
      message: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    await saveChatMessage(userMessage);

    const currentMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Generate bot response using Gemini
      const chatHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'model' as const,
        parts: msg.message
      }));

      const response = await generateBotResponse({
        bot,
        chatHistory,
        userMessage: currentMessage,
        visitorInfo: {
          page: 'Chat Test Interface',
          userAgent: navigator.userAgent
        }
      });

      const botMessage: ChatMessage = {
        id: uuidv4(),
        botId,
        sessionId,
        message: response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      await saveChatMessage(botMessage);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        botId,
        sessionId,
        message: bot.fallbackMessage,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      await saveChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      if (bot) {
        const welcomeMessage: ChatMessage = {
          id: uuidv4(),
          botId,
          sessionId: uuidv4(), // New session
          message: bot.welcomeMessage,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        await saveChatMessage(welcomeMessage);
      }
    }
  };

  if (!bot) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Testing: {bot.botName}</h1>
            <p className="text-sm text-gray-600">{bot.businessName}</p>
          </div>
          <div className="space-x-4">
            <button
              onClick={clearChat}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Chat
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="flex-1 flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                  style={{
                    backgroundColor: message.sender === 'bot' ? bot.theme.secondaryColor : bot.theme.primaryColor,
                    color: message.sender === 'bot' ? '#374151' : 'white',
                    borderRadius: bot.theme.borderRadius,
                    fontFamily: bot.theme.fontFamily
                  }}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t bg-white p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={`px-6 py-2 rounded-md ${
                  inputMessage.trim() && !isLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                style={{
                  backgroundColor: inputMessage.trim() && !isLoading ? bot.theme.primaryColor : undefined
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Bot Info Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bot Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Business Name</label>
              <p className="text-sm text-gray-900">{bot.businessName}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Business Type</label>
              <p className="text-sm text-gray-900">{bot.businessType}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Website</label>
              <p className="text-sm text-gray-900">{bot.website}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Conversation Goals</label>
              <p className="text-sm text-gray-900">{bot.conversationGoals}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Brand Tone</label>
              <p className="text-sm text-gray-900 capitalize">{bot.brandTone}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Theme</label>
              <div className="flex space-x-2 mt-1">
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: bot.theme.primaryColor }}
                  title="Primary Color"
                ></div>
                <div
                  className="w-8 h-8 rounded border"
                  style={{ backgroundColor: bot.theme.secondaryColor }}
                  title="Secondary Color"
                ></div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Target Audience</label>
              <p className="text-sm text-gray-900">{bot.targetAudience}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Test Instructions</h4>
            <p className="text-xs text-gray-600">
              This is a test environment for your chatbot. Try different conversation scenarios to see how your bot responds. The bot will use Gemini AI to generate contextual responses based on your business information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
