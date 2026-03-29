import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, MapPin, User, Phone, MessageSquare, Utensils, Minus, Plus, Building2, PenLine, LocateFixed } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import useCartStore from '../stores/cartStore';
import useUserStore from '../stores/userStore';
import useBranchStore from '../stores/branchStore';
import { createOrder, getOffices, saveUser, checkZone, checkZoneByAddress } from '../services/api';
import { formatPrice } from '../components/ui';
import { useTelegram } from '../hooks/useTelegram';

// ═══ InputField OUTSIDE component — prevents focus loss ═══
const InputField = ({ icon: Icon, label, field, type = 'text', placeholder, required, value, onChange, error, rightElement }) => (
    <div>
        <label className="block text-[13px] font-medium text-slate-500 mb-1">
            {label}{required && ' *'}
        </label>
        <div className="relative">
            {Icon && <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />}
            <input
                type={type}
                className={clsx('input', Icon && 'pl-10', rightElement && 'pr-12', error && 'border-red-400 focus:border-red-400 focus:ring-red-400/10')}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(field, e.target.value)}
            />
            {rightElement && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightElement}</div>
            )}
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { user: tgUser, userId, haptic, openLink, requestLocation } = useTelegram();
    const { items, promo, clear } = useCartStore();
    const { user: savedUser, updateUser } = useUserStore();
    const { branch, refreshBranch } = useBranchStore();

    // ─── Branch + zone based settings ───
    const isMorning = branch?.is_morning_mode === true;
    const isOpen = branch?.is_currently_open !== false;

    const [offices, setOffices] = useState([]);
    const [addressType, setAddressType] = useState('office');
    const [form, setForm] = useState({
        name: '', phone: '', address: '', apartment: '', floor: '', entrance: '',
        courier_comment: '', office_id: '', comment: '', cutlery_count: 1,
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [locating, setLocating] = useState(false);
    const [zone, setZone] = useState(null);
    const [zoneLoading, setZoneLoading] = useState(false);

    // ─── Dynamic fee from zone or branch ───
    const DELIVERY_FEE = isMorning ? 0 : (zone ? zone.fee : (branch?.delivery_fee || 150));
    const MIN_ORDER = zone?.min_order || branch?.min_order_amount || 0;

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discount = promo?.discount || 0;
    const total = subtotal - discount + DELIVERY_FEE;

    // ─── Load offices + refresh branch ───
    useEffect(() => {
        getOffices().then(setOffices);
        refreshBranch();
    }, []);

    // ─── Fill form from saved user data ───
    useEffect(() => {
        const name = savedUser?.first_name || tgUser?.first_name || '';
        const phone = savedUser?.phone || '';
        const address = savedUser?.saved_address || '';
        const apartment = savedUser?.saved_apartment || '';
        const floor = savedUser?.saved_floor || '';
        const entrance = savedUser?.saved_entrance || '';
        const officeId = savedUser?.saved_office_id || '';

        setForm(f => ({
            ...f,
            name: name || f.name,
            phone: phone || f.phone,
            address: address || f.address,
            apartment: apartment || f.apartment,
            floor: floor || f.floor,
            entrance: entrance || f.entrance,
            office_id: officeId ? String(officeId) : f.office_id,
        }));

        if (address && !officeId) setAddressType('custom');
    }, [savedUser, tgUser]);

    // ─── Redirect if cart empty ───
    useEffect(() => {
        if (items.length === 0) navigate('/');
    }, [items]);

    // ─── Auto-check zone when address changes (debounced) ───
    useEffect(() => {
        if (addressType !== 'custom' || !form.address || form.address.length < 5 || isMorning) return;

        const timer = setTimeout(async () => {
            setZoneLoading(true);
            try {
                const result = await checkZoneByAddress(form.address);
                setZone(result.data || null);
            } catch {
                setZone(null);
            } finally {
                setZoneLoading(false);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [form.address, addressType]);

    const update = (field, value) => {
        setForm(f => ({ ...f, [field]: value }));
        if (errors[field]) setErrors(e => ({ ...e, [field]: null }));
    };

    const handleAddressTypeChange = (type) => {
        setAddressType(type);
        haptic('impact');
        setZone(null);
        if (type === 'office') {
            setForm(f => ({ ...f, address: '', apartment: '', floor: '', entrance: '' }));
        } else {
            setForm(f => ({ ...f, office_id: '' }));
        }
        setErrors({});
    };

    // ─── Geolocation + zone check ───
    const handleRequestLocation = async () => {
        setLocating(true);
        setZoneLoading(true);
        try {
            const loc = await requestLocation();
            if (loc) {
                // Show coordinates immediately
                update('address', `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`);
                haptic('success');

                // Check delivery zone
                try {
                    const zoneResult = await checkZone(loc.latitude, loc.longitude);
                    if (zoneResult.data) {
                        setZone(zoneResult.data);
                        toast.success(`Зона: ${zoneResult.data.name} (${zoneResult.data.fee} сом)`);
                    } else {
                        setZone(null);
                    }
                } catch {}

                // Reverse geocode for readable address (background)
                try {
                    const resp = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${loc.latitude}&lon=${loc.longitude}&format=json&accept-language=ru`,
                        { headers: { 'User-Agent': 'FoodDeliveryApp/1.0' } }
                    );
                    const data = await resp.json();
                    if (data.display_name) update('address', data.display_name);
                } catch {}

                updateUser({ latitude: loc.latitude, longitude: loc.longitude });
            } else {
                toast.error('Не удалось определить местоположение');
                haptic('error');
            }
        } finally {
            setLocating(false);
            setZoneLoading(false);
        }
    };

    // ─── Validation ───
    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Введите имя';
        if (!form.phone.trim()) e.phone = 'Введите телефон';

        if (isMorning) {
            if (!form.office_id) e.office_id = 'Выберите офис';
        } else if (addressType === 'office') {
            if (!form.office_id) e.office_id = 'Выберите офис';
        } else {
            if (!form.address.trim()) e.address = 'Введите адрес';
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ─── Submit order ───
    const handleSubmit = async () => {
        if (!validate()) { haptic('error'); return; }
        setSubmitting(true);
        try {
            const selectedOffice = offices.find(o => o.id === parseInt(form.office_id));
            const orderData = {
                telegram_user_id: userId || 0,
                telegram_username: tgUser?.username || '',
                type: 'delivery',
                name: form.name,
                phone: form.phone,
                branch_id: branch?.id || null,
                items: items.map(i => ({ id: i.id, quantity: i.quantity })),
                ...(promo && { promo_code: promo.code }),
                comment: form.comment || null,
                cutlery_count: form.cutlery_count,
            };

            if (isMorning) {
                const morningOffice = branch?.office_addresses?.find(o => o.id === parseInt(form.office_id));
                orderData.address = morningOffice?.address || '';
                orderData.office_id = parseInt(form.office_id);
            } else if (addressType === 'office' && selectedOffice) {
                orderData.address = selectedOffice.address;
                orderData.office_id = selectedOffice.id;
            } else {
                orderData.address = form.address;
                orderData.apartment = form.apartment || null;
                orderData.floor = form.floor || null;
                orderData.entrance = form.entrance || null;
                orderData.courier_comment = form.courier_comment || null;
            }

            const result = await createOrder(orderData);

            // Save user data
            const userData = {
                telegram_id: userId || 0,
                username: tgUser?.username,
                first_name: form.name || tgUser?.first_name,
                last_name: tgUser?.last_name,
                phone: form.phone,
            };

            if (isMorning) {
                userData.saved_office_id = parseInt(form.office_id);
            } else if (addressType === 'office' && selectedOffice) {
                userData.saved_office_id = selectedOffice.id;
            } else {
                userData.saved_address = form.address;
                userData.saved_apartment = form.apartment;
                userData.saved_floor = form.floor;
                userData.saved_entrance = form.entrance;
                userData.saved_office_id = null;
            }

            saveUser(userData).then(saved => {
                if (saved) updateUser(saved);
            }).catch(() => {});

            haptic('success');
            clear();

            if (result.payment_url) openLink(result.payment_url);
            navigate(`/order-status/${result.order_id}`, { replace: true });

        } catch (err) {
            haptic('error');
            toast.error(err.response?.data?.message || 'Ошибка создания заказа');
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Location button ───
    const locationButton = (
        <button type="button" onClick={handleRequestLocation} disabled={locating}
                className="p-2 text-brand-500 hover:bg-brand-50 rounded-lg transition-colors">
            {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
        </button>
    );

    return (
        <div className="min-h-screen flex flex-col pb-28">
            {/* Header */}
            <div className="flex items-center px-4 h-14 border-b border-slate-100 bg-white sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft size={22} className="text-slate-600" /></button>
                <span className="flex-1 text-center font-semibold text-[18px]">Оформление</span>
                <div className="w-8" />
            </div>

            <div className="px-4 pt-5 space-y-5">
                {/* ─── Адрес доставки ─── */}
                <div>
                    <h3 className="text-[14px] font-semibold text-slate-700 mb-3">Адрес доставки</h3>

                    {/* Morning mode banner */}
                    {isMorning && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                            <p className="font-semibold text-amber-700 text-sm">☀️ Утренний режим</p>
                            <p className="text-amber-600 text-xs mt-1">Доставка бесплатная! Выберите офис из списка.</p>
                        </div>
                    )}

                    {isMorning ? (
                        /* Morning: only branch office addresses */
                        <div>
                            <label className="block text-[13px] font-medium text-slate-500 mb-1">Выберите офис *</label>
                            <select className={clsx('input', errors.office_id && 'border-red-400')}
                                    value={form.office_id} onChange={(e) => update('office_id', e.target.value)}>
                                <option value="">Выберите офис доставки</option>
                                {branch?.office_addresses?.map(o => (
                                    <option key={o.id} value={o.id}>{o.name} — {o.address}</option>
                                ))}
                            </select>
                            {errors.office_id && <p className="text-xs text-red-500 mt-1">{errors.office_id}</p>}
                            {form.office_id && (() => {
                                const office = branch?.office_addresses?.find(o => o.id === parseInt(form.office_id));
                                if (!office) return null;
                                return (
                                    <div className="mt-3 p-3 bg-amber-50 rounded-xl text-sm">
                                        <p className="font-semibold text-slate-700">{office.name}</p>
                                        <p className="text-slate-500 mt-0.5">{office.address}</p>
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        /* Normal: office or custom address toggle */
                        <>
                            <div className="flex bg-surface rounded-xl p-1 mb-4">
                                <button onClick={() => handleAddressTypeChange('office')}
                                        className={clsx('flex-1 h-11 rounded-xl text-[14px] font-medium transition-all duration-200 flex items-center justify-center gap-2',
                                            addressType === 'office' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500')}>
                                    <Building2 size={16} /> Наш офис
                                </button>
                                <button onClick={() => handleAddressTypeChange('custom')}
                                        className={clsx('flex-1 h-11 rounded-xl text-[14px] font-medium transition-all duration-200 flex items-center justify-center gap-2',
                                            addressType === 'custom' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500')}>
                                    <PenLine size={16} /> Другой адрес
                                </button>
                            </div>

                            {addressType === 'office' && (
                                <div>
                                    <label className="block text-[13px] font-medium text-slate-500 mb-1">Выберите офис *</label>
                                    <select className={clsx('input', errors.office_id && 'border-red-400')}
                                            value={form.office_id} onChange={(e) => update('office_id', e.target.value)}>
                                        <option value="">Выберите офис доставки</option>
                                        {offices.map(o => <option key={o.id} value={o.id}>{o.name} — {o.address}</option>)}
                                    </select>
                                    {errors.office_id && <p className="text-xs text-red-500 mt-1">{errors.office_id}</p>}
                                    {form.office_id && (() => {
                                        const office = offices.find(o => o.id === parseInt(form.office_id));
                                        if (!office) return null;
                                        return (
                                            <div className="mt-3 p-3 bg-brand-50 rounded-xl text-sm">
                                                <p className="font-semibold text-slate-700">{office.name}</p>
                                                <p className="text-slate-500 mt-0.5">{office.address}</p>
                                                {office.working_hours && <p className="text-slate-400 mt-0.5">🕐 {office.working_hours}</p>}
                                                {office.phone && <p className="text-slate-400 mt-0.5">📞 {office.phone}</p>}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {addressType === 'custom' && (
                                <div className="space-y-3">
                                    <InputField icon={MapPin} label="Адрес" field="address" placeholder="ул. Ибраимова, 115/3" required
                                                value={form.address} onChange={update} error={errors.address} rightElement={locationButton} />
                                    <div className="grid grid-cols-3 gap-3">
                                        <InputField label="Подъезд" field="entrance" placeholder="2" value={form.entrance} onChange={update} />
                                        <InputField label="Этаж" field="floor" placeholder="3" value={form.floor} onChange={update} />
                                        <InputField label="Квартира" field="apartment" placeholder="42" value={form.apartment} onChange={update} />
                                    </div>
                                    <InputField icon={MessageSquare} label="Комментарий курьеру" field="courier_comment"
                                                placeholder="Не звонить, домофон 57" value={form.courier_comment} onChange={update} />
                                </div>
                            )}
                        </>
                    )}

                    {/* Zone info (only for custom address, not morning) */}
                    {addressType === 'custom' && !isMorning && (
                        zoneLoading ? (
                            <div className="mt-3 p-2 text-xs text-slate-400 flex items-center gap-2">
                                <Loader2 size={12} className="animate-spin" /> Определяем зону доставки...
                            </div>
                        ) : zone ? (
                            <div className="mt-3 p-3 bg-emerald-50 rounded-xl text-sm animate-fadeIn">
                                <p className="font-semibold text-emerald-700">📍 Зона: {zone.name}</p>
                                <p className="text-emerald-600 text-xs mt-0.5">Доставка: {zone.fee} сом</p>
                            </div>
                        ) : form.address.length >= 5 ? (
                            <div className="mt-3 p-3 bg-amber-50 rounded-xl text-sm animate-fadeIn">
                                <p className="text-amber-600 text-xs">Адрес вне зоны — стандартная доставка {branch?.delivery_fee || 150} сом</p>
                            </div>
                        ) : null
                    )}
                </div>

                {/* ─── Контакты ─── */}
                <div className="space-y-3">
                    <h3 className="text-[14px] font-semibold text-slate-700">Контактные данные</h3>
                    <InputField icon={User} label="Имя" field="name" placeholder="Ваше имя" required
                                value={form.name} onChange={update} error={errors.name} />
                    <InputField icon={Phone} label="Телефон" field="phone" type="tel" placeholder="+996 773 000 000" required
                                value={form.phone} onChange={update} error={errors.phone} />
                </div>

                {/* ─── Комментарий ─── */}
                <div>
                    <label className="block text-[13px] font-medium text-slate-500 mb-1">Комментарий к заказу</label>
                    <textarea className="input h-20 py-3 resize-none" placeholder="Дополнительные пожелания..."
                              value={form.comment} onChange={(e) => update('comment', e.target.value)} />
                </div>

                {/* ─── Приборы ─── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Utensils size={16} />
                        <span className="text-[14px] font-medium">Приборы</span>
                    </div>
                    <div className="flex items-center gap-3 bg-surface rounded-xl px-1">
                        <button onClick={() => update('cutlery_count', Math.max(0, form.cutlery_count - 1))}
                                className="w-9 h-9 flex items-center justify-center text-slate-500"><Minus size={16} /></button>
                        <span className="font-semibold text-slate-800 w-5 text-center">{form.cutlery_count}</span>
                        <button onClick={() => update('cutlery_count', Math.min(10, form.cutlery_count + 1))}
                                className="w-9 h-9 flex items-center justify-center text-slate-500"><Plus size={16} /></button>
                    </div>
                </div>

                {/* ─── Итого ─── */}
                <div className="bg-white rounded-2xl p-4 shadow-card space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Сумма</span><span>{formatPrice(subtotal)} сом</span></div>
                    {discount > 0 && <div className="flex justify-between text-sm"><span className="text-slate-500">Скидка</span><span className="text-emerald-600">-{formatPrice(discount)} сом</span></div>}
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Доставка</span>
                        <span>
                            {isMorning ? <span className="text-emerald-600 font-medium">Бесплатно ☀️</span>
                                : zone ? <span className="text-emerald-600 font-medium">{formatPrice(zone.fee)} сом <span className="text-xs text-slate-400">({zone.name})</span></span>
                                    : `${formatPrice(DELIVERY_FEE)} сом`}
                        </span>
                    </div>
                    <div className="border-t border-dashed border-slate-200 pt-2">
                        <div className="flex justify-between font-bold text-[18px]"><span>Итого</span><span>{formatPrice(total)} сом</span></div>
                    </div>
                </div>

                {/* ─── Warnings ─── */}
                {!isOpen && (
                    <div className="bg-red-50 rounded-xl p-4 text-center">
                        <p className="text-red-600 font-semibold text-sm">Ресторан сейчас закрыт</p>
                        <p className="text-red-400 text-xs mt-1">Время работы: {branch?.working_hours_from} — {branch?.working_hours_to}</p>
                    </div>
                )}

                {MIN_ORDER > 0 && subtotal < MIN_ORDER && (
                    <div className="bg-amber-50 rounded-xl p-4 text-center">
                        <p className="text-amber-600 font-semibold text-sm">Минимальный заказ: {formatPrice(MIN_ORDER)} сом</p>
                        <p className="text-amber-400 text-xs mt-1">Добавьте ещё на {formatPrice(MIN_ORDER - subtotal)} сом</p>
                    </div>
                )}
            </div>

            {/* ─── Pay button ─── */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 safe-bottom">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !isOpen || (MIN_ORDER > 0 && subtotal < MIN_ORDER)}
                    className={clsx('btn-primary w-full',
                        (submitting || !isOpen || (MIN_ORDER > 0 && subtotal < MIN_ORDER)) && 'opacity-50'
                    )}
                >
                    {submitting ? (
                        <><Loader2 size={18} className="animate-spin" /> Обработка...</>
                    ) : !isOpen ? (
                        'Ресторан закрыт'
                    ) : (
                        `Оплатить ${formatPrice(total)} сом`
                    )}
                </button>
            </div>
        </div>
    );
};

export default CheckoutPage;