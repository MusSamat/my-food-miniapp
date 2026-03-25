import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
        <Toaster
            position="top-center"
            toastOptions={{
                duration: 2500,
                style: {
                    background: '#1A1A2E',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '14px',
                    padding: '10px 16px',
                    maxWidth: '300px',
                },
                success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
                error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
            }}
        />
    </React.StrictMode>
);
