
import React, { useState } from 'react';
import { UserInfo } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const handleLogin = (info: UserInfo) => {
    setUserInfo(info);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUserInfo(null);
    setIsAuthenticated(false);
  };

  return (
    <div className="h-full w-full bg-slate-950 overflow-hidden selection:bg-cyan-500/30">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard userInfo={userInfo!} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;
