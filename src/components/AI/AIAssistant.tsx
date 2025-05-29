import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          context: messages.slice(-5) // Send last 5 messages for context
        })
      });
      
      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        role: 'system',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-dark-600 rounded-lg shadow-lg">
      <div className="p-4 border-b border-dark-500">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-primary-500" />
          <h2 className="text-lg font-semibold">AI Trading Assistant</h2>
        </div>
        <p className="mt-1 text-sm text-gray-400">
          Get real-time trading insights and market analysis
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : message.role === 'system'
                  ? 'bg-error-600/20 text-error-400'
                  : 'bg-dark-500 text-gray-200'
              }`}
            >
              {message.role === 'system' && (
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span className="font-medium">System Message</span>
                </div>
              )}
              <ReactMarkdown
                className="prose prose-invert max-w-none"
                components={{
                  p: ({ children }) => <p className="m-0">{children}</p>
                }}
              >
                {message.content}
              </ReactMarkdown>
              <div className="mt-1 text-xs opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {isLoading && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 text-gray-400">
              <Loader className="w-4 h-4 animate-spin" />
              <span>AI is thinking...</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-dark-500">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about market analysis, trading strategies, or stock recommendations..."
            className="flex-1 px-4 py-2 bg-dark-500 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;