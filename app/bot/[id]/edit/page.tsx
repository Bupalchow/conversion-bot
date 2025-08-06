'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../../firebase';
import { getBot, updateBot, Bot } from '../../../../lib/db';

export default function EditBot() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadBot = async () => {
      setLoading(true);
      try {
        const botData = await getBot(botId);
        if (botData) {
          setBot(botData);
        } else {
          alert('Bot not found');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error loading bot:', error);
      } finally {
        setLoading(false);
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
  }, [botId, router]);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (!bot) return;
    setBot({
      ...bot,
      [field]: value
    });
  };

  const handleThemeChange = (field: string, value: string) => {
    if (!bot) return;
    setBot({
      ...bot,
      theme: {
        ...bot.theme,
        [field]: value
      }
    });
  };

  const handleSave = async () => {
    if (!bot) return;

    setSaving(true);
    try {
      await updateBot(botId, bot);
      alert('Bot updated successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating bot:', error);
      alert('Failed to update bot. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!bot) {
    return <div className="flex justify-center items-center h-screen">Bot not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit {bot.botName}</h1>
                <p className="text-gray-600">Update your chatbot configuration</p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {/* Basic Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bot Name
                  </label>
                  <input
                    type="text"
                    value={bot.botName}
                    onChange={(e) => handleInputChange('botName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={bot.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={bot.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type
                  </label>
                  <select
                    value={bot.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select business type</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="SaaS">SaaS</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Finance">Finance</option>
                    <option value="Technology">Technology</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description
                </label>
                <textarea
                  value={bot.businessDescription}
                  onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </section>

            {/* Target Audience & Products */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Details</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <textarea
                    value={bot.targetAudience}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Products/Services
                  </label>
                  <textarea
                    value={bot.keyProducts}
                    onChange={(e) => handleInputChange('keyProducts', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Conversation Settings */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Conversation Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conversation Goals
                  </label>
                  <select
                    value={bot.conversationGoals}
                    onChange={(e) => handleInputChange('conversationGoals', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Generate leads and increase conversions">Generate leads and increase conversions</option>
                    <option value="Provide customer support">Provide customer support</option>
                    <option value="Schedule appointments">Schedule appointments</option>
                    <option value="Collect contact information">Collect contact information</option>
                    <option value="Answer product questions">Answer product questions</option>
                    <option value="Guide users to purchase">Guide users to purchase</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Tone
                  </label>
                  <select
                    value={bot.brandTone}
                    onChange={(e) => handleInputChange('brandTone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="friendly">Friendly</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="enthusiastic">Enthusiastic</option>
                    <option value="helpful">Helpful</option>
                    <option value="authoritative">Authoritative</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Instructions
                  </label>
                  <textarea
                    value={bot.customInstructions}
                    onChange={(e) => handleInputChange('customInstructions', e.target.value)}
                    rows={3}
                    placeholder="Any specific instructions for how the bot should behave..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Messages */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bot Messages</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Welcome Message
                  </label>
                  <input
                    type="text"
                    value={bot.welcomeMessage}
                    onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fallback Message
                  </label>
                  <input
                    type="text"
                    value={bot.fallbackMessage}
                    onChange={(e) => handleInputChange('fallbackMessage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Theme Customization */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Theme Customization</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    value={bot.theme.primaryColor}
                    onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <input
                    type="color"
                    value={bot.theme.secondaryColor}
                    onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Family
                  </label>
                  <select
                    value={bot.theme.fontFamily}
                    onChange={(e) => handleThemeChange('fontFamily', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Border Radius
                  </label>
                  <select
                    value={bot.theme.borderRadius}
                    onChange={(e) => handleThemeChange('borderRadius', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="4px">4px (Small)</option>
                    <option value="8px">8px (Medium)</option>
                    <option value="12px">12px (Large)</option>
                    <option value="20px">20px (Extra Large)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Bot Status */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bot Status</h2>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={bot.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                  Bot is active and can respond to website visitors
                </label>
              </div>
            </section>
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-2 rounded-md ${
                  saving
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
