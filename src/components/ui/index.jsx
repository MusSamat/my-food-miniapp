import React, { useState } from 'react';
import { Minus, Plus, X, Loader2, Clock } from 'lucide-react';
import { clsx } from 'clsx';

// ─── Lazy Image with placeholder ───
export const LazyImage = ({ src, alt, className, placeholder }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    if (!src || error) {
        return (
            <div className={clsx('bg-slate-100 flex items-center justify-center', className)}>
                <span className="text-3xl">{placeholder || '🍽'}</span>
            </div>
        );
    }

    return (
        <div className={clsx('relative bg-slate-100 overflow-hidden', className)}>
            {!loaded && (
                <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
                    <span className="text-2xl opacity-30">{placeholder || '🍽'}</span>
                </div>
            )}
            <img
                src={src}
                alt={alt || ''}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
                className={clsx(
                    'w-full h-full object-cover transition-opacity duration-300',
                    loaded ? 'opacity-100' : 'opacity-0'
                )}
            />
        </div>
    );
};

// ─── Closed Banner ───
export const ClosedBanner = ({ from, to }) => (
    <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mx-4 mt-4 flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-xl shrink-0">
            <Clock size={18} className="text-red-500" />
        </div>
        <div>
            <p className="font-semibold text-red-700 text-sm">Ресторан сейчас закрыт</p>
            {from && to && <p className="text-red-400 text-xs mt-0.5">Время работы: {from} — {to}</p>}
        </div>
    </div>
);

// ─── Counter [- N +] ───
export const Counter = ({ quantity, onAdd, onRemove, size = 'md' }) => {
    const sizes = {
        sm: 'h-7 text-xs gap-1',
        md: 'h-8 text-sm gap-2',
    };
    const btnSizes = {
        sm: 'w-7 h-7',
        md: 'w-8 h-8',
    };
    const iconSize = size === 'sm' ? 14 : 16;

    return (
        <div className={clsx('flex items-center bg-brand-50 rounded-lg', sizes[size])}>
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className={clsx('flex items-center justify-center rounded-l-lg text-brand-600 active:bg-brand-100 transition-colors', btnSizes[size])}>
                <Minus size={iconSize} />
            </button>
            <span className="font-bold text-brand-700 min-w-[20px] text-center">{quantity}</span>
            <button onClick={(e) => { e.stopPropagation(); onAdd(); }}
                    className={clsx('flex items-center justify-center rounded-r-lg text-brand-600 active:bg-brand-100 transition-colors', btnSizes[size])}>
                <Plus size={iconSize} />
            </button>
        </div>
    );
};

// ─── Add Button (круглая "+") ───
export const AddButton = ({ onClick, size = 32, disabled }) => (
    <button
        onClick={(e) => { e.stopPropagation(); if (!disabled) onClick(); }}
        disabled={disabled}
        className={clsx(
            'flex items-center justify-center rounded-full bg-brand-500 text-white active:scale-90 transition-transform',
            disabled && 'opacity-40 active:scale-100'
        )}
        style={{ width: size, height: size }}
    >
        <Plus size={size * 0.5} />
    </button>
);

// ─── Status Badge ───
const STATUS_MAP = {
    coming_soon: { label: 'Скоро', className: 'bg-amber-100 text-amber-800' },
    out_of_stock: { label: 'Нет', className: 'bg-red-100 text-red-800' },
};

export const ItemBadge = ({ status }) => {
    const config = STATUS_MAP[status];
    if (!config) return null;
    return (
        <span className={clsx('absolute top-2 left-2 px-2 py-0.5 rounded-md text-[11px] font-semibold', config.className)}>
            {config.label}
        </span>
    );
};

// ─── Backdrop overlay ───
export const Backdrop = ({ onClick, children }) => (
    <div className="fixed inset-0 z-50 animate-fadeIn" onClick={onClick}>
        <div className="absolute inset-0 bg-black/50" />
        <div onClick={(e) => e.stopPropagation()}>
            {children}
        </div>
    </div>
);

// ─── Spinner ───
export const Spinner = ({ className }) => (
    <div className={clsx('flex items-center justify-center py-16', className)}>
        <Loader2 size={28} className="animate-spin text-brand-500" />
    </div>
);

// ─── Empty State ───
export const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        {Icon && <div className="p-4 bg-slate-100 rounded-2xl mb-4"><Icon size={28} className="text-slate-400" /></div>}
        <p className="font-semibold text-slate-700">{title}</p>
        {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
    </div>
);

// ─── Format price ───
export const formatPrice = (n) => n?.toLocaleString('ru-RU') || '0';