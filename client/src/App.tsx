import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import Send from './pages/Send';
import Receive from './pages/Receive';
import Scan from './pages/Scan';
import Payment from './pages/Payment';
import Transactions from './pages/Transactions';
import WalletPage from './pages/WalletPage';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ApiKeys from './pages/ApiKeys';
import DemoCheckout from './pages/DemoCheckout';
// Removed TransactionDetail page


interface PrivateRouteProps {
    children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-white">Loading...</div>;

    // Redirect to login but save the attempted location
    return user ? (children as React.ReactElement) : <Navigate to="/login" state={{ from: location }} replace />;
};

function AppRoutes() {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
            <Route path="/wallet" element={<PrivateRoute><WalletPage /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/developers" element={<PrivateRoute><ApiKeys /></PrivateRoute>} />
            <Route path="/send" element={<PrivateRoute><Send /></PrivateRoute>} />
            <Route path="/receive" element={<PrivateRoute><Receive /></PrivateRoute>} />
            <Route path="/scan" element={<PrivateRoute><Scan /></PrivateRoute>} />
            <Route path="/demo-checkout" element={<DemoCheckout />} />
            <Route path="/payment" element={<PrivateRoute><Payment /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;
