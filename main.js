// =================================================================
//  main.js: نقطة الدخول الرئيسية للتطبيق (Entry Point)
// =================================================================
// هذا الملف يقوم بتهيئة التطبيق عند تحميل الصفحة.
// يربط جميع الوحدات (data, ui, events) معًا.
// =================================================================

import * as data from './data.js';
import * as ui from './ui.js';
import * as events from './events.js';

// انتظر حتى يتم تحميل محتوى الصفحة بالكامل
document.addEventListener('DOMContentLoaded', () => {
    console.log("تطبيق إدارة المياه قيد التشغيل...");

    // 1. تحميل البيانات من الذاكرة المحلية
    data.loadData();

    // 2. تهيئة عناصر الواجهة الرسومية الثابتة
    ui.populateSettingsForm();
    ui.populateYearSelect();

    // 3. عرض البيانات الأولية على الشاشة
    ui.renderSubscribersTable();
    ui.updateStats();
    
    // 4. ربط جميع الأحداث والتفاعلات
    events.init();

    // 5. عرض الصفحة الرئيسية
    ui.showPage('page-home');
});
