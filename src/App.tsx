import React, { useState, useEffect } from 'react';
import { Heart, Home, MapPin, Database, MessageCircle, User as UserIcon, LogOut, Droplet, Sparkles } from 'lucide-react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import EmergencyMap from './components/EmergencyMap';
import Inventory from './components/Inventory';
import MythsAssistant from './components/MythsAssistant';
import Profile from './components/Profile';
import RequestBlood from './components/RequestBlood';
import Chat from './components/Chat';
import { User } from './types';
import { getCurrentUser, logout, isAuthenticated } from './services/authService';

type Tab = 'dashboard' | 'map' | 'inventory' | 'myths' | 'profile' | 'request' | 'chat';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');

  // Check for existing session on mount
  useEffect(() => {
    if (isAuthenticated()) {
      const existingUser = getCurrentUser();
      if (existingUser) {
        setUser(existingUser);
      }
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setActiveTab('dashboard');
  };

  if (!user) {
    return (
      <Auth 
        onLogin={handleLogin} 
        language={language}
        onToggleLanguage={() => setLanguage(language === 'en' ? 'bn' : 'en')}
      />
    );
  }

  const tabs = {
    dashboard: { label: { en: 'Dashboard', bn: 'ড্যাশবোর্ড' }, icon: <Home size={20} /> },
    map: { label: { en: 'Emergency Map', bn: 'জরুরী ম্যাপ' }, icon: <MapPin size={20} /> },
    request: { label: { en: 'Request Blood', bn: 'রক্ত অনুরোধ' }, icon: <Droplet size={20} /> },
    inventory: { label: { en: 'Inventory', bn: 'ইনভেন্টরি' }, icon: <Database size={20} /> },
    chat: { label: { en: 'Messages', bn: 'বার্তা' }, icon: <MessageCircle size={20} /> },
    myths: { label: { en: 'AI Assistant', bn: 'এআই সহকারী' }, icon: <Sparkles size={20} /> },
    profile: { label: { en: 'Profile', bn: 'প্রোফাইল' }, icon: <UserIcon size={20} /> },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/20 to-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-100">
                <Heart className="text-white" size={24} fill="white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">
                  {language === 'en' ? 'BloodConnect' : 'ব্লাডকানেক্ট'}
                </h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {language === 'en' ? 'Bangladesh' : 'বাংলাদেশ'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-red-600 transition-colors border border-gray-200 rounded-lg hover:border-red-200"
              >
                {language === 'en' ? 'বাংলা' : 'English'}
              </button>
              
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">{user.name}</p>
                  <p className="text-xs font-bold text-red-600">{user.bloodGroup}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title={language === 'en' ? 'Logout' : 'লগআউট'}
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {(Object.keys(tabs) as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-red-600 text-white shadow-lg shadow-red-100'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tabs[tab].icon}
                {tabs[tab].label[language]}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="animate-in fade-in duration-500">
          {activeTab === 'dashboard' && <Dashboard language={language} user={user} onNavigate={setActiveTab} />}
          {activeTab === 'map' && <EmergencyMap language={language} />}
          {activeTab === 'request' && <RequestBlood language={language} user={user} />}
          {activeTab === 'inventory' && <Inventory language={language} />}
          {activeTab === 'chat' && <Chat language={language} user={user} />}
          {activeTab === 'myths' && <MythsAssistant language={language} />}
          {activeTab === 'profile' && <Profile user={user} language={language} />}
        </div>
      </div>
    </div>
  );
}

export default App;