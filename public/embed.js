// Embeddable Chatbot Widget
(function() {
  'use strict';

  // Get the bot ID from the script tag
  const scriptTags = document.querySelectorAll('script[data-bot-id]');
  const currentScript = scriptTags[scriptTags.length - 1];
  const BOT_ID = currentScript.getAttribute('data-bot-id');
  
  if (!BOT_ID) {
    console.error('Conversion Bot: Missing data-bot-id attribute');
    return;
  }

  // Configuration
  const WIDGET_ID = `conversion-bot-${BOT_ID}`;
  const API_BASE = window.location.origin;
  
  // Generate unique session ID
  const SESSION_ID = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();

  // Widget state
  let isOpen = false;
  let botConfig = null;
  let messages = [];
  let isLoading = false;

  // Utility functions
  function createElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);
    Object.keys(attributes).forEach(key => {
      element.setAttribute(key, attributes[key]);
    });
    if (textContent) element.textContent = textContent;
    return element;
  }

  function generateId() {
    return 'msg_' + Math.random().toString(36).substr(2, 9);
  }

  // API functions
  async function fetchBotConfig() {
    try {
      const response = await fetch(`${API_BASE}/api/bot/${BOT_ID}/config`);
      if (response.ok) {
        botConfig = await response.json();
        return botConfig;
      }
      throw new Error('Failed to fetch bot config');
    } catch (error) {
      console.error('Error fetching bot config:', error);
      return null;
    }
  }

  async function sendMessage(message) {
    try {
      const response = await fetch(`${API_BASE}/api/bot/${BOT_ID}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: SESSION_ID,
          visitorInfo: {
            page: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.response;
      }
      throw new Error('Failed to send message');
    } catch (error) {
      console.error('Error sending message:', error);
      return botConfig?.fallbackMessage || "I'm sorry, I'm having trouble responding right now.";
    }
  }

  // Widget creation functions
  function createStyles() {
    const styles = `
      #${WIDGET_ID} {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        font-family: ${botConfig?.theme?.fontFamily || 'Inter, Arial, sans-serif'};
      }

      #${WIDGET_ID}-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${botConfig?.theme?.primaryColor || '#3B82F6'};
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      #${WIDGET_ID}-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
      }

      #${WIDGET_ID}-button svg {
        width: 24px;
        height: 24px;
        fill: white;
      }

      #${WIDGET_ID}-chat {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: ${botConfig?.theme?.borderRadius || '12px'};
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        display: none;
        flex-direction: column;
        overflow: hidden;
      }

      #${WIDGET_ID}-chat.open {
        display: flex;
      }

      #${WIDGET_ID}-header {
        background-color: ${botConfig?.theme?.primaryColor || '#3B82F6'};
        color: white;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      #${WIDGET_ID}-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      #${WIDGET_ID}-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
      }

      #${WIDGET_ID}-close:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      #${WIDGET_ID}-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .message {
        max-width: 80%;
        padding: 8px 12px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.4;
      }

      .message.user {
        background-color: ${botConfig?.theme?.primaryColor || '#3B82F6'};
        color: white;
        align-self: flex-end;
        margin-left: auto;
      }

      .message.bot {
        background-color: ${botConfig?.theme?.secondaryColor || '#F3F4F6'};
        color: #374151;
        align-self: flex-start;
      }

      .typing-indicator {
        display: flex;
        gap: 4px;
        padding: 8px 12px;
        background-color: ${botConfig?.theme?.secondaryColor || '#F3F4F6'};
        border-radius: 18px;
        align-self: flex-start;
      }

      .typing-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: #9CA3AF;
        animation: typing 1.4s infinite ease-in-out;
      }

      .typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .typing-dot:nth-child(3) { animation-delay: 0.4s; }

      @keyframes typing {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-10px); }
      }

      #${WIDGET_ID}-input-container {
        padding: 16px;
        border-top: 1px solid #E5E7EB;
        display: flex;
        gap: 8px;
      }

      #${WIDGET_ID}-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #D1D5DB;
        border-radius: 20px;
        outline: none;
        font-size: 14px;
      }

      #${WIDGET_ID}-input:focus {
        border-color: ${botConfig?.theme?.primaryColor || '#3B82F6'};
      }

      #${WIDGET_ID}-send {
        background-color: ${botConfig?.theme?.primaryColor || '#3B82F6'};
        color: white;
        border: none;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #${WIDGET_ID}-send:hover {
        opacity: 0.9;
      }

      #${WIDGET_ID}-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      @media (max-width: 768px) {
        #${WIDGET_ID}-chat {
          width: calc(100vw - 40px);
          height: calc(100vh - 40px);
          bottom: 20px;
          right: 20px;
        }
      }
    `;

    const styleElement = createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  function createWidget() {
    // Create main container
    const widget = createElement('div', { id: WIDGET_ID });

    // Create chat button
    const button = createElement('button', { id: `${WIDGET_ID}-button` });
    button.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
    `;
    button.addEventListener('click', toggleChat);

    // Create chat container
    const chat = createElement('div', { id: `${WIDGET_ID}-chat` });

    // Create header
    const header = createElement('div', { id: `${WIDGET_ID}-header` });
    const title = createElement('h3', {}, botConfig?.businessName || 'Chat Support');
    const closeButton = createElement('button', { id: `${WIDGET_ID}-close` });
    closeButton.innerHTML = '✕';
    closeButton.addEventListener('click', closeChat);
    header.appendChild(title);
    header.appendChild(closeButton);

    // Create messages container
    const messagesContainer = createElement('div', { id: `${WIDGET_ID}-messages` });

    // Create input container
    const inputContainer = createElement('div', { id: `${WIDGET_ID}-input-container` });
    const input = createElement('input', {
      id: `${WIDGET_ID}-input`,
      type: 'text',
      placeholder: 'Type your message...'
    });
    const sendButton = createElement('button', { id: `${WIDGET_ID}-send` });
    sendButton.innerHTML = '→';

    input.addEventListener('keypress', handleKeyPress);
    sendButton.addEventListener('click', handleSendMessage);

    inputContainer.appendChild(input);
    inputContainer.appendChild(sendButton);

    chat.appendChild(header);
    chat.appendChild(messagesContainer);
    chat.appendChild(inputContainer);

    widget.appendChild(button);
    widget.appendChild(chat);

    document.body.appendChild(widget);

    // Add welcome message
    if (botConfig?.welcomeMessage) {
      addMessage('bot', botConfig.welcomeMessage);
    }
  }

  function toggleChat() {
    const chat = document.getElementById(`${WIDGET_ID}-chat`);
    isOpen = !isOpen;
    
    if (isOpen) {
      chat.classList.add('open');
      // Focus input when opening
      setTimeout(() => {
        document.getElementById(`${WIDGET_ID}-input`).focus();
      }, 100);
    } else {
      chat.classList.remove('open');
    }
  }

  function closeChat() {
    const chat = document.getElementById(`${WIDGET_ID}-chat`);
    chat.classList.remove('open');
    isOpen = false;
  }

  function addMessage(sender, message) {
    const messagesContainer = document.getElementById(`${WIDGET_ID}-messages`);
    const messageElement = createElement('div', {
      class: `message ${sender}`,
      'data-id': generateId()
    }, message);
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    messages.push({ sender, message, timestamp: new Date() });
  }

  function showTypingIndicator() {
    const messagesContainer = document.getElementById(`${WIDGET_ID}-messages`);
    const typingElement = createElement('div', { class: 'typing-indicator', id: 'typing-indicator' });
    
    for (let i = 0; i < 3; i++) {
      typingElement.appendChild(createElement('div', { class: 'typing-dot' }));
    }
    
    messagesContainer.appendChild(typingElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function hideTypingIndicator() {
    const typingElement = document.getElementById('typing-indicator');
    if (typingElement) {
      typingElement.remove();
    }
  }

  async function handleSendMessage() {
    const input = document.getElementById(`${WIDGET_ID}-input`);
    const sendButton = document.getElementById(`${WIDGET_ID}-send`);
    const message = input.value.trim();

    if (!message || isLoading) return;

    // Add user message
    addMessage('user', message);
    input.value = '';
    
    // Disable input and show loading
    isLoading = true;
    input.disabled = true;
    sendButton.disabled = true;
    showTypingIndicator();

    try {
      // Send message to API
      const response = await sendMessage(message);
      
      // Remove typing indicator and add bot response
      hideTypingIndicator();
      addMessage('bot', response);
    } catch (error) {
      hideTypingIndicator();
      addMessage('bot', botConfig?.fallbackMessage || "I'm sorry, I'm having trouble responding right now.");
    } finally {
      // Re-enable input
      isLoading = false;
      input.disabled = false;
      sendButton.disabled = false;
      input.focus();
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  }

  // Initialize widget
  async function init() {
    try {
      // Fetch bot configuration
      await fetchBotConfig();
      
      if (!botConfig) {
        console.error('Conversion Bot: Failed to load bot configuration');
        return;
      }

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          createStyles();
          createWidget();
        });
      } else {
        createStyles();
        createWidget();
      }
    } catch (error) {
      console.error('Conversion Bot: Initialization failed', error);
    }
  }

  // Start initialization
  init();
})();
