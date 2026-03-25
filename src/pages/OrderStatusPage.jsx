import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ChefHat, Truck, Package, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { getOrderStatus } from '../services/api';
import { Spinner, formatPrice } from '../components/ui';

const STATUS_CONFIG = {
    pending_payment: { icon: Clock, color: 'text-amber-500 bg-amber-50', label: 'Ожидает оплаты' },
    paid: { icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50', label: 'Заказ оформлен!' },
    preparing: { icon: ChefHat, color: 'text-blue-500 bg-blue-50', label: 'Готовится' },
    ready: { icon: Package, color: 'text-violet-500 bg-violet-50', label: 'Готов!' },
    delivering: { icon: Truck, color: 'text-brand-500 bg-brand-50', label: 'Курьер в пути' },
    delivered: { icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50', label: 'Доставлен!' },
    cancelled: { icon: XCircle, color: 'text-red-500 bg-red-50', label: 'Отменён' },
};

const OrderStatusPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showItems, setShowItems] = useState(false);

    const fetchStatus = () => {
        getOrderStatus(id)
            .then(setOrder)
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchStatus();
        // Poll every 5s for status updates
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, [id]);

    if (loading) return <Spinner />;
    if (!order) return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
            <XCircle size={48} className="text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Заказ не найден</h2>
            <button onClick={() => navigate('/')} className="btn-primary mt-6 h-11 px-6 text-sm">В меню</button>
        </div>
    );

    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment;
    const Icon = config.icon;
    const isSuccess = ['paid', 'preparing', 'ready', 'delivering', 'delivered'].includes(order.status);
    const isFailed = order.status === 'cancelled' || order.payment_status === 'failed';

    return (
        <div className="min-h-screen flex flex-col items-center px-6 pt-16 pb-8">
            {/* Status icon */}
            <div className={clsx('w-20 h-20 rounded-full flex items-center justify-center mb-5', config.color)}>
                <Icon size={36} />
            </div>

            {/* Title */}
            <h1 className="text-[22px] font-bold text-slate-800">{config.label}</h1>
            <p className="text-sm text-slate-400 mt-1">Заказ #{order.id}</p>

            {/* Time estimate */}
            {isSuccess && order.status !== 'delivered' && (
                <p className="text-sm text-slate-500 mt-3">
                    {order.type === 'delivery'
                        ? 'Ожидайте доставку через 30-50 минут'
                        : 'Заберите заказ в выбранном офисе'
                    }
                </p>
            )}

            {/* Order details (collapsible) */}
            <div className="w-full mt-8">
                <button
                    onClick={() => setShowItems(!showItems)}
                    className="w-full flex items-center justify-between py-3 text-sm font-medium text-slate-600"
                >
                    <span>Детали заказа</span>
                    <span className="text-slate-400">{showItems ? 'Скрыть' : 'Показать'}</span>
                </button>

                {showItems && order.items && (
                    <div className="bg-white rounded-2xl p-4 shadow-card space-y-2 animate-fadeIn">
                        {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-slate-600">{item.quantity}× {item.item_name}</span>
                                <span className="font-medium text-slate-800">{formatPrice(item.quantity * item.price)} сом</span>
                            </div>
                        ))}
                        <div className="border-t border-slate-100 pt-2 mt-2">
                            <div className="flex justify-between font-bold">
                                <span>Итого</span>
                                <span>{formatPrice(order.total)} сом</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="w-full mt-auto pt-8 space-y-3">
                {isFailed && (
                    <button onClick={() => navigate('/cart')} className="btn-primary w-full">
                        Попробовать снова
                    </button>
                )}
                <button
                    onClick={() => navigate('/', { replace: true })}
                    className={clsx(
                        'w-full h-[52px] rounded-xl font-semibold text-[15px] transition-all',
                        isFailed
                            ? 'bg-surface text-slate-700'
                            : 'bg-surface text-slate-700'
                    )}
                >
                    Вернуться в меню
                </button>
            </div>
        </div>
    );
};

export default OrderStatusPage;
