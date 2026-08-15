import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { GoalsProvider } from './context/GoalsContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AppRoutes } from './routes/AppRoutes.jsx';
import InstallPrompt from './pwa/InstallPrompt.jsx';
import { StartupSync } from './components/StartupSync.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GoalsProvider>
          <ToastProvider>
            <AppRoutes />
            <InstallPrompt />
            <StartupSync />
          </ToastProvider>
        </GoalsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
