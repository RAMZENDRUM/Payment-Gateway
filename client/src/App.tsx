import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import PageLoader from './components/ui/page-loader';

// Lazy load components for performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Send = lazy(() => import('./pages/Send'));
const Receive = lazy(() => import('./pages/Receive'));
const Scan = lazy(() => import('./pages/Scan'));
const Payment = lazy(() => import('./pages/Payment'));
const Transactions = lazy(() => import('./pages/Transactions'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const ApiKeys = lazy(() => import('./pages/ApiKeys'));
const DemoCheckout = lazy(() => import('./pages/DemoCheckout'));
const SetPin = lazy(() => import('./pages/SetPin'));

interface PrivateRouteProps {
    children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <PageLoader />
            </div>
        );
    }

    return user ? (children as React.ReactElement) : <Navigate to="/login" state={{ from: location }} replace />;
};

function AppRoutes() {
    const { user } = useAuth();

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <PageLoader />
            </div>
        }>
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
                <Route path="/checkout" element={<PrivateRoute><DemoCheckout /></PrivateRoute>} />
                <Route path="/demo-checkout" element={<PrivateRoute><DemoCheckout /></PrivateRoute>} />
                <Route path="/setup-pin" element={<PrivateRoute><SetPin /></PrivateRoute>} />
                <Route path="/payment" element={<PrivateRoute><Payment /></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Suspense>
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
