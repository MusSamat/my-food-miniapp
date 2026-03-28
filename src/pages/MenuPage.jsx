import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ChefHat, Clock, Heart, MapPin } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { getCategories, getPopularItems, searchItems, toggleFavorite, getFavorites } from '../services/api';
import { Counter, AddButton, ItemBadge, LazyImage, Spinner, formatPrice } from '../components/ui';
import FoodDetailModal from '../components/FoodDetailModal';
import FloatingCartButton from '../components/FloatingCartButton';
import useCartStore from '../stores/cartStore';
// import useSettingsStore from '../stores/settingsStore';
import { useTelegram } from '../hooks/useTelegram';
import useBranchStore from '../stores/branchStore';

// ─── Food Card ───
const FoodCard = ({ item, onOpen, isClosed, isFav, onToggleFav }) => {
    const { addItem, removeItem, getQuantity } = useCartStore();
    const { haptic } = useTelegram();
    const qty = getQuantity(item.id);
    const isAvailable = item.status === 'available';
    const isDisabled = item.status === 'out_of_stock' || isClosed;

    return (
        <div
            onClick={() => onOpen(item)}
            className={clsx(
                'flex gap-3 p-3 bg-white rounded-2xl shadow-card mb-3 active:scale-[0.98] transition-transform cursor-pointer',
                isDisabled && 'grayscale opacity-50'
            )}
        >
            <LazyImage src={item.image_url} alt={item.name_ru}
                       className="w-[88px] h-[88px] rounded-xl shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                    <div className="flex items-start justify-between gap-1">
                        <h3 className="font-semibold text-[15px] text-slate-800 leading-tight line-clamp-2">{item.name_ru}</h3>
                        <button onClick={(e) => { e.stopPropagation(); onToggleFav(item.id); }}
                                className="shrink-0 p-1">
                            <Heart size={16} className={clsx(isFav ? 'fill-red-500 text-red-500' : 'text-slate-300')} />
                        </button>
                    </div>
                    <p className="text-[13px] text-slate-400 mt-0.5 line-clamp-1">{item.ingredients || item.description_ru || ''}</p>
                </div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[15px] font-bold text-brand-500">от {formatPrice(item.price)} сом</span>
                    {isAvailable && !isDisabled && (
                        <div onClick={(e) => e.stopPropagation()}>
                            {qty > 0 ? (
                                <Counter quantity={qty} size="sm"
                                         onAdd={() => { addItem(item); haptic('impact'); }}
                                         onRemove={() => { removeItem(item.id); haptic('impact'); }}
                                />
                            ) : (
                                <AddButton onClick={() => { addItem(item); haptic('impact'); }} size={32} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Popular Card ───
const PopularCard = ({ item, onOpen, isClosed }) => {
    const { addItem, removeItem, getQuantity } = useCartStore();
    const { haptic } = useTelegram();
    const qty = getQuantity(item.id);
    const isAvailable = item.status === 'available';
    const isDisabled = item.status === 'out_of_stock' || isClosed;

    return (
        <div onClick={() => onOpen(item)}
             className={clsx(
                 'bg-white rounded-2xl shadow-sm border border-slate-100 w-[160px] shrink-0 cursor-pointer active:scale-[0.96] transition-all duration-200 overflow-hidden flex flex-col',
                 isDisabled && 'grayscale opacity-60'
             )}
        >
            <div className="w-full aspect-[4/3] relative overflow-hidden">
                <LazyImage src={item.image_url} alt={item.name_ru} className="w-full h-full" />
                {isDisabled && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold uppercase tracking-tighter">
                            {isClosed ? 'Закрыто' : 'Закончилось'}
                        </span>
                    </div>
                )}
            </div>
            <div className="p-3 flex flex-col flex-grow">
                <h4 className="text-[14px] font-medium text-slate-800 leading-tight line-clamp-2 min-h-[35px]">
                    {item.name_ru}
                </h4>
                <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="text-[14px] font-bold text-slate-900">{formatPrice(item.price)}</span>
                    <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
                        {isAvailable && !isDisabled && (
                            qty > 0 ? (
                                <Counter quantity={qty} size="sm"
                                         onAdd={() => { addItem(item); haptic('impact'); }}
                                         onRemove={() => { removeItem(item.id); haptic('impact'); }}
                                />
                            ) : (
                                <AddButton onClick={() => { addItem(item); haptic('impact'); }} size={30} />
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══ MenuPage ═══
const MenuPage = () => {
    const navigate = useNavigate();
    const { ready, expand, userId, haptic } = useTelegram();
    // const { settings, refreshSettings } = useSettingsStore();
    const { branch, branchId, refreshBranch } = useBranchStore();
    const isClosed = branch?.is_currently_open === false;

    const [categories, setCategories] = useState([]);
    const [popular, setPopular] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState(null);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [favIds, setFavIds] = useState(new Set());

    const tabsRef = useRef(null);
    const categoryRefs = useRef({});
    const observerRef = useRef(null);
    const searchTimerRef = useRef(null);

    useEffect(() => {
        ready();
        expand();
        refreshBranch();

        Promise.all([
            getCategories(branchId),  // pass branch_id
            getPopularItems()
        ])
            .then(([cats, pop]) => {
                setCategories(cats);
                setPopular(pop);
                if (cats.length) setActiveCategory(cats[0].id);
            })
            .finally(() => setLoading(false));

        if (userId) {
            getFavorites(userId).then(favs => setFavIds(new Set(favs.map(f => f.id)))).catch(() => {});
        }
    }, []);

    // IntersectionObserver
    useEffect(() => {
        if (!categories.length) return;
        observerRef.current = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveCategory(parseInt(entry.target.dataset.categoryId));
                    }
                }
            },
            { threshold: 0.3, rootMargin: '-120px 0px -60% 0px' }
        );
        Object.values(categoryRefs.current).forEach(el => {
            if (el) observerRef.current.observe(el);
        });
        return () => observerRef.current?.disconnect();
    }, [categories]);

    const scrollToCategory = useCallback((id) => {
        setActiveCategory(id);
        categoryRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById(`tab-${id}`)?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, []);

    // Search debounce
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        if (!searchQuery || searchQuery.length < 2) { setSearchResults(null); return; }
        setSearchLoading(true);
        searchTimerRef.current = setTimeout(() => {
            searchItems(searchQuery).then(setSearchResults).finally(() => setSearchLoading(false));
        }, 300);
        return () => clearTimeout(searchTimerRef.current);
    }, [searchQuery]);

    const clearSearch = () => { setSearchQuery(''); setSearchResults(null); setShowSearch(false); };

    const handleToggleFav = async (itemId) => {
        if (!userId) { toast.error('Откройте через Telegram'); return; }
        haptic('impact');
        const result = await toggleFavorite(userId, itemId).catch(() => null);
        if (result) {
            setFavIds(prev => {
                const next = new Set(prev);
                if (result.favorited) next.add(itemId); else next.delete(itemId);
                return next;
            });
            toast.success(result.favorited ? 'Добавлено в избранное' : 'Убрано из избранного');
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white shadow-nav">
                <div className="flex items-center justify-between px-4 h-14">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                            <ChefHat size={18} className="text-white" />
                        </div>
                        <span className="font-semibold text-[16px] text-slate-800">Food Delivery</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => navigate('/orders')}
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                            <Clock size={20} className="text-slate-500" />
                        </button>

                        <button onClick={() => { useBranchStore.getState().setBranch(null, null); navigate('/'); }}
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                                title="Сменить филиал">
                            <MapPin size={20} className="text-slate-500" />
                        </button>

                        <button onClick={() => setShowSearch(!showSearch)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                            {showSearch ? <X size={20} className="text-slate-500" /> : <Search size={20} className="text-slate-500" />}
                        </button>
                    </div>
                </div>

                {showSearch && (
                    <div className="px-4 pb-3 animate-fadeIn">
                        <div className="relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input autoFocus className="w-full h-11 pl-10 pr-10 bg-surface rounded-xl text-[15px] placeholder:text-slate-400 outline-none"
                                   placeholder="Искать блюда..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            {searchQuery && (
                                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <X size={16} className="text-slate-400" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {!searchResults && (
                    <div ref={tabsRef} className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
                        {categories.map(cat => (
                            <button key={cat.id} id={`tab-${cat.id}`} onClick={() => scrollToCategory(cat.id)}
                                    className={clsx('shrink-0 px-4 py-2 rounded-full text-[14px] font-medium transition-all duration-200',
                                        activeCategory === cat.id ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500')}>
                                {cat.icon} {cat.name_ru}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="px-4 pt-4">
                {searchResults !== null ? (
                    <div>
                        <p className="text-sm text-slate-400 mb-3">
                            {searchLoading ? 'Поиск...' : `Найдено: ${searchResults.length}`}
                        </p>
                        {searchResults.map(item => (
                            <FoodCard key={item.id} item={item} onOpen={setSelectedItem}
                                      isClosed={isClosed} isFav={favIds.has(item.id)} onToggleFav={handleToggleFav} />
                        ))}
                        {!searchLoading && searchResults.length === 0 && (
                            <p className="text-center text-slate-400 py-8">Ничего не найдено</p>
                        )}
                    </div>
                ) : (
                    <>
                        {popular.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-[18px] font-semibold text-slate-800 mb-3">Часто заказывают</h2>
                                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                                    {popular.map(item => (
                                        <PopularCard key={item.id} item={item} onOpen={setSelectedItem} isClosed={isClosed} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {categories.map(cat => {
                            const items = cat.items || [];
                            if (!items.length) return null;
                            return (
                                <div key={cat.id} ref={(el) => categoryRefs.current[cat.id] = el}
                                     data-category-id={cat.id} className="mb-6" style={{ scrollMarginTop: '140px' }}>
                                    <h2 className="text-[18px] font-semibold text-slate-800 mb-3">{cat.icon} {cat.name_ru}</h2>
                                    {items.map(item => (
                                        <FoodCard key={item.id} item={item} onOpen={setSelectedItem}
                                                  isClosed={isClosed} isFav={favIds.has(item.id)} onToggleFav={handleToggleFav} />
                                    ))}
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {!isClosed && <FloatingCartButton />}
            {selectedItem && <FoodDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} isClosed={isClosed} />}
        </div>
    );
};

export default MenuPage;