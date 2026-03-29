import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ChefHat, Truck, Package, Star, Send } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { getOrderStatus, submitReview } from '../services/api';
import { joinOrder, onOrderStatus } from '../services/socket';
import { Spinner, formatPrice } from '../components/ui';
import { useTelegram } from '../hooks/useTelegram';

const STATUS_CONFIG = {
    pending_payment: { icon: Clock, color: 'text-amber-500 bg-amber-50', label: 'Ожидает оплаты', step: 0 },
    paid:            { icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50', label: 'Заказ оформлен!', step: 1 },
    preparing:       { icon: ChefHat, color: 'text-blue-500 bg-blue-50', label: 'Готовится', step: 2 },
    ready:           { icon: Package, color: 'text-violet-500 bg-violet-50', label: 'Готов!', step: 3 },
    delivering:      { icon: Truck, color: 'text-brand-500 bg-brand-50', label: 'Курьер в пути', step: 4 },
    delivered:       { icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50', label: 'Доставлен!', step: 5 },
    cancelled:       { icon: XCircle, color: 'text-red-500 bg-red-50', label: 'Отменён', step: -1 },
};

const STEPS = ['paid', 'preparing', 'ready', 'delivering', 'delivered'];

const OrderStatusPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userId, haptic } = useTelegram();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showItems, setShowItems] = useState(false);

    // Review state
    const [showReview, setShowReview] = useState(false);
    const [rating, setRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSent, setReviewSent] = useState(false);
    const [reviewSending, setReviewSending] = useState(false);

    // Initial load
    useEffect(() => {
        getOrderStatus(id)
            .then(setOrder)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    // WebSocket for real-time updates
    useEffect(() => {
        joinOrder(id);
        const unsub = onOrderStatus((data) => {
            if (String(data.order_id) === String(id)) {
                // Re-fetch full order data
                getOrderStatus(id).then(setOrder).catch(() => {});
                haptic('success');
            }
        });
        return unsub;
    }, [id]);

    // Show review prompt when delivered
    useEffect(() => {
        if (order?.status === 'delivered' && !reviewSent) {
            setTimeout(() => setShowReview(true), 1500);
        }
    }, [order?.status]);

    const handleSubmitReview = async () => {
        if (rating === 0) { toast.error('Поставьте оценку'); return; }
        setReviewSending(true);
        try {
            await submitReview({ order_id: parseInt(id), telegram_id: userId, rating, comment: reviewComment || null });
            setReviewSent(true);
            setShowReview(false);
            haptic('success');
            toast.success('Спасибо за отзыв!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Ошибка');
        } finally {
            setReviewSending(false);
        }
    };

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
    const isActive = ['paid', 'preparing', 'ready', 'delivering'].includes(order.status);
    const isFailed = order.status === 'cancelled' || order.payment_status === 'failed';
    const currentStep = config.step;

    return (
        <div className="min-h-screen flex flex-col px-6 pt-10 pb-8">
            {/* Status icon */}
            <div className="flex flex-col items-center">
                <div className={clsx('w-20 h-20 rounded-full flex items-center justify-center mb-5', config.color)}>
                    <Icon size={36} />
                </div>
                <h1 className="text-[22px] font-bold text-slate-800">{config.label}</h1>
                <p className="text-sm text-slate-400 mt-1">Заказ #{order.id}</p>
            </div>

            {/* Progress steps */}
            {isActive && (
                <div className="flex items-center justify-between mt-8 px-2">
                    {STEPS.map((step, i) => {
                        const stepConfig = STATUS_CONFIG[step];
                        const isComplete = currentStep > stepConfig.step;
                        const isCurrent = currentStep === stepConfig.step;
                        return (
                            <React.Fragment key={step}>
                                <div className="flex flex-col items-center">
                                    <div className={clsx(
                                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                                        isComplete ? 'bg-emerald-500 text-white' :
                                            isCurrent ? 'bg-brand-500 text-white scale-110 shadow-lg shadow-brand-500/30' :
                                                'bg-slate-200 text-slate-400'
                                    )}>
                                        {isComplete ? '✓' : i + 1}
                                    </div>
                                    <span className={clsx('text-[10px] mt-1 font-medium',
                                        isCurrent ? 'text-brand-600' : 'text-slate-400'
                                    )}>{stepConfig.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={clsx('flex-1 h-0.5 mx-1 mb-4 rounded',
                                        currentStep > stepConfig.step ? 'bg-emerald-400' : 'bg-slate-200'
                                    )} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            )}

            {/* Time estimate */}
            {isActive && (
                <p className="text-sm text-slate-500 mt-6 text-center">
                    {order.type === 'delivery' ? 'Ожидайте доставку через 30-50 минут' : 'Заберите заказ в выбранном офисе'}
                </p>
            )}

            {/* Review prompt (after delivery) */}
            {showReview && !reviewSent && (
                <div className="mt-6 bg-white rounded-2xl p-5 shadow-card animate-fadeIn">
                    <h3 className="font-semibold text-slate-800 text-center mb-3">Как вам заказ?</h3>
                    <div className="flex justify-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map(s => (
                            <button key={s} onClick={() => { setRating(s); haptic('impact'); }}
                                    className="p-1 transition-transform active:scale-90">
                                <Star size={32}
                                      className={clsx(
                                          'transition-colors',
                                          s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                                      )} />
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="input h-16 py-2 resize-none text-sm mb-3"
                        placeholder="Комментарий (необязательно)"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                    />
                    <button onClick={handleSubmitReview} disabled={reviewSending}
                            className="btn-primary w-full h-11 text-sm">
                        {reviewSending ? 'Отправка...' : <><Send size={14} /> Отправить отзыв</>}
                    </button>
                </div>
            )}

            {reviewSent && (
                <div className="mt-6 bg-emerald-50 rounded-2xl p-4 text-center animate-fadeIn">
                    <p className="text-emerald-700 font-semibold text-sm">Спасибо за ваш отзыв! ⭐</p>
                </div>
            )}

            {/* Order details */}
            <div className="w-full mt-6">
                <button onClick={() => setShowItems(!showItems)}
                        className="w-full flex items-center justify-between py-3 text-sm font-medium text-slate-600">
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
                                <span>Итого</span><span>{formatPrice(order.total)} сом</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="w-full mt-auto pt-8 space-y-3">
                {isFailed && (
                    <button onClick={() => navigate('/cart')} className="btn-primary w-full">Попробовать снова</button>
                )}
                <button onClick={() => navigate('/', { replace: true })}
                        className="w-full h-[52px] rounded-xl font-semibold text-[15px] bg-surface text-slate-700">
                    Вернуться в меню
                </button>
            </div>
        </div>
    );
};

export default OrderStatusPage;