import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ShoppingBag, Check, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import useCartStore from '../stores/cartStore';
import { Counter, EmptyState, formatPrice } from '../components/ui';
import { validatePromo } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';

const CartPage = () => {
    const navigate = useNavigate();
    const { haptic } = useTelegram();
    const { items, addItem, removeItem, deleteItem, clear, promo, setPromo, clearPromo, deliveryType } = useCartStore();
    const [promoCode, setPromoCode] = useState('');
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState(false);

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discount = promo?.discount || 0;
    const deliveryFee = deliveryType === 'delivery' ? 150 : 0;
    const total = subtotal - discount + deliveryFee;

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setPromoLoading(true);
        setPromoError(false);
        try {
            const result = await validatePromo(promoCode, subtotal);
            setPromo(result);
            toast.success(`Скидка: -${formatPrice(result.discount)} сом`);
            haptic('success');
        } catch (err) {
            setPromoError(true);
            haptic('error');
            toast.error(err.response?.data?.message || 'Неверный промокод');
            setTimeout(() => setPromoError(false), 600);
        } finally {
            setPromoLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col">
                <div className="flex items-center px-4 h-14 border-b border-slate-100">
                    <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={22} className="text-slate-600" /></button>
                    <span className="flex-1 text-center font-semibold text-[18px]">Корзина</span>
                    <div className="w-8" />
                </div>
                <EmptyState
                    icon={ShoppingBag}
                    title="Корзина пуста"
                    description="Добавьте блюда из меню"
                    action={<button onClick={() => navigate('/')} className="btn-primary text-sm h-10 px-5">В меню</button>}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col pb-28">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100 bg-white sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={22} className="text-slate-600" /></button>
                <span className="font-semibold text-[18px]">Корзина</span>
                <button onClick={() => { clear(); haptic('impact'); }} className="text-[14px] text-red-500 font-medium">Очистить</button>
            </div>

            {/* Items */}
            <div className="px-4 pt-4 space-y-3">
                {items.map(item => (
                    <div key={item.id} className="flex gap-3 bg-white rounded-2xl p-3 shadow-card">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0 overflow-hidden">
                            {item.image_url ? (
                                <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl">🍽</div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-[15px] text-slate-800 line-clamp-1">{item.name}</h3>
                                <button onClick={() => { deleteItem(item.id); haptic('impact'); }}
                                    className="shrink-0 p-1 text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <Counter quantity={item.quantity} size="sm"
                                    onAdd={() => { addItem(item); haptic('impact'); }}
                                    onRemove={() => { removeItem(item.id); haptic('impact'); }}
                                />
                                <span className="font-bold text-[15px] text-slate-800">
                                    {formatPrice(item.price * item.quantity)} сом
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Promo code */}
            <div className="px-4 mt-5">
                {promo ? (
                    <div className="flex items-center justify-between bg-emerald-50 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                            <Check size={16} className="text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-700">
                                {promo.code} — скидка {promo.type === 'percent' ? `${promo.value}%` : `${formatPrice(promo.value)} сом`}
                            </span>
                        </div>
                        <button onClick={clearPromo} className="text-xs text-emerald-600 font-medium">Убрать</button>
                    </div>
                ) : (
                    <div className={clsx('flex gap-2', promoError && 'animate-shake')}>
                        <input
                            className="input flex-1 h-11 uppercase font-mono"
                            placeholder="Промокод"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        />
                        <button onClick={handleApplyPromo}
                            className="h-11 px-4 bg-slate-800 text-white text-sm font-medium rounded-xl active:scale-95 transition-transform"
                            disabled={promoLoading}>
                            {promoLoading ? <Loader2 size={16} className="animate-spin" /> : 'Применить'}
                        </button>
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="px-4 mt-5 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Сумма блюд</span>
                    <span className="text-slate-700">{formatPrice(subtotal)} сом</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Скидка</span>
                        <span className="text-emerald-600 font-medium">-{formatPrice(discount)} сом</span>
                    </div>
                )}
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Доставка</span>
                    <span className="text-slate-700">{deliveryFee > 0 ? `${formatPrice(deliveryFee)} сом` : 'Бесплатно'}</span>
                </div>
                <div className="border-t border-dashed border-slate-200 pt-2">
                    <div className="flex justify-between">
                        <span className="text-[18px] font-bold text-slate-800">Итого</span>
                        <span className="text-[18px] font-bold text-slate-800">{formatPrice(total)} сом</span>
                    </div>
                </div>
            </div>

            {/* Checkout button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 safe-bottom">
                <button onClick={() => navigate('/checkout')} className="btn-primary w-full">
                    Оформить заказ — {formatPrice(total)} сом
                </button>
            </div>
        </div>
    );
};

export default CartPage;
