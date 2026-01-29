import React from 'react';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import { useAuth } from './hooks/useAuth';
import './index.css';

function App() {
  const { user, login, logout, accessToken, loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (authLoading) return <div className="loading">Initializing...</div>;

  return (
    <>
      <div id="splash-screen" className={!showSplash ? 'fade-out' : ''}>
        <div className="splash-logo"></div>
      </div>

      {!user ? (
        <LandingPage onLogin={login} />
      ) : (
        <Dashboard user={user} onLogout={logout} accessToken={accessToken} />
      )}
    </>
  );
}

export default App;
