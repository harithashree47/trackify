import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AppRoutes } from './routes/AppRoutes.jsx';
import InstallPrompt from './pwa/InstallPrompt.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
          <InstallPrompt />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
