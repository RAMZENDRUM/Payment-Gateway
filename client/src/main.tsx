import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Toaster
                position="top-center"
                toastOptions={{
                    className: 'text-sm font-semibold selection:bg-blue-500/30',
                    style: {
                        background: '#0f172a',
                        color: '#f8fafc',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '12px 20px',
                        borderRadius: '16px',
                        maxWidth: '450px',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#0f172a',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#0f172a',
                        },
                    },
                }}
            />
            <App />
        </BrowserRouter>
    </React.StrictMode>,
)
