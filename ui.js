// =================================================================
//  ui.js: وحدة تحديث الواجهة الرسومية (DOM Manipulation)
// =================================================================
// مسؤولة عن عرض البيانات في الـ HTML وتحديث شكل الواجهة.
// =================================================================

import { getState, getSubscriberById } from './data.js';

// --- عناصر الـ DOM الرئيسية ---
const pages = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('.nav-item');
const subscribersTableBody = document.querySelector('#subscribers-table tbody');
const subscriberRowTemplate = document.querySelector('#subscriber-row-template');
const homeNoData = document.querySelector('#home-no-data');
const ledgerTableBody = document.querySelector('#financial-ledger-table tbody');
const ledgerNoData = document.querySelector('#ledger-no-data');
const projectNameHeader = document.querySelector('#project-name-header');

/**
 * عرض صفحة محددة وإخفاء البقية
 * @param {string} pageId - e.g., 'page-home'
 */
export function showPage(pageId) {
    pages.forEach(page => {
        page.classList.toggle('active', page.id === pageId);
    });
    // تحديث شريط التنقل
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageId);
    });
    window.scrollTo(0, 0); // الصعود لأعلى الصفحة
}

/**
 * عرض جدول المشتركين
 */
export function renderSubscribersTable() {
    const { subscribers, settings } = getState();
    subscribersTableBody.innerHTML = ''; // تفريغ الجدول

    if (subscribers.length === 0) {
        homeNoData.style.display = 'block';
        subscribersTableBody.parentElement.style.display = 'none';
        return;
    }
    
    homeNoData.style.display = 'none';
    subscribersTableBody.parentElement.style.display = 'table';

    subscribers.forEach(sub => {
        const row = subscriberRowTemplate.content.cloneNode(true);
        const lastInvoice = sub.invoices[sub.invoices.length - 1];
        
        row.querySelector('tr').dataset.id = sub.id;
        row.querySelector('.view-details-link').textContent = sub.name;
        row.querySelector('.view-details-link').dataset.id = sub.id;
        row.querySelector('[data-label="المستحقات"]').textContent = `${sub.totalDue.toFixed(2)} ${settings.currency}`;
        row.querySelector('[data-label="آخر قراءة"]').textContent = lastInvoice ? lastInvoice.currentReading : sub.initialReading;
        
        const statusBadge = row.querySelector('.status-badge');
        if (sub.totalDue <= 0) {
            statusBadge.textContent = 'مسدد';
            statusBadge.className = 'status-badge status-paid';
        } else {
            statusBadge.textContent = 'غير مسدد';
            statusBadge.className = 'status-badge status-unpaid';
        }
        
        // ربط الأزرار بـ ID المشترك
        row.querySelector('.view-details-btn').dataset.id = sub.id;
        row.querySelector('.add-invoice-btn').dataset.id = sub.id;
        row.querySelector('.record-payment-btn').dataset.id = sub.id;

        subscribersTableBody.appendChild(row);
    });
}

/**
 * تحديث الإحصائيات في الصفحة الرئيسية
 */
export function updateStats() {
    const { subscribers, ledger, settings } = getState();
    const totalDue = subscribers.reduce((sum, s) => sum + s.totalDue, 0);
    const totalCredit = ledger.reduce((sum, l) => sum + (l.credit || 0), 0);
    const totalDebit = ledger.reduce((sum, l) => sum + (l.debit || 0), 0);

    document.getElementById('stat-total-subscribers').textContent = subscribers.length;
    document.getElementById('stat-total-due').textContent = `${totalDue > 0 ? totalDue.toFixed(2) : '0.00'} ${settings.currency}`;
    document.getElementById('stat-project-balance').textContent = `${(totalCredit - totalDebit).toFixed(2)} ${settings.currency}`;
    projectNameHeader.textContent = settings.projectName;
}

/**
 * عرض السجل المالي العام
 */
export function renderLedger() {
    const { ledger, settings } = getState();
    ledgerTableBody.innerHTML = '';

    if (ledger.length === 0) {
        ledgerNoData.style.display = 'block';
        return;
    }
    ledgerNoData.style.display = 'none';

    let balance = 0;
    // السجل مرتب تنازلياً، لحساب الرصيد بشكل صحيح يجب عكسه مؤقتاً
    const reversedLedger = [...ledger].reverse();
    const processedLedger = reversedLedger.map(entry => {
        balance += (entry.credit || 0) - (entry.debit || 0);
        return {...entry, balance: balance.toFixed(2)};
    }).reverse(); // نعكسه مجدداً للعرض الصحيح

    processedLedger.forEach(entry => {
        const row = `
            <tr>
                <td>${new Date(entry.date).toLocaleDateString('ar-EG')}</td>
                <td>${entry.subscriberName}</td>
                <td>${entry.description}</td>
                <td>${entry.debit ? `${entry.debit.toFixed(2)} ${settings.currency}`: '-'}</td>
                <td>${entry.credit ? `${entry.credit.toFixed(2)} ${settings.currency}`: '-'}</td>
                <td>${entry.balance} ${settings.currency}</td>
            </tr>
        `;
        ledgerTableBody.innerHTML += row;
    });
}


/**
 * تعبئة نموذج الإعدادات بالبيانات الحالية
 */
export function populateSettingsForm() {
    const { settings } = getState();
    document.getElementById('setting-project-name').value = settings.projectName;
    document.getElementById('setting-price').value = settings.unitPrice;
    document.getElementById('setting-currency').value = settings.currency;
}

/**
 * تعبئة قائمة السنوات في صفحة التقارير
 */
export function populateYearSelect() {
    const yearSelect = document.getElementById('report-year');
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 10; i--) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        yearSelect.appendChild(option);
    }
}


/**
 * عرض نافذة منبثقة (Modal)
 * @param {string} modalId 
 */
export function showModal(modalId) {
    document.getElementById(modalId)?.classList.add('active');
}

/**
 * إخفاء نافذة منبثقة (Modal)
 * @param {string} modalId 
 */
export function hideModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
}

/**
 * عرض إشعار للمستخدم
 * @param {string} message 
 * @param {'success'|'error'} type 
 */
export function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    const notif = document.createElement('div');
    notif.style.cssText = `
        background-color: ${type === 'success' ? 'var(--primary-green)' : 'var(--danger-color)'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: var(--shadow);
        margin-bottom: 10px;
        opacity: 0;
        transform: translateY(-20px);
        transition: opacity 0.3s, transform 0.3s;
    `;
    notif.textContent = message;
    container.appendChild(notif);
    
    // Animate in
    setTimeout(() => {
        notif.style.opacity = '1';
        notif.style.transform = 'translateY(0)';
    }, 10);

    // Animate out and remove
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateY(-20px)';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
}
