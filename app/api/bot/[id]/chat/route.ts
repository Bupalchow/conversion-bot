import { NextRequest, NextResponse } from 'next/server';
import { getBot, saveChatMessage, createChatSession } from '../../../../../lib/db';
import { generateBotResponse } from '../../../../../lib/gemini';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const botId = params.id;
    const body = await request.json();
    const { message, sessionId, visitorInfo } = body;

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400 }
      );
    }

    // Get bot configuration
    const bot = await getBot(botId);
    if (!bot || !bot.isActive) {
      return NextResponse.json(
        { error: 'Bot not found or inactive' },
        { status: 404 }
      );
    }

    // Save user message
    const userMessageId = await saveChatMessage({
      botId,
      sessionId,
      message,
      sender: 'user',
      visitorInfo,
      timestamp: new Date()
    });

    // Create chat session if this is the first message
    try {
      await createChatSession({
        botId,
        sessionId,
        startTime: new Date(),
        messageCount: 1,
        converted: false,
        visitorInfo
      });
    } catch (error) {
      // Session might already exist, that's ok
      console.log('Session might already exist:', error);
    }

    // Generate bot response
    let botResponse;
    try {
      botResponse = await generateBotResponse({
        bot,
        chatHistory: [], // We could fetch recent history here if needed
        userMessage: message,
        visitorInfo
      });
    } catch (error) {
      console.error('Error generating bot response:', error);
      botResponse = bot.fallbackMessage;
    }

    // Save bot message
    await saveChatMessage({
      botId,
      sessionId,
      message: botResponse,
      sender: 'bot',
      timestamp: new Date()
    });

    return NextResponse.json({
      response: botResponse,
      messageId: userMessageId
    });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
