# Trackify

A modern, responsive daily goal tracker built with React.js, Vite, Tailwind CSS, React Router, Axios, Framer Motion, and React Icons.

## Features

- **Authentication**: Login and Register pages with form validation
- **Dashboard**: Overview of daily progress with statistics and circular progress indicator
- **Goals Management**: Create, read, update, and delete daily goals
- **Real-time Updates**: Instant UI updates when marking goals as complete
- **Search**: Filter goals by title or description
- **Responsive Design**: Works on all device sizes
- **Beautiful Animations**: Smooth transitions using Framer Motion
- **Toast Notifications**: Success, error, and info notifications
- **Loading States**: Skeleton loaders for better UX

## Pages

1. **Login** - User authentication
2. **Register** - New user registration
3. **Dashboard** - Overview of progress and statistics
4. **Goals** - Manage daily goals (CRUD operations)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.jsx
│   ├── Card.jsx
│   ├── CircularProgress.jsx
│   ├── DashboardCard.jsx
│   ├── GoalCard.jsx
│   ├── Input.jsx
│   ├── Modal.jsx
│   ├── Navbar.jsx
│   ├── Skeleton.jsx
│   ├── ProtectedRoute.jsx
│   └── PublicRoute.jsx
├── context/             # React Context providers
│   ├── AuthContext.jsx
│   ├── GoalsContext.jsx
│   └── ToastContext.jsx
├── hooks/               # Custom React hooks
│   └── useLocalStorage.js
├── pages/               # Page components
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   └── Goals.jsx
├── routes/              # Route configuration
│   └── AppRoutes.jsx
├── services/            # API services
│   └── api.js
├── utils/               # Utility functions
│   └── cn.js
├── App.jsx              # Main App component
├── main.jsx             # Entry point
└── index.css            # Global styles
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Test Credentials

For testing purposes, you can use:
- **Email**: test@example.com
- **Password**: password

## API Integration

The application is designed with backend integration in mind. The API service layer (`src/services/api.js`) contains mock data for development. To integrate with a real backend:

1. Update the `VITE_API_URL` environment variable
2. Replace the mock API functions with actual API calls
3. The axios instance is already configured with interceptors for auth tokens

## Design System

- **Colors**: Blue accent (#3B82F6) with white background
- **Typography**: System fonts with Tailwind defaults
- **Spacing**: Consistent padding and margins using Tailwind utilities
- **Shadows**: Soft shadows for cards and modals
- **Border Radius**: Rounded corners (lg and xl)
- **Animations**: Framer Motion for smooth transitions

## Technologies Used

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **React Icons** - Icon library

## License

MIT
