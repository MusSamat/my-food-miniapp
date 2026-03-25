import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCartStore from "../stores/cartStore";
import {formatPrice} from "./ui";

const FloatingCartButton = () => {
    const navigate = useNavigate();
    const items = useCartStore(s => s.items);
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const total = useCartStore(s => {
        const subtotal = s.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const discount = s.promo?.discount || 0;
        const fee = s.deliveryType === 'delivery' ? 150 : 0;
        return subtotal - discount + fee;
    });

    if (totalItems === 0) return null;

    return (
        <div className="fixed bottom-6 left-4 right-4 z-40 animate-fadeIn">
            <button
                onClick={() => navigate('/cart')}
                className="w-full h-[52px] bg-brand-500 rounded-[14px] shadow-fab flex items-center justify-between px-5 active:scale-[0.97] transition-transform"
            >
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <ShoppingBag size={20} className="text-white" />
                        <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-white text-brand-500 text-[11px] font-bold rounded-full flex items-center justify-center">
                            {totalItems}
                        </span>
                    </div>
                    <span className="text-white font-semibold text-[15px]">Оформить заказ</span>
                </div>
                <span className="text-white font-bold text-[15px]">{formatPrice(total)} сом</span>
            </button>
        </div>
    );
};

export default FloatingCartButton;
