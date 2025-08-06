'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../../firebase';
import { getBot, getBotAnalytics, Bot } from '../../../../lib/db';

export default function BotAnalytics() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  // Remove unused user variable  
  const [bot, setBot] = useState<Bot | null>(null);
  const [analytics, setAnalytics] = useState<{
    totalSessions: number;
    totalMessages: number;
    conversions: number;
    conversionRate: number;
    averageMessagesPerSession: number;
    sessions: Array<{
      id: string;
      sessionId: string;
      messageCount: number;
      converted: boolean;
      startTime: Date | { seconds: number };
      visitorInfo?: { page?: string };
    }>;
    messages: Array<{
      id: string;
      message: string;
      sender: 'user' | 'bot';
      timestamp: Date;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [botData, analyticsData] = await Promise.all([
          getBot(botId),
          getBotAnalytics(botId, timeRange)
        ]);

        if (botData) {
          setBot(botData);
          setAnalytics(analyticsData);
        } else {
          alert('Bot not found');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        loadData();
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [botId, router, timeRange]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!bot || !analytics) {
    return <div className="flex justify-center items-center h-screen">Error loading data</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics: {bot.botName}</h1>
              <p className="text-sm text-gray-600">{bot.businessName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{analytics.totalSessions}</div>
            <div className="text-sm text-gray-600">Total Conversations</div>
            <div className="text-xs text-gray-500 mt-1">
              Last {timeRange} days
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{analytics.totalMessages}</div>
            <div className="text-sm text-gray-600">Total Messages</div>
            <div className="text-xs text-gray-500 mt-1">
              Avg: {analytics.averageMessagesPerSession.toFixed(1)} per conversation
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{analytics.conversions}</div>
            <div className="text-sm text-gray-600">Conversions</div>
            <div className="text-xs text-gray-500 mt-1">
              {analytics.conversionRate.toFixed(1)}% conversion rate
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">
              {analytics.totalSessions > 0 ? (analytics.totalMessages / analytics.totalSessions).toFixed(1) : 0}
            </div>
            <div className="text-sm text-gray-600">Avg Session Length</div>
            <div className="text-xs text-gray-500 mt-1">
              Messages per conversation
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Conversations */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Conversations</h3>
            </div>
            <div className="p-6">
              {analytics.sessions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No conversations yet</p>
              ) : (
                <div className="space-y-4">
                  {analytics.sessions.slice(0, 10).map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm text-gray-600">
                          Session {session.sessionId?.slice(-8)}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          session.converted 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.converted ? 'Converted' : 'Not Converted'}
                        </div>
                      </div>
                      <div className="text-sm text-gray-900 mb-1">
                        {session.messageCount} messages
                      </div>
                      <div className="text-xs text-gray-500">
                        {(() => {
                          if (session.startTime && typeof session.startTime === 'object' && 'seconds' in session.startTime) {
                            return new Date(session.startTime.seconds * 1000).toLocaleString();
                          }
                          return new Date(session.startTime).toLocaleString();
                        })()}
                      </div>
                      {session.visitorInfo?.page && (
                        <div className="text-xs text-gray-500 mt-1">
                          Page: {new URL(session.visitorInfo.page).pathname}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bot Configuration Summary */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Bot Configuration</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Business Type</label>
                <p className="text-sm text-gray-900">{bot.businessType}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Target Audience</label>
                <p className="text-sm text-gray-900">{bot.targetAudience}</p>
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
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className={`inline-flex px-2 py-1 rounded-full text-xs ${
                  bot.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {bot.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Website</label>
                <a 
                  href={bot.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {bot.website}
                </a>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/bot/${bot.id}/chat`)}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Test Chat
                  </button>
                  <button
                    onClick={() => router.push(`/bot/${bot.id}/edit`)}
                    className="flex-1 bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700 transition-colors"
                  >
                    Edit Bot
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        {analytics.totalSessions > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Performance Insights</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Conversation Quality</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average messages per conversation</span>
                      <span className="text-sm font-medium">{analytics.averageMessagesPerSession.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Conversion rate</span>
                      <span className="text-sm font-medium">{analytics.conversionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Recommendations</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    {analytics.averageMessagesPerSession < 3 && (
                      <p>• Consider improving your welcome message to encourage more engagement</p>
                    )}
                    {analytics.conversionRate < 5 && (
                      <p>• Review your conversation goals and bot training to improve conversion rate</p>
                    )}
                    {analytics.totalSessions < 10 && (
                      <p>• Promote your chatbot more prominently on your website</p>
                    )}
                    {analytics.totalSessions >= 10 && analytics.conversionRate > 10 && (
                      <p>• Great performance! Consider expanding to more pages or websites</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
