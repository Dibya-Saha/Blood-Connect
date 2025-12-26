import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, User as UserIcon, Phone, Clock, Circle, Search, X, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { getConversations, getMessages, sendMessage, Conversation, Message } from '../services/chatService';

interface ChatProps {
  language: 'en' | 'bn';
  user: User;
}

const Chat: React.FC<ChatProps> = ({ language, user }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingInterval = useRef<number | null>(null);

  useEffect(() => {
    loadConversations();
    
    // Poll for new messages every 5 seconds
    pollingInterval.current = setInterval(() => {
      loadConversations();
      if (selectedConversation) {
        loadMessages(selectedConversation.id);
      }
    }, 5000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const newMessage = await sendMessage(selectedConversation.id, messageInput.trim());
      setMessages([...messages, newMessage]);
      setMessageInput('');
      scrollToBottom();
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const labels = {
    title: { en: 'Messages', bn: 'বার্তা' },
    subtitle: { en: 'Chat with hospitals and donors', bn: 'হাসপাতাল এবং দাতাদের সাথে চ্যাট করুন' },
    search: { en: 'Search conversations...', bn: 'কথোপকথন খুঁজুন...' },
    typeMessage: { en: 'Type your message...', bn: 'আপনার বার্তা টাইপ করুন...' },
    noConversations: { en: 'No conversations yet', bn: 'এখনো কোনো কথোপকথন নেই' },
    selectChat: { en: 'Select a conversation to start chatting', bn: 'চ্যাট শুরু করতে একটি কথোপকথন নির্বাচন করুন' },
    online: { en: 'Online', bn: 'অনলাইন' },
    offline: { en: 'Offline', bn: 'অফলাইন' },
    typing: { en: 'typing...', bn: 'টাইপ করছে...' },
    today: { en: 'Today', bn: 'আজ' },
    yesterday: { en: 'Yesterday', bn: 'গতকাল' }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffHours < 48) {
      return labels.yesterday[language];
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex animate-in fade-in duration-500">
      {/* Conversations Sidebar */}
      <div className="w-full md:w-96 border-r border-gray-100 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-red-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-600 p-3 rounded-2xl shadow-lg">
              <MessageCircle className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">{labels.title[language]}</h2>
              <p className="text-xs text-gray-500 font-medium">{labels.subtitle[language]}</p>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder={labels.search[language]}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="text-gray-400" size={24} />
              </div>
              <p className="text-sm font-bold text-gray-400">{labels.noConversations[language]}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${
                    selectedConversation?.id === conv.id ? 'bg-red-50 border-l-4 border-red-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-black">
                        {conv.otherUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        conv.otherUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-black text-gray-900 truncate">{conv.otherUser.name}</h3>
                        <span className="text-[10px] font-bold text-gray-400">
                          {formatTime(conv.lastMessage?.timestamp || conv.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium truncate">
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <div className="mt-1">
                          <span className="inline-flex items-center justify-center w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full">
                            {conv.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-black">
                      {selectedConversation.otherUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      selectedConversation.otherUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900">{selectedConversation.otherUser.name}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <Circle 
                        size={8} 
                        className={selectedConversation.otherUser.isOnline ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'} 
                      />
                      <span className="font-medium text-gray-500">
                        {selectedConversation.otherUser.isOnline ? labels.online[language] : labels.offline[language]}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Phone size={20} className="text-gray-600" />
                  </button>
                  <button 
                    onClick={() => setSelectedConversation(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
                  >
                    <X size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <MessageCircle className="text-gray-300 mx-auto mb-3" size={48} />
                    <p className="text-sm font-bold text-gray-400">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.senderId === user.id;
                  const showDate = index === 0 || 
                    new Date(messages[index - 1].timestamp).toDateString() !== new Date(msg.timestamp).toDateString();

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center mb-4">
                          <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-gray-400 uppercase shadow-sm border border-gray-100">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`p-4 rounded-2xl shadow-sm ${
                              isOwn
                                ? 'bg-red-600 text-white rounded-br-none'
                                : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-[10px] font-bold text-gray-400 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <Clock size={10} />
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isOwn && msg.read && (
                              <span className="text-blue-500 ml-1">✓✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={labels.typeMessage[language]}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500 focus:outline-none transition-all resize-none"
                    rows={1}
                    disabled={sending}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="bg-red-600 text-white p-3 rounded-2xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-red-100"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <MessageCircle className="text-gray-300 mx-auto mb-4" size={64} />
              <h3 className="font-black text-gray-900 text-xl mb-2">{labels.title[language]}</h3>
              <p className="text-sm font-medium text-gray-500">{labels.selectChat[language]}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;