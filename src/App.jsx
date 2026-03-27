import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BranchSelectPage from './pages/BranchSelectPage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderStatusPage from './pages/OrderStatusPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import { useTelegram } from './hooks/useTelegram';
import useUserStore from './stores/userStore';
import useBranchStore from './stores/branchStore';
import { getUser, saveUser } from './services/api';

const RequireBranch = ({ children }) => {
    const { branchId } = useBranchStore();
    if (!branchId) return <Navigate to="/" replace />;
    return children;
};

const App = () => {
    const { userId, username, firstName, lastName } = useTelegram();
    const { setUser } = useUserStore();

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
                <Route path="/" element={<BranchSelectPage />} />
                <Route path="/menu" element={<RequireBranch><MenuPage /></RequireBranch>} />
                <Route path="/cart" element={<RequireBranch><CartPage /></RequireBranch>} />
                <Route path="/checkout" element={<RequireBranch><CheckoutPage /></RequireBranch>} />
                <Route path="/order-status/:id" element={<OrderStatusPage />} />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;