import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, ChefHat } from 'lucide-react';
import { getBranches } from '../services/api';
import { Spinner } from '../components/ui';
import useBranchStore from '../stores/branchStore';
import { useTelegram } from '../hooks/useTelegram';

const BranchSelectPage = () => {
    const navigate = useNavigate();
    const { ready, expand } = useTelegram();
    const { setBranch, loadBranch, branchId } = useBranchStore();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ready();
        expand();
        getBranches().then(data => {
            setBranches(data);
            // Если один филиал — сразу туда
            if (data.length === 1) {
                handleSelect(data[0]);
            }
            // Если уже выбран филиал — сразу в меню
            if (branchId && data.find(b => b.id === branchId)) {
                navigate('/menu', { replace: true });
            }
        }).finally(() => setLoading(false));
    }, []);

    const handleSelect = async (branch) => {
        const data = await loadBranch(branch.id);
        if (data) navigate('/menu', { replace: true });
    };

    if (loading) return <Spinner />;

    return (
        <div className="min-h-screen flex flex-col">
            <div className="px-6 pt-12 pb-6 text-center">
                <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ChefHat size={28} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">Food Delivery</h1>
                <p className="text-sm text-slate-400 mt-2">Выберите филиал для заказа</p>
            </div>

            <div className="px-4 space-y-3 pb-8">
                {branches.map(branch => (
                    <button
                        key={branch.id}
                        onClick={() => handleSelect(branch)}
                        className="w-full bg-white rounded-2xl p-4 shadow-card flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
                    >
                        <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                            <MapPin size={22} className="text-brand-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-800">{branch.name}</h3>
                            <p className="text-sm text-slate-400 mt-0.5 truncate">{branch.address}</p>
                            {branch.phone && <p className="text-xs text-slate-400 mt-0.5">{branch.phone}</p>}
                        </div>
                        <ChevronRight size={20} className="text-slate-300 shrink-0" />
                    </button>
                ))}

                {branches.length === 0 && (
                    <p className="text-center text-slate-400 py-8">Нет доступных филиалов</p>
                )}
            </div>
        </div>
    );
};

export default BranchSelectPage;