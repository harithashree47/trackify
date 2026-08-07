import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { GoalsProvider } from './context/GoalsContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AppRoutes } from './routes/AppRoutes.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GoalsProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </GoalsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
