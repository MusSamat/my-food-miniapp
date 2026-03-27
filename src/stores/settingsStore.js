import { create } from 'zustand';
import { getRestaurantSettings } from '../services/api';

const useSettingsStore = create((set, get) => ({
    settings: null,
    loaded: false,

    loadSettings: async () => {
        try {
            const data = await getRestaurantSettings();
            set({ settings: data, loaded: true });
            return data;
        } catch {
            const fallback = {
                delivery_fee: 150,
                min_order_amount: 0,
                is_currently_open: true,
                working_hours_from: '07:00',
                working_hours_to: '23:00',
            };
            set({ settings: fallback, loaded: true });
            return fallback;
        }
    },

    // Принудительная перезагрузка (при возврате на страницу)
    refreshSettings: async () => {
        try {
            const data = await getRestaurantSettings();
            set({ settings: data });
        } catch {}
    },

    isOpen: () => get().settings?.is_currently_open !== false,
    getDeliveryFee: () => get().settings?.delivery_fee ?? 150,
    getMinOrder: () => get().settings?.min_order_amount ?? 0,
}));

export default useSettingsStore;