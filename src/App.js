import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import DataUpload from './components/DataUpload';
import Dashboard from './components/Dashboard';
import ReviewSession from './components/ReviewSession';
import LessonSession from './components/LessonSession';
import LevelBrowser from './components/LevelBrowser';
import ErrorBoundary from './components/ErrorBoundary';
import AuthModal from './components/Auth/AuthModal';
import UserProfile from './components/Auth/UserProfile';
import DebugPanel from './components/Auth/DebugPanel';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useWanoKuniData } from './hooks/useWanoKuniData';
import { useSRS } from './hooks/useSRS';
import { migrateAnonymousData } from './utils/storage';
import { User, LogIn, Cloud, CloudOff } from 'lucide-react';

function AppContent() {
  const { currentUser } = useAuth();
  const [screen, setScreen] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const { wanoKuniData, loadData, isLoading } = useWanoKuniData(currentUser?.uid);
  const srs = useSRS(wanoKuniData, currentUser?.uid);
  const { isLoadingFromCloud, lastSyncTime } = srs;

  // Migration des données anonymes lors de la première connexion
  useEffect(() => {
    if (currentUser) {
      migrateAnonymousData(currentUser.uid);
    }
  }, [currentUser]);

  // Auto-redirect to dashboard if data exists
  useEffect(() => {
    if (wanoKuniData && screen === 'home') {
      setScreen('dashboard');
    }
  }, [wanoKuniData, screen]);

  const handleDataLoad = (data) => {
    loadData(data);
    setScreen('dashboard');
  };

  const renderSyncIndicator = () => {
    if (!currentUser) return null;
    
    const formatSyncTime = () => {
      if (!lastSyncTime) return 'Jamais';
      const now = new Date();
      const sync = new Date(lastSyncTime);
      const diffMinutes = Math.floor((now - sync) / (1000 * 60));
      
      if (diffMinutes < 1) return 'À l\'instant';
      if (diffMinutes < 60) return `Il y a ${diffMinutes}min`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `Il y a ${diffHours}h`;
      return sync.toLocaleDateString();
    };

    return (
      <div className="fixed top-4 left-4 z-40 flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-3 py-2 rounded-full text-sm">
        {isLoadingFromCloud ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Sync...</span>
          </>
        ) : lastSyncTime ? (
          <>
            <Cloud className="w-4 h-4 text-green-400" />
            <span>Sync: {formatSyncTime()}</span>
          </>
        ) : (
          <>
            <CloudOff className="w-4 h-4 text-yellow-400" />
            <span>Mode local</span>
          </>
        )}
      </div>
    );
  };

  const renderAuthButton = () => {
    if (currentUser) {
      return (
        <button
          onClick={() => setShowUserProfile(true)}
          className="fixed top-4 right-4 z-40 flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full hover:bg-white/20 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 
             currentUser.email[0].toUpperCase()}
          </div>
          <span>{currentUser.displayName || 'Profil'}</span>
        </button>
      );
    } else {
      return (
        <button
          onClick={() => setShowAuthModal(true)}
          className="fixed top-4 right-4 z-40 flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full hover:bg-white/20 transition-colors"
        >
          <LogIn className="w-5 h-5" />
          <span>Se connecter</span>
        </button>
      );
    }
  };

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <Home onNavigate={setScreen} hasData={!!wanoKuniData} />;
      case 'data-upload':
        return <DataUpload onDataLoad={handleDataLoad} onBack={() => setScreen('home')} />;
      case 'dashboard':
        return <Dashboard srs={srs} wanoKuniData={wanoKuniData} onNavigate={setScreen} />;
      case 'review':
        return <ReviewSession srs={srs} wanoKuniData={wanoKuniData} onComplete={() => setScreen('dashboard')} onBack={() => setScreen('dashboard')} />;
      case 'lessons':
        return <LessonSession srs={srs} wanoKuniData={wanoKuniData} onComplete={() => setScreen('dashboard')} onBack={() => setScreen('dashboard')} />;
      case 'levels':
        return <LevelBrowser wanoKuniData={wanoKuniData} srs={srs} onBack={() => setScreen('dashboard')} onNavigate={setScreen} />;
      default:
        return <Home onNavigate={setScreen} hasData={!!wanoKuniData} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary onReset={() => setScreen('home')}>
      <div className="App relative">
        {renderSyncIndicator()}
        {renderAuthButton()}
        {renderScreen()}
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
        
        <UserProfile 
          isOpen={showUserProfile} 
          onClose={() => setShowUserProfile(false)} 
        />
        
        <DebugPanel />
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;