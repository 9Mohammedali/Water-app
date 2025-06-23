// =================================================================
//  data.js: وحدة إدارة البيانات (Single Source of Truth)
// =================================================================
// مسؤول عن تحميل، حفظ، وتعديل كل بيانات التطبيق.
// لا يتفاعل مباشرة مع الواجهة الرسومية (DOM).
// =================================================================

// الحالة الأولية للتطبيق
let state = {
    subscribers: [],
    settings: {
        projectName: 'مشروع المياه',
        unitPrice: 10,
        currency: 'ريال'
    },
    ledger: []
};

/**
 * يولد ID فريد للبيانات الجديدة
 * @returns {string}
 */
const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

/**
 * تحميل البيانات من LocalStorage عند بدء التشغيل
 */
export function loadData() {
    const savedState = localStorage.getItem('waterProjectState');
    if (savedState) {
        state = JSON.parse(savedState);
    }
    // التأكد من أن جميع الخصائص موجودة لتجنب الأخطاء بعد التحديثات
    state.settings = { ...{ projectName: 'مشروع المياه', unitPrice: 10, currency: 'ريال' }, ...state.settings };
    state.subscribers = state.subscribers || [];
    state.ledger = state.ledger || [];
}

/**
 * حفظ الحالة الحالية للتطبيق في LocalStorage
 */
function saveData() {
    localStorage.setItem('waterProjectState', JSON.stringify(state));
}

/**
 * الحصول على نسخة من حالة التطبيق (للقراءة فقط)
 * @returns {object}
 */
export const getState = () => JSON.parse(JSON.stringify(state));

/**
 * البحث عن مشترك بواسطة ID
 * @param {string} id 
 * @returns {object|undefined}
 */
export const getSubscriberById = (id) => state.subscribers.find(s => s.id === id);

/**
 * إضافة مشترك جديد
 * @param {object} subscriberData - { name, initialReading, openingBalance }
 */
export function addSubscriber({ name, initialReading, openingBalance }) {
    const newSubscriber = {
        id: generateId(),
        name,
        initialReading: Number(initialReading),
        openingBalance: Number(openingBalance),
        totalDue: Number(openingBalance),
        invoices: [],
        createdAt: new Date().toISOString()
    };
    state.subscribers.push(newSubscriber);
    // تسجيل الرصيد الافتتاحي في السجل المالي
    if (openingBalance !== 0) {
        addLedgerEntry({
            subscriberId: newSubscriber.id,
            subscriberName: name,
            description: 'رصيد افتتاحي',
            debit: openingBalance > 0 ? openingBalance : 0,
            credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
            type: 'opening_balance'
        });
    }
    saveData();
    return newSubscriber;
}

/**
 * تحديث بيانات مشترك
 * @param {string} id 
 * @param {object} data - {name, initialReading, openingBalance}
 */
export function updateSubscriber(id, data) {
    const subscriber = getSubscriberById(id);
    if (!subscriber) return;
    // يجب إعادة حساب المستحقات عند تغيير الرصيد الافتتاحي
    // هذه العملية معقدة وتحتاج منطق إضافي لم يتم تضمينه هنا للتبسيط
    Object.assign(subscriber, data);
    saveData();
}


/**
 * إضافة فاتورة جديدة للمشترك
 * @param {string} subscriberId 
 * @param {number} currentReading 
 * @param {string} notes 
 */
export function addInvoice(subscriberId, currentReading, notes = '') {
    const subscriber = getSubscriberById(subscriberId);
    if (!subscriber) return null;

    const lastInvoice = subscriber.invoices[subscriber.invoices.length - 1];
    const previousReading = lastInvoice ? lastInvoice.currentReading : subscriber.initialReading;

    if (currentReading < previousReading) {
        throw new Error("القراءة الحالية لا يمكن أن تكون أقل من القراءة السابقة.");
    }

    const consumption = currentReading - previousReading;
    const amount = consumption * state.settings.unitPrice;

    const newInvoice = {
        id: generateId(),
        date: new Date().toISOString(),
        previousReading,
        currentReading,
        consumption,
        amount,
        paid: 0,
        status: 'unpaid', // unpaid, paid, partial
        notes,
        payments: []
    };

    subscriber.invoices.push(newInvoice);
    subscriber.totalDue += amount;

    addLedgerEntry({
        subscriberId: subscriber.id,
        subscriberName: subscriber.name,
        invoiceId: newInvoice.id,
        description: `فاتورة استهلاك (${consumption} وحدة)`,
        debit: amount,
        credit: 0,
        type: 'invoice'
    });
    
    saveData();
    return newInvoice;
}

/**
 * تسجيل دفعة لفاتورة
 * @param {string} subscriberId
 * @param {number} amount
 * @param {string} date
 * @param {string} notes
 */
export function recordPayment(subscriberId, amount, date, notes) {
    const subscriber = getSubscriberById(subscriberId);
    if (!subscriber) return;

    subscriber.totalDue -= amount;

    const payment = {
        id: generateId(),
        amount,
        date,
        notes
    };

    // منطق توزيع الدفعات على الفواتير يمكن أن يكون معقداً
    // للتبسيط، سنسجلها كدفعة عامة للمشترك
    addLedgerEntry({
        subscriberId,
        subscriberName: subscriber.name,
        description: notes || 'تسجيل دفعة',
        debit: 0,
        credit: amount,
        type: 'payment'
    });
    
    saveData();
    return payment;
}

/**
 * تحديث الإعدادات العامة
 * @param {object} newSettings 
 */
export function updateSettings(newSettings) {
    state.settings = { ...state.settings, ...newSettings };
    saveData();
}

/**
 * إضافة سجل في دفتر الأستاذ العام
 * @param {object} entry
 */
function addLedgerEntry(entry) {
    const newEntry = {
        id: generateId(),
        date: new Date().toISOString(),
        ...entry
    };
    state.ledger.push(newEntry);
    state.ledger.sort((a, b) => new Date(b.date) - new Date(a.date)); // ترتيب تنازلي
}

/**
 * تسجيل سحب للمالك
 * @param {number} amount 
 * @param {string} date 
 * @param {string} notes 
 */
export function recordOwnerWithdrawal(amount, date, notes) {
    addLedgerEntry({
        subscriberId: 'owner',
        subscriberName: 'سحب للمالك',
        description: notes,
        debit: amount, // يعتبر مدين على المشروع
        credit: 0,
        type: 'withdrawal'
    });
    saveData();
}
