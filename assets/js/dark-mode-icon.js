// ====== dark-mode-icon======
(function () {
    var html = document.documentElement;

    // آیکون ساده‌ی شما
    var simpleIcon = document.getElementById('darkModeToggle');

    // سوییچ/چک‌باکس‌های شما
    var switches = [].slice.call(document.querySelectorAll('.dark-mode-icon-toggle'));

    // اگر هیچ کنترلی در صفحه نیست، خارج شو
    if (!simpleIcon && switches.length === 0) return;

    function paintControls(theme) {
        // 1) آیکون ساده: فقط آیکون را جابه‌جا کن و کلاس کمکی برای رنگ‌ دهی بگذار
        if (simpleIcon) {
            // آیکون ماه/خورشید
            simpleIcon.classList.remove('bi-brightness-high', 'bi-moon');
            if (theme === 'dark') {
                simpleIcon.classList.add('bi-moon');
                simpleIcon.classList.remove('dm-light');
                simpleIcon.classList.add('dm-dark'); // شما رنگ ماه/دارک را در SCSS مدیریت کنید
                simpleIcon.setAttribute('aria-label', 'تغییر به حالت روشن');
                simpleIcon.setAttribute('title', 'تغییر به حالت روشن');
            } else {
                simpleIcon.classList.add('bi-brightness-high');
                simpleIcon.classList.remove('dm-dark');
                simpleIcon.classList.add('dm-light'); // شما رنگ خورشید/لایت را در SCSS مدیریت کنید
                simpleIcon.setAttribute('aria-label', 'تغییر به حالت تیره');
                simpleIcon.setAttribute('title', 'تغییر به حالت تیره');
            }
            // دسترسی‌پذیری
            simpleIcon.setAttribute('role', 'button');
            simpleIcon.setAttribute('tabindex', '0');
        }

        // 2) سوییچ‌های UI شما
        switches.forEach(function (inp) {
            try { inp.checked = (theme === 'dark'); } catch (_) { }
        });
    }

    function applyTheme(theme, persist) {
        html.setAttribute('data-bs-theme', theme);
        paintControls(theme);
        if (persist) localStorage.setItem('theme', theme);
    }

    // مقدار اولیه
    var saved = localStorage.getItem('theme');
    if (saved) {
        applyTheme(saved, false);
    } else {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        applyTheme(mq.matches ? 'dark' : 'light', false);

        // هماهنگی با تغییر تم سیستم، تا زمانی که کاربر دستی چیزی ذخیره نکرده
        if (mq.addEventListener) {
            mq.addEventListener('change', function (e) {
                if (!localStorage.getItem('theme')) {
                    applyTheme(e.matches ? 'dark' : 'light', false);
                }
            });
        } else if (mq.addListener) {
            mq.addListener(function (e) {
                if (!localStorage.getItem('theme')) {
                    applyTheme(e.matches ? 'dark' : 'light', false);
                }
            });
        }
    }

    function toggleTheme() {
        var current = html.getAttribute('data-bs-theme') || 'light';
        var next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next, true);
    }

    // کلیک و کیبورد روی آیکون ساده
    if (simpleIcon) {
        simpleIcon.addEventListener('click', toggleTheme);
        simpleIcon.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleTheme();
            }
        });
    }

    // تغییر سوییچ => همه چیز سینک شود
    switches.forEach(function (inp) {
        inp.addEventListener('change', function () {
            applyTheme(this.checked ? 'dark' : 'light', true);
        });
    });

    // تضمین همگامی UI بعد از لود
    paintControls(html.getAttribute('data-bs-theme') || 'light');
})();
// ======End dark-mode-icon======

