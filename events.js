// =================================================================
//  events.js: وحدة معالجة أحداث المستخدم (Event Handlers)
// =================================================================
// يستمع لنقرات المستخدم، تقديم النماذج، وغيرها من التفاعلات.
// يعمل كحلقة وصل بين الواجهة (ui.js) والبيانات (data.js).
// =================================================================

import * as data from './data.js';
import * as ui from './ui.js';

/**
 * تهيئة جميع مستمعي الأحداث في التطبيق
 */
export function init() {
    // --- التنقل بين الصفحات ---
    document.querySelector('.bottom-nav').addEventListener('click', (e) => {
        const navItem = e.target.closest('.nav-item');
        if (navItem && navItem.dataset.page) {
            ui.showPage(navItem.dataset.page);
        }
    });

    // --- نموذج إضافة مشترك ---
    document.getElementById('add-subscriber-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newSubscriber = {
            name: formData.get('name'),
            initialReading: formData.get('initialReading'),
            openingBalance: formData.get('openingBalance')
        };
        data.addSubscriber(newSubscriber);
        ui.showNotification('تمت إضافة المشترك بنجاح!', 'success');
        e.target.reset();
        ui.renderSubscribersTable();
        ui.updateStats();
        ui.showPage('page-home');
    });

    // --- نموذج الإعدادات ---
    document.getElementById('settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newSettings = {
            projectName: formData.get('projectName'),
            unitPrice: Number(formData.get('unitPrice')),
            currency: formData.get('currency')
        };
        data.updateSettings(newSettings);
        ui.populateSettingsForm();
        ui.updateStats();
        ui.showNotification('تم حفظ الإعدادات بنجاح!');
    });

    // --- أحداث الجدول الرئيسي للمشتركين (باستخدام تفويض الأحداث) ---
    document.getElementById('subscribers-table').addEventListener('click', e => {
        const viewBtn = e.target.closest('.view-details-btn');
        const addInvoiceBtn = e.target.closest('.add-invoice-btn');
        const recordPaymentBtn = e.target.closest('.record-payment-btn');

        if (viewBtn) {
            // منطق عرض تفاصيل المشترك (سيتم بناؤه لاحقاً)
            ui.showNotification(`عرض تفاصيل المشترك: ${viewBtn.dataset.id}`, 'info');
        }
        if (addInvoiceBtn) {
            const reading = prompt("أدخل القراءة الحالية للعداد:");
            if (reading !== null && reading.trim() !== '' && !isNaN(reading)) {
                try {
                    data.addInvoice(addInvoiceBtn.dataset.id, Number(reading));
                    ui.showNotification('تم إصدار الفاتورة بنجاح');
                    ui.renderSubscribersTable();
                    ui.updateStats();
                } catch (error) {
                    ui.showNotification(error.message, 'error');
                }
            }
        }
        if (recordPaymentBtn) {
            const amount = prompt("أدخل المبلغ المدفوع:");
            if (amount !== null && amount.trim() !== '' && !isNaN(amount) && Number(amount) > 0) {
                data.recordPayment(recordPaymentBtn.dataset.id, Number(amount), new Date().toISOString(), 'دفعة يدوية');
                ui.showNotification('تم تسجيل الدفعة بنجاح');
                ui.renderSubscribersTable();
                ui.updateStats();
            }
        }
    });
    
    // --- أزرار الإعدادات المتقدمة ---
    document.getElementById('export-data-btn').addEventListener('click', () => {
        const stateString = JSON.stringify(data.getState(), null, 2);
        const blob = new Blob([stateString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `water-project-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        ui.showNotification('تم تصدير البيانات بنجاح.');
    });

    document.getElementById('import-data-btn').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedState = JSON.parse(event.target.result);
                // إجراء تحقق بسيط على البيانات المستوردة
                if (importedState.subscribers && importedState.settings) {
                    if(confirm("سيتم استبدال جميع البيانات الحالية. هل أنت متأكد؟")) {
                        localStorage.setItem('waterProjectState', JSON.stringify(importedState));
                        data.loadData();
                        location.reload(); // إعادة تحميل التطبيق بالكامل
                    }
                } else {
                    throw new Error("ملف غير صالح.");
                }
            } catch (error) {
                ui.showNotification('فشل استيراد البيانات. الملف تالف أو غير متوافق.', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // لإعادة السماح بنفس الملف
    });
    
    // --- تحديث السجل المالي عند عرض صفحته ---
    document.querySelector('[data-page="page-ledger"]').addEventListener('click', () => {
        ui.renderLedger();
    });
}
