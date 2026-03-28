import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, ChefHat, Clock, Lock, Phone } from 'lucide-react';
import { clsx } from 'clsx';
import { getBranches } from '../services/api';
import { Spinner } from '../components/ui';
import useBranchStore from '../stores/branchStore';
import { useTelegram } from '../hooks/useTelegram';

/**
 * Утилита для проверки доступности филиала.
 * Учитывает ручной флаг и текущее время.
 */
const getBranchStatus = (branch) => {
    if (!branch.is_open) return false;

    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();

    const [fH, fM] = branch.working_hours_from.split(':').map(Number);
    const [tH, tM] = branch.working_hours_to.split(':').map(Number);
    const start = fH * 60 + fM;
    const end = tH * 60 + tM;

    // Обработка ночных смен (например, 10:00 - 02:00)
    if (end < start) {
        return current >= start || current <= end;
    }
    return current >= start && current <= end;
};

// ─── Компонент карточки филиала ───
const BranchCard = ({ branch, onSelect }) => {
    const isOpenNow = useMemo(() => getBranchStatus(branch), [branch]);

    return (
        <button
            onClick={() => onSelect(branch)}
            className={clsx(
                "w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 text-left transition-all active:scale-[0.98]",
                !isOpenNow && "opacity-60 grayscale-[0.5]"
            )}
        >
            <div className={clsx(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                isOpenNow ? "bg-brand-50 text-brand-500" : "bg-slate-100 text-slate-400"
            )}>
                {isOpenNow ? <MapPin size={22} /> : <Lock size={20} />}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 truncate">{branch.name}</h3>
                    {!isOpenNow && (
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md uppercase tracking-tight">
                            Закрыто
                        </span>
                    )}
                </div>

                <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1">
                    <MapPin size={10} /> {branch.address}
                </p>

                <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                        <Clock size={12} />
                        <span>{branch.working_hours_from} – {branch.working_hours_to}</span>
                    </div>
                    {branch.phone && (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <Phone size={10} /> {branch.phone}
                        </div>
                    )}
                </div>
            </div>

            <ChevronRight size={18} className="text-slate-300 shrink-0" />
        </button>
    );
};

// ─── Основная страница ───
const BranchSelectPage = () => {
    const navigate = useNavigate();
    const { ready, expand, haptic } = useTelegram();
    const { loadBranch, branchId } = useBranchStore();
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ready();
        expand();

        getBranches().then(data => {
            setBranches(data);

            // Если филиал один и он открыт — переходим сразу
            if (data.length === 1 && getBranchStatus(data[0])) {
                handleSelect(data[0]);
            }

            // Если уже выбран открытый филиал — в меню
            const savedBranch = data.find(b => b.id === branchId);
            if (savedBranch && getBranchStatus(savedBranch)) {
                navigate('/menu', { replace: true });
            }
        }).finally(() => setLoading(false));
    }, []);

    const handleSelect = async (branch) => {
        haptic('light'); // Тактильный отклик
        const data = await loadBranch(branch.id);
        if (data) navigate('/menu', { replace: true });
    };

    if (loading) return <Spinner />;

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
            {/* Header */}
            <div className="px-6 pt-12 pb-8 text-center bg-white rounded-b-[40px] shadow-sm mb-4">
                <div className="w-16 h-16 bg-brand-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
                    <ChefHat size={32} className="text-white" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Ihsan Et</h1>
                <p className="text-[13px] text-slate-400 mt-2 font-medium">Выберите филиал для заказа</p>
            </div>

            {/* Branch List */}
            <div className="px-4 space-y-3 pb-10">
                {branches.length > 0 ? (
                    branches.map(branch => (
                        <BranchCard
                            key={branch.id}
                            branch={branch}
                            onSelect={handleSelect}
                        />
                    ))
                ) : (
                    <div className="text-center py-12 px-8">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-slate-800 font-bold">Все филиалы закрыты</h3>
                        <p className="text-sm text-slate-400 mt-1">Пожалуйста, заходите в рабочее время.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BranchSelectPage;