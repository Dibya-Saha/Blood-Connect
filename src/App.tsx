import React, { useState, useEffect } from 'react';
import { Heart, Map, Database, MessageCircle, User as UserIcon, LogOut, Menu, X, Zap, Droplet, MessageSquare } from 'lucide-react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import EmergencyMap from './components/EmergencyMap';
import Inventory from './components/Inventory';
import MythsAssistant from './components/MythsAssistant';
import Profile from './components/Profile';
import RequestBlood from './components/RequestBlood';
import Chat from './components/Chat';
import { User } from './types';

type Tab = 'dashboard' | 'map' | 'inventory' | 'myths' | 'profile' | 'request' | 'chat';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('bloodconnect_current_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('bloodconnect_current_user');
      }
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('bloodconnect_current_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bloodconnect_current_user');
    setActiveTab('dashboard');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'bn' : 'en');
  };

  if (!user) {
    return <Auth onLogin={handleLogin} language={language} onToggleLanguage={toggleLanguage} />;
  }

  const navItems = [
    { id: 'dashboard' as Tab, label: { en: 'Dashboard', bn: 'ড্যাশবোর্ড' }, icon: Heart },
    { id: 'request' as Tab, label: { en: 'Request Blood', bn: 'রক্তের অনুরোধ' }, icon: Droplet },
    { id: 'map' as Tab, label: { en: 'Emergency Map', bn: 'জরুরী ম্যাপ' }, icon: Map },
    { id: 'inventory' as Tab, label: { en: 'Inventory', bn: 'ইনভেন্টরি' }, icon: Database },
    { id: 'chat' as Tab, label: { en: 'Messages', bn: 'বার্তা' }, icon: MessageSquare },
    { id: 'myths' as Tab, label: { en: 'AI Assistant', bn: 'এআই সহায়ক' }, icon: MessageCircle },
    { id: 'profile' as Tab, label: { en: 'Profile', bn: 'প্রোফাইল' }, icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2 rounded-xl shadow-lg">
                <Heart className="text-white" size={24} fill="white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">BloodConnect</h1>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Bangladesh</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === item.id
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={18} />
                  <span className="hidden lg:inline">{item.label[language]}</span>
                </button>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLanguage}
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-200 transition-all"
              >
                {language === 'en' ? 'বাংলা' : 'EN'}
              </button>
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
              >
                <LogOut size={18} />
                <span className="hidden lg:inline">{language === 'en' ? 'Logout' : 'লগআউট'}</span>
              </button>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-gray-100 text-gray-600"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white animate-in slide-in-from-top-4 duration-200">
            <div className="px-4 py-4 space-y-2">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeTab === item.id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={20} />
                  {item.label[language]}
                </button>
              ))}
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100"
              >
                <Zap size={20} />
                {language === 'en' ? 'Switch to বাংলা' : 'Switch to English'}
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50"
              >
                <LogOut size={20} />
                {language === 'en' ? 'Logout' : 'লগআউট'}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard language={language} user={user} onNavigate={setActiveTab} />}
        {activeTab === 'request' && <RequestBlood language={language} user={user} />}
        {activeTab === 'map' && <EmergencyMap language={language} />}
        {activeTab === 'inventory' && <Inventory language={language} />}
        {activeTab === 'chat' && <Chat language={language} user={user} />}
        {activeTab === 'myths' && <MythsAssistant language={language} />}
        {activeTab === 'profile' && <Profile user={user} language={language} />}
      </main>
    </div>
  );
}

export default App;