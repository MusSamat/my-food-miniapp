import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getBranchSettings } from '../services/api';

const useBranchStore = create(
    persist(
        (set, get) => ({
            branchId: null,
            branch: null,

            setBranch: (id, data) => set({ branchId: id, branch: data }),

            loadBranch: async (id) => {
                try {
                    const data = await getBranchSettings(id);
                    set({ branchId: id, branch: data });
                    return data;
                } catch {
                    return null;
                }
            },

            refreshBranch: async () => {
                const id = get().branchId;
                if (!id) return;
                try {
                    const data = await getBranchSettings(id);
                    set({ branch: data });
                } catch {}
            },

            isOpen: () => get().branch?.is_currently_open !== false,
            isMorningMode: () => get().branch?.is_morning_mode === true,
            getDeliveryFee: () => {
                const b = get().branch;
                if (!b) return 150;
                return b.is_morning_mode ? 0 : b.delivery_fee;
            },
            getMinOrder: () => get().branch?.min_order_amount || 0,
        }),
        {
            name: 'food-branch',
            partialize: (state) => ({ branchId: state.branchId }),
        }
    )
);

export default useBranchStore;