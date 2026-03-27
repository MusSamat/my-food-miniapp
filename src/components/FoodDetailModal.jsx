import React, { useState } from 'react';
import { X, Heart } from 'lucide-react';
import { Counter, ItemBadge, LazyImage, Backdrop, formatPrice } from './ui';
import useCartStore from '../stores/cartStore';
import { useTelegram } from '../hooks/useTelegram';
import { toggleFavorite } from '../services/api';
import toast from 'react-hot-toast';

const FoodDetailModal = ({ item, onClose, isClosed, isFav: initialFav }) => {
    const { addItem, removeItem, getQuantity } = useCartStore();
    const { haptic, userId } = useTelegram();
    const [isFav, setIsFav] = useState(initialFav || false);

    if (!item) return null;

    const qty = getQuantity(item.id);
    const isAvailable = item.status === 'available' && !isClosed;

    const handleAdd = () => { addItem(item); haptic('impact'); };
    const handleRemove = () => { removeItem(item.id); haptic('impact'); };

    const handleFav = async () => {
        if (!userId) return;
        haptic('impact');
        const result = await toggleFavorite(userId, item.id).catch(() => null);
        if (result) {
            setIsFav(result.favorited);
            toast.success(result.favorited ? 'В избранном' : 'Убрано');
        }
    };

    return (
        <Backdrop onClick={onClose}>
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl animate-slideUp max-h-[90vh] overflow-y-auto safe-bottom">
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-slate-300 rounded-full" />
                </div>

                {/* Close + Favorite buttons */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button onClick={handleFav}
                            className="w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm">
                        <Heart size={16} className={isFav ? 'fill-red-500 text-red-500' : 'text-slate-600'} />
                    </button>
                    <button onClick={onClose}
                            className="w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm">
                        <X size={18} className="text-slate-600" />
                    </button>
                </div>

                {/* Image */}
                <LazyImage src={item.image_url} alt={item.name_ru}
                           className="w-full h-60" />

                <div className="px-5 pt-4 pb-6">
                    <h2 className="text-xl font-bold text-slate-800">{item.name_ru}</h2>

                    {item.description_ru && (
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">{item.description_ru}</p>
                    )}
                    {item.ingredients && (
                        <p className="text-[13px] text-slate-400 mt-2">{item.ingredients}</p>
                    )}

                    <div className="h-px bg-slate-100 my-4" />

                    <p className="text-[22px] font-bold text-slate-800">{formatPrice(item.price)} сом</p>

                    {isClosed && (
                        <p className="mt-3 text-center text-sm text-red-500 font-medium bg-red-50 rounded-xl py-2">
                            Ресторан сейчас закрыт
                        </p>
                    )}

                    {isAvailable && (
                        <div className="mt-5">
                            {qty > 0 ? (
                                <div className="flex items-center justify-between">
                                    <Counter quantity={qty} onAdd={handleAdd} onRemove={handleRemove} />
                                    <span className="text-sm font-semibold text-slate-600">
                                        {formatPrice(item.price * qty)} сом
                                    </span>
                                </div>
                            ) : (
                                <button onClick={handleAdd} className="btn-primary w-full">
                                    Добавить в корзину
                                </button>
                            )}
                        </div>
                    )}

                    {item.status === 'coming_soon' && (
                        <p className="mt-4 text-center text-sm text-amber-600 font-medium">Скоро в меню!</p>
                    )}
                </div>
            </div>
        </Backdrop>
    );
};

export default FoodDetailModal;