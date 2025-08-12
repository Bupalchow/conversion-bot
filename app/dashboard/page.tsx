'use client'

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../firebase';
import { getBots, deleteBot, Bot } from '../../lib/db';
import { signOut } from '../../lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      // Demo mode - show demo data
      setDemoMode(true);
      setUser({ uid: 'demo-user', email: 'demo@example.com' } as User);
      setBots([
        {
          id: 'demo-bot-1',
          userId: 'demo-user',
          botName: 'Demo Sales Assistant',
          website: 'https://example.com',
          businessName: 'Demo Business',
          businessDescription: 'A sample business for demonstration',
          businessType: 'E-commerce',
          targetAudience: 'Online shoppers',
          keyProducts: 'Digital products',
          conversationGoals: 'Generate leads and sales',
          brandTone: 'Friendly and professional',
          customInstructions: 'Be helpful and guide users to purchase',
          welcomeMessage: 'Hello! How can I help you today?',
          fallbackMessage: 'I didn\'t understand. Can you rephrase?',
          theme: {
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF',
            fontFamily: 'Inter',
            borderRadius: '8px'
          },
          isActive: true,
          createdAt: new Date(),
          lastModified: new Date()
        }
      ]);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchBots(user.uid);
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchBots = async (userId: string) => {
    setLoading(true);
    try {
      const userBots = await getBots(userId);
      setBots(userBots);
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    if (demoMode) {
      alert('This is a demo. Bot deletion is not available in demo mode.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this bot?')) {
      try {
        await deleteBot(botId);
        setBots(bots.filter(bot => bot.id !== botId));
      } catch (error) {
        console.error('Error deleting bot:', error);
        alert('Failed to delete bot. Please try again.');
      }
    }
  };

  const handleSignOut = async () => {
    if (demoMode) {
      router.push('/');
      return;
    }
    
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getEmbedCode = (botId: string) => {
    const embedCode = `<script>
(function() {
  var script = document.createElement('script');
  script.src = '${window.location.origin}/embed.js';
  script.async = true;
  script.setAttribute('data-bot-id', '${botId}');
  document.head.appendChild(script);
})();
</script>`;
    return embedCode;
  };

  const copyEmbedCode = (botId: string) => {
    const code = getEmbedCode(botId);
    navigator.clipboard.writeText(code).then(() => {
      alert('Embed code copied to clipboard!');
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Conversion Bot Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.displayName || user?.email}</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Mode Notice */}
      {demoMode && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Demo Mode:</strong> You&apos;re viewing demo data. To access full functionality with your own bots, 
                  please configure Firebase authentication and database credentials.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{bots.length}</div>
            <div className="text-sm text-gray-600">Total Bots</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{bots.filter(bot => bot.isActive).length}</div>
            <div className="text-sm text-gray-600">Active Bots</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-600">Conversations Today</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">0%</div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
          </div>
        </div>

        {/* Bots Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Your Chatbots</h2>
              <Link
                href="/bot/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                + Create New Bot
              </Link>
            </div>
          </div>

          <div className="p-6">
            {bots.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-4">No chatbots yet</div>
                <p className="text-gray-600 mb-6">Create your first AI chatbot to get started</p>
                <Link
                  href="/bot/create"
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Your First Bot
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bots.map((bot) => (
                  <div key={bot.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{bot.botName}</h3>
                        <p className="text-sm text-gray-600">{bot.businessName}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        bot.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bot.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Website:</strong> {bot.website}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Type:</strong> {bot.businessType}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Goal:</strong> {bot.conversationGoals}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Link
                          href={`/bot/${bot.id}/chat`}
                          className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Test Chat
                        </Link>
                        <Link
                          href={`/bot/${bot.id}/edit`}
                          className="flex-1 bg-gray-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-gray-700 transition-colors"
                        >
                          Edit
                        </Link>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyEmbedCode(bot.id)}
                          className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          Copy Embed Code
                        </button>
                        <Link
                          href={`/bot/${bot.id}/analytics`}
                          className="flex-1 bg-purple-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-purple-700 transition-colors"
                        >
                          Analytics
                        </Link>
                      </div>

                      <button
                        onClick={() => handleDeleteBot(bot.id)}
                        className="w-full bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Delete Bot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
