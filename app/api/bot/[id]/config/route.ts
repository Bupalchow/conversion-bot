import { NextRequest, NextResponse } from 'next/server';
import { getBot } from '../../../../../lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const botId = params.id;
    const bot = await getBot(botId);

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    // Return public bot configuration
    const publicConfig = {
      id: bot.id,
      businessName: bot.businessName,
      welcomeMessage: bot.welcomeMessage,
      fallbackMessage: bot.fallbackMessage,
      theme: bot.theme,
      isActive: bot.isActive
    };

    return NextResponse.json(publicConfig);
  } catch (error) {
    console.error('Error fetching bot config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
