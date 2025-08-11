'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../../firebase';
import { createBot } from '../../../lib/db';

export default function CreateBot() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  // Form data
  const [formData, setFormData] = useState({
    botName: '',
    website: '',
    businessName: '',
    businessDescription: '',
    businessType: '',
    targetAudience: '',
    keyProducts: '',
    conversationGoals: 'Generate leads and increase conversions',
    brandTone: 'friendly',
    customInstructions: '',
    welcomeMessage: 'Hi! How can I help you today?',
    fallbackMessage: "I'm not sure about that. Can you tell me more about what you're looking for?",
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#F3F4F6',
      fontFamily: 'Inter',
      borderRadius: '8px'
    }
  });

  // Validation functions
  const validateStep = (step: number): Record<string, string> => {
    const stepErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.botName.trim()) {
          stepErrors.botName = 'Bot name is required';
        } else if (formData.botName.length < 3) {
          stepErrors.botName = 'Bot name must be at least 3 characters';
        }

        if (!formData.website.trim()) {
          stepErrors.website = 'Website URL is required';
        } else if (!isValidUrl(formData.website)) {
          stepErrors.website = 'Please enter a valid URL (including http:// or https://)';
        }

        if (!formData.businessName.trim()) {
          stepErrors.businessName = 'Business name is required';
        } else if (formData.businessName.length < 2) {
          stepErrors.businessName = 'Business name must be at least 2 characters';
        }
        break;

      case 2:
        if (!formData.businessDescription.trim()) {
          stepErrors.businessDescription = 'Business description is required';
        } else if (formData.businessDescription.length < 20) {
          stepErrors.businessDescription = 'Please provide a more detailed description (at least 20 characters)';
        }

        if (!formData.businessType) {
          stepErrors.businessType = 'Please select a business type';
        }

        if (!formData.targetAudience.trim()) {
          stepErrors.targetAudience = 'Target audience description is required';
        } else if (formData.targetAudience.length < 10) {
          stepErrors.targetAudience = 'Please provide more detail about your target audience';
        }
        break;

      case 3:
        if (!formData.keyProducts.trim()) {
          stepErrors.keyProducts = 'Please describe your key products or services';
        } else if (formData.keyProducts.length < 20) {
          stepErrors.keyProducts = 'Please provide more detail about your products/services';
        }
        break;

      case 4:
        if (!formData.welcomeMessage.trim()) {
          stepErrors.welcomeMessage = 'Welcome message is required';
        }
        if (!formData.fallbackMessage.trim()) {
          stepErrors.fallbackMessage = 'Fallback message is required';
        }
        break;
    }

    return stepErrors;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleThemeChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        [field]: value
      }
    }));
  };

  const handleCreateBot = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const botId = await createBot(user.uid, formData.botName, formData.website, formData);
      console.log('Bot created with ID:', botId);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating bot:', error);
      alert('Failed to create bot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    const stepErrors = validateStep(currentStep);
    setErrors(stepErrors);

    if (Object.keys(stepErrors).length === 0 && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.botName && formData.website && formData.businessName;
      case 2:
        return formData.businessDescription && formData.businessType && formData.targetAudience;
      case 3:
        return formData.keyProducts && formData.conversationGoals;
      case 4:
        return true;
      default:
        return false;
    }
  };

  if (!user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your AI Chatbot</h1>
            <p className="text-gray-600">Set up your intelligent sales assistant in just a few steps</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Name *
                </label>
                <input
                  type="text"
                  value={formData.botName}
                  onChange={(e) => handleInputChange('botName', e.target.value)}
                  placeholder="e.g., SalesBot Pro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.botName && <p className="text-red-500 text-sm mt-1">{errors.botName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL *
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.website && <p className="text-red-500 text-sm mt-1">{errors.website}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Your Company Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Business Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description *
                </label>
                <textarea
                  value={formData.businessDescription}
                  onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                  placeholder="Describe what your business does, your mission, and what makes you unique..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.businessDescription && <p className="text-red-500 text-sm mt-1">{errors.businessDescription}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type *
                </label>
                <select
                  value={formData.businessType}
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
                {errors.businessType && <p className="text-red-500 text-sm mt-1">{errors.businessType}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience *
                </label>
                <textarea
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  placeholder="Who are your ideal customers? Include demographics, pain points, and interests..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.targetAudience && <p className="text-red-500 text-sm mt-1">{errors.targetAudience}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Sales Strategy */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Sales Strategy</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Products/Services *
                </label>
                <textarea
                  value={formData.keyProducts}
                  onChange={(e) => handleInputChange('keyProducts', e.target.value)}
                  placeholder="List your main products or services, including pricing if appropriate..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.keyProducts && <p className="text-red-500 text-sm mt-1">{errors.keyProducts}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conversation Goals *
                </label>
                <select
                  value={formData.conversationGoals}
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
                  value={formData.brandTone}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Instructions
                </label>
                <textarea
                  value={formData.customInstructions}
                  onChange={(e) => handleInputChange('customInstructions', e.target.value)}
                  placeholder="Any specific instructions for how the bot should behave or respond..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 4: Customization */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Customization</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Welcome Message
                </label>
                <input
                  type="text"
                  value={formData.welcomeMessage}
                  onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.welcomeMessage && <p className="text-red-500 text-sm mt-1">{errors.welcomeMessage}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fallback Message
                </label>
                <input
                  type="text"
                  value={formData.fallbackMessage}
                  onChange={(e) => handleInputChange('fallbackMessage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.fallbackMessage && <p className="text-red-500 text-sm mt-1">{errors.fallbackMessage}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    value={formData.theme.primaryColor}
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
                    value={formData.theme.secondaryColor}
                    onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  value={formData.theme.fontFamily}
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
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-md ${
                currentStep === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                disabled={!isStepValid()}
                className={`px-6 py-2 rounded-md ${
                  isStepValid()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreateBot}
                disabled={loading || !isStepValid()}
                className={`px-6 py-2 rounded-md ${
                  loading || !isStepValid()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {loading ? 'Creating...' : 'Create Bot'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
