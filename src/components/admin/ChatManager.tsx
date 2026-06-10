import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, User, Clock } from 'lucide-react';
import {
  getAllConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToAllMessages,
  ChatConversation,
  ChatMessage
} from '../../lib/chatService';
import { supabase } from '../../lib/supabase';

const ChatManager: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();

    const channel = subscribeToAllMessages((newMsg) => {
      loadConversations();

      if (selectedUserId === newMsg.user_id) {
        setMessages(prev => [...prev, newMsg]);
        scrollToBottom();
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUserId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const convs = await getAllConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (userId: string) => {
    try {
      setSelectedUserId(userId);
      const msgs = await getMessages(userId);
      setMessages(msgs);

      await markMessagesAsRead(userId, 'user');
      scrollToBottom();

      loadConversations();
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || sendingMessage) return;

    try {
      setSendingMessage(true);
      await sendMessage(selectedUserId, newMessage.trim(), 'admin');
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Errore nell\'invio del messaggio');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const selectedConversation = conversations.find(c => c.user_id === selectedUserId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Conversations List */}
      <div className="lg:col-span-1 bg-white rounded-2xl shadow-soft overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Conversazioni</h3>
          <p className="text-sm text-gray-600 mt-1">
            {conversations.length} {conversations.length === 1 ? 'conversazione' : 'conversazioni'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="w-8 h-8 border-4 border-brand-burgundy border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Caricamento...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nessuna conversazione</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {conversations.map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => selectConversation(conv.user_id)}
                  className={`w-full p-4 text-left transition-colors duration-200 hover:bg-gray-50 ${
                    selectedUserId === conv.user_id ? 'bg-brand-burgundy/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-brand-burgundy/20 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-brand-burgundy" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{conv.user_name}</p>
                        {conv.unread_count > 0 && (
                          <span className="inline-block bg-brand-burgundy text-white text-xs px-2 py-0.5 rounded-full">
                            {conv.unread_count} nuovi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate mb-1">{conv.last_message}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(conv.last_message_time).toLocaleString('it-IT', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft overflow-hidden flex flex-col">
        {!selectedUserId ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Seleziona una conversazione</h3>
              <p className="text-gray-600">Scegli un paziente dalla lista per iniziare a chattare</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-brand-burgundy/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-brand-burgundy" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedConversation?.user_name}</h3>
                  <p className="text-sm text-gray-600">Paziente</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserId(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-600">
                  <p>Nessun messaggio ancora</p>
                  <p className="text-sm mt-2">Inizia la conversazione!</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          message.sender_type === 'admin'
                            ? 'bg-brand-burgundy text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                        <p className={`text-xs mt-2 ${
                          message.sender_type === 'admin' ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString('it-IT', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Scrivi un messaggio..."
                  disabled={sendingMessage}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-burgundy focus:border-transparent disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  className="bg-brand-burgundy text-white px-6 py-3 rounded-xl hover:bg-brand-burgundy/90 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatManager;
