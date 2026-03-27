import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderStatusPage from './pages/OrderStatusPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import { useTelegram } from './hooks/useTelegram';
import useUserStore from './stores/userStore';
import useSettingsStore from './stores/settingsStore';
import { getUser, saveUser } from './services/api';

const App = () => {
    const { userId, username, firstName, lastName } = useTelegram();
    const { setUser } = useUserStore();
    const { loadSettings } = useSettingsStore();

    useEffect(() => { loadSettings(); }, []);

    useEffect(() => {
        if (!userId) return;
        getUser(userId).then(async (data) => {
            if (data) {
                setUser(data);
                saveUser({ telegram_id: userId, username, first_name: firstName, last_name: lastName }).catch(() => {});
            } else {
                const saved = await saveUser({ telegram_id: userId, username, first_name: firstName, last_name: lastName });
                if (saved) setUser(saved);
            }
        }).catch(() => {});
    }, [userId]);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MenuPage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-status/:id" element={<OrderStatusPage />} />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="*" element={<MenuPage />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;