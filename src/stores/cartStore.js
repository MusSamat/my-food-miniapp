import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            promo: null,

            addItem: (item) => {
                const items = get().items;
                const existing = items.find(i => i.id === item.id);
                if (existing) {
                    set({ items: items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) });
                } else {
                    set({ items: [...items, {
                            id: item.id,
                            name: item.name_ru || item.name,
                            price: item.price,
                            image_url: item.image_url,
                            quantity: 1,
                        }]});
                }
            },

            removeItem: (id) => {
                const items = get().items;
                const existing = items.find(i => i.id === id);
                if (!existing) return;
                if (existing.quantity <= 1) {
                    set({ items: items.filter(i => i.id !== id) });
                } else {
                    set({ items: items.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i) });
                }
            },

            deleteItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),

            getQuantity: (id) => get().items.find(i => i.id === id)?.quantity || 0,

            clear: () => set({ items: [], promo: null }),

            setPromo: (promo) => set({ promo }),
            clearPromo: () => set({ promo: null }),
        }),
        {
            name: 'food-cart',
            storage: createJSONStorage(() => {
                try {
                    localStorage.setItem('__test__', '1');
                    localStorage.removeItem('__test__');
                    return localStorage;
                } catch {
                    console.warn('localStorage недоступен, используем memory storage');
                    const store = {};
                    return {
                        getItem: (key) => store[key] || null,
                        setItem: (key, value) => { store[key] = value; },
                        removeItem: (key) => { delete store[key]; },
                    };
                }
            }),
        }
    )
);

export default useCartStore;