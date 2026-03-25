
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ShoppingBag, ChevronRight, RotateCw } from 'lucide-react';
import { clsx } from 'clsx';
import { getOrderHistory } from '../services/api';
import { Spinner, EmptyState, formatPrice } from '../components/ui';
import { useTelegram } from '../hooks/useTelegram';
import useCartStore from '../stores/cartStore';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
    pending_payment: { label: 'Ожидает оплаты', color: 'bg-amber-100 text-amber-800' },
    paid:            { label: 'Оплачен', color: 'bg-emerald-100 text-emerald-800' },
    preparing:       { label: 'Готовится', color: 'bg-blue-100 text-blue-800' },
    ready:           { label: 'Готов', color: 'bg-violet-100 text-violet-800' },
    delivering:      { label: 'В пути', color: 'bg-orange-100 text-orange-800' },
    delivered:       { label: 'Доставлен', color: 'bg-emerald-100 text-emerald-800' },
    cancelled:       { label: 'Отменён', color: 'bg-red-100 text-red-800' },
};

const formatDate = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);

    if (days === 0) return `Сегодня, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    if (days === 1) return `Вчера, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    if (days < 7) return `${days} дн. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
};

const OrderHistoryPage = () => {
    const navigate = useNavigate();
    const { userId, haptic } = useTelegram();
    const { addItem } = useCartStore();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        getOrderHistory(userId)
            .then(setOrders)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [userId]);

    const handleReorder = (order) => {
        if (!order.items?.length) return;
        order.items.forEach(item => {
            for (let i = 0; i < item.quantity; i++) {
                addItem({
                    id: item.item_id,
                    name_ru: item.item_name,
                    name: item.item_name,
                    price: item.price,
                    image_url: null,
                });
            }
        });
        haptic('success');
        toast.success('Товары добавлены в корзину');
        navigate('/cart');
    };

    return (
        <div className="min-h-screen pb-6">
            {/* Header */}
            <div className="flex items-center px-4 h-14 border-b border-slate-100 bg-white sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-1">
                    <ArrowLeft size={22} className="text-slate-600" />
                </button>
                <span className="flex-1 text-center font-semibold text-[18px]">Мои заказы</span>
                <div className="w-8" />
            </div>

            {loading ? <Spinner /> : orders.length === 0 ? (
                <EmptyState
                    icon={ShoppingBag}
                    title="Нет заказов"
                    description="Ваши заказы появятся здесь"
                    action={
                        <button onClick={() => navigate('/')} className="btn-primary text-sm h-10 px-5">
                            В меню
                        </button>
                    }
                />
            ) : (
                <div className="px-4 pt-4 space-y-3">
                    {orders.map(order => {
                        const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment;
                        const isExpanded = expandedId === order.id;
                        const isActive = !['delivered', 'cancelled'].includes(order.status);

                        return (
                            <div key={order.id}
                                 className={clsx(
                                     'bg-white rounded-2xl shadow-card overflow-hidden transition-all',
                                     isActive && 'ring-1 ring-brand-200'
                                 )}
                            >
                                {/* Order header — clickable to expand */}
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                                    className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono font-bold text-slate-800 text-[15px]">
                                                #{order.id}
                                            </span>
                                            <span className={clsx('px-2 py-0.5 rounded-md text-[11px] font-semibold', config.color)}>
                                                {config.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {formatDate(order.created_at)}
                                            </span>
                                            <span>
                                                {order.items?.length || 0} позиций
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-slate-800 text-[15px]">
                                            {formatPrice(order.total)} сом
                                        </p>
                                        <ChevronRight size={16}
                                                      className={clsx(
                                                          'text-slate-300 transition-transform ml-auto mt-0.5',
                                                          isExpanded && 'rotate-90'
                                                      )}
                                        />
                                    </div>
                                </button>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 animate-fadeIn">
                                        <div className="border-t border-slate-100 pt-3 space-y-1.5">
                                            {order.items?.map((item, i) => (
                                                <div key={i} className="flex justify-between text-sm">
                                                    <span className="text-slate-600">
                                                        {item.quantity}× {item.item_name}
                                                    </span>
                                                    <span className="text-slate-800 font-medium">
                                                        {formatPrice(item.quantity * item.price)} сом
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {order.address && (
                                            <p className="text-xs text-slate-400 mt-3">
                                                📍 {order.address}
                                            </p>
                                        )}

                                        {/* Reorder button */}
                                        {order.status === 'delivered' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReorder(order);
                                                }}
                                                className="mt-3 w-full h-10 bg-brand-50 text-brand-600 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                                            >
                                                <RotateCw size={14} />
                                                Повторить заказ
                                            </button>
                                        )}

                                        {/* Track active order */}
                                        {isActive && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/order-status/${order.id}`);
                                                }}
                                                className="mt-3 w-full h-10 bg-brand-500 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                                            >
                                                Отследить заказ
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default OrderHistoryPage;