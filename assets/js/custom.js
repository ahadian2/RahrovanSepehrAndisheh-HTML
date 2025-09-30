$(document).ready(function () {
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
                simpleIcon.classList.remove('bi-brightness-high', 'bi-moon-stars-fill');
                if (theme === 'dark') {
                    simpleIcon.classList.add('bi-moon-stars-fill');
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
    // ====== Code Viewer ======
    (function () {
        'use strict';

        const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
        const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');


        // helper: هایلایت اتریبیوت‌ها بدون ورود به مقدارهای کوتیشن‌دار
        function highlightAttrs(attrs) {
            let out = '', i = 0;

            while (i < attrs.length) {
                // --- حالت &quot;...&quot; ---
                if (attrs.startsWith('&quot;', i)) {
                    const j = attrs.indexOf('&quot;', i + 6);
                    if (j === -1) { out += attrs.slice(i); break; }
                    out += `<span class="tok-str">${attrs.slice(i, j + 6)}</span>`;
                    i = j + 6; continue;
                }
                // --- حالت "..." (کوتیشن واقعی) ---
                if (attrs[i] === '"') {
                    const j = attrs.indexOf('"', i + 1);
                    if (j === -1) { out += attrs.slice(i); break; }
                    out += `<span class="tok-str">${attrs.slice(i, j + 1)}</span>`;
                    i = j + 1; continue;
                }

                // --- حالت &#39;...&#39; ---
                if (attrs.startsWith('&#39;', i)) {
                    const j = attrs.indexOf('&#39;', i + 5);
                    if (j === -1) { out += attrs.slice(i); break; }
                    out += `<span class="tok-str">${attrs.slice(i, j + 5)}</span>`;
                    i = j + 5; continue;
                }
                // --- حالت '...' (تک‌کوتیشن واقعی) ---
                if (attrs[i] === "'") {
                    const j = attrs.indexOf("'", i + 1);
                    if (j === -1) { out += attrs.slice(i); break; }
                    out += `<span class="tok-str">${attrs.slice(i, j + 1)}</span>`;
                    i = j + 1; continue;
                }

                // بیرون از کوتیشن‌ها: نام اتریبیوت (+ مساوی اختیاری)
                const m = attrs.slice(i).match(/^\s+([a-zA-Z_:][\w:.-]*)(\s*=\s*)?/);
                if (m) {
                    out += ' ' + `<span class="tok-attr">${m[1]}</span>` + (m[2] || '');
                    i += m[0].length; continue;
                }

                // کاراکتر عادی
                out += attrs[i];
                i++;
            }

            return out;
        }

        // ---------------- HTML Highlighter ----------------
        function hiHTML(src) {
            // 1) کامنت‌ها
            src = src.replace(/&lt;!--[\s\S]*?--&gt;/g, m => `<span class="tok-comm">${m}</span>`);

            // 2) تگ‌ها: اجازه‌ی وجود کاراکترهای صفرعرض بعد از "<"
            //    گروه‌ها:  lt  zw*  slash?  tagName  attrs  gt
            src = src.replace(/&lt;([\u200B\u200C\u200D\u200E\u200F]*)(\/?)([a-zA-Z][\w:-]*)([\s\S]*?)&gt;/g,
                (whole, zw, slash, tagName, attrs) => {
                    const tagHighlighted = `<span class="tok-tag">${tagName}</span>`;
                    const attrsHighlighted = attrs ? highlightAttrs(attrs) : '';
                    // zw را عمداً برنمی‌گردانیم (دفع می‌شود)
                    return `&lt;${slash}${tagHighlighted}${attrsHighlighted}&gt;`;
                }
            );

            // 3) استرینگ‌های بیرون از تگ (اگر بود)
            src = src.replace(/(&quot;.*?&quot;|&#39;.*?&#39;)/g, m => `<span class="tok-str">${m}</span>`);

            return src;
        }


        // ---------------- CSS Highlighter ----------------
        // ---------------- CSS Highlighter (one‑pass, JS‑safe) ----------------
        function hiCSS(src) {
            // ترتیب گروه‌ها مهم است: comment → string → property@BOL → number+unit → pseudo → value-after-colon
            const re = /(\/\*[\s\S]*?\*\/)|("([^"\\]|\\.)*"|'([^'\\]|\\.)*')|(^|\n)(\s*)([a-z-]+)(\s*:(?!\/))|(\b\d+(?:\.\d+)?\b)(px|em|rem|%|vh|vw)?|(::[a-zA-Z-]+|:[a-zA-Z-]+)|(:\s*)([a-zA-Z-]+)/g;

            return src.replace(re, (m,
                comm, str, _s3, _s4,
                bol, ws, prop, colon,
                num, unit,
                pseudo,
                valSep, valWord) => {
                if (comm) return `<span class="tok-comm">${comm}</span>`;
                if (str) return `<span class="tok-str">${str}</span>`;
                if (prop) return `${bol || ''}${ws || ''}<span class="tok-prop">${prop}</span>${colon}`;
                if (num) return `<span class="tok-num">${num}${unit || ''}</span>`;
                if (pseudo) return `<span class="tok-prop">${pseudo}</span>`; // :hover, ::before, :root ...
                if (valWord) return `${valSep}<span class="tok-val">${valWord}</span>`;
                return m;
            });
        }


        // ---------------- C# Highlighter ----------------hiCSharp
        function hiCSharp(src) {
            const kwSet = new Set([
                'using', 'namespace', 'class', 'struct', 'enum', 'interface', 'public', 'private', 'protected', 'internal',
                'static', 'readonly', 'volatile', 'async', 'await', 'void', 'return', 'new', 'if', 'else', 'switch', 'case',
                'break', 'continue', 'for', 'foreach', 'while', 'do', 'try', 'catch', 'finally', 'throw', 'true', 'false', 'null'
            ]);

            const typeSet = new Set([
                'string', 'int', 'long', 'float', 'double', 'decimal', 'bool', 'char', 'object', 'dynamic', 'var',
                'Task', 'IActionResult', 'Controller'
            ]);

            let out = '';
            let i = 0, n = src.length;

            while (i < n) {
                const ch = src[i];

                // 1) comments
                if (ch === '/' && i + 1 < n) {
                    const ch2 = src[i + 1];
                    // // line comment
                    if (ch2 === '/') {
                        let j = i + 2;
                        while (j < n && src[j] !== '\n') j++;
                        out += `<span class="tok-comm">${src.slice(i, j)}</span>`;
                        i = j;
                        continue;
                    }
                    // /* block comment */
                    if (ch2 === '*') {
                        let j = i + 2;
                        while (j + 1 < n && !(src[j] === '*' && src[j + 1] === '/')) j++;
                        j = Math.min(n, j + 2);
                        out += `<span class="tok-comm">${src.slice(i, j)}</span>`;
                        i = j;
                        continue;
                    }
                }

                // 2) strings: "...", '...', verbatim @"..."
                if (ch === '@' && i + 1 < n && src[i + 1] === '"') {
                    let j = i + 2;
                    while (j < n) {
                        if (src[j] === '"' && src[j - 1] !== '\\') { j++; break; }
                        j++;
                    }
                    out += `<span class="tok-str">${src.slice(i, j)}</span>`;
                    i = j;
                    continue;
                }
                if (ch === '"' || ch === "'") {
                    const quote = ch;
                    let j = i + 1;
                    while (j < n) {
                        if (src[j] === '\\') { j += 2; continue; }
                        if (src[j] === quote) { j++; break; }
                        j++;
                    }
                    out += `<span class="tok-str">${src.slice(i, j)}</span>`;
                    i = j;
                    continue;
                }

                // 3) numbers
                if (/[0-9]/.test(ch)) {
                    let j = i + 1, seenDot = false;
                    while (j < n) {
                        const cj = src[j];
                        if (cj === '.' && !seenDot) { seenDot = true; j++; continue; }
                        if (/[0-9]/.test(cj)) { j++; continue; }
                        break;
                    }
                    out += `<span class="tok-num">${src.slice(i, j)}</span>`;
                    i = j;
                    continue;
                }

                // 4) identifiers: keywords, types
                if (/[A-Za-z_]/.test(ch)) {
                    let j = i + 1;
                    while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
                    const word = src.slice(i, j);
                    if (kwSet.has(word)) {
                        out += `<span class="tok-kw">${word}</span>`;
                    } else if (typeSet.has(word) || /^[A-Z][A-Za-z0-9_]*$/.test(word)) {
                        out += `<span class="tok-type">${word}</span>`;
                    } else {
                        out += word;
                    }
                    i = j;
                    continue;
                }

                // 5) default
                out += ch;
                i++;
            }

            return out;
        }

        // ---------------- JavaScript / jQuery Highlighter ----------------
        function hiJS(src) {
            const kwSet = new Set([
                'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue',
                'new', 'this', 'class', 'extends', 'super', 'try', 'catch', 'finally', 'throw', 'await', 'async', 'typeof',
                'instanceof', 'in', 'of', 'delete', 'void', 'yield', 'import', 'export', 'default'
            ]);

            let out = '';
            let i = 0, n = src.length;

            while (i < n) {
                const ch = src[i];

                // 1) comments
                if (ch === '/' && i + 1 < n) {
                    const ch2 = src[i + 1];
                    // // line comment
                    if (ch2 === '/') {
                        let j = i + 2;
                        while (j < n && src[j] !== '\n') j++;
                        out += `<span class="tok-comm">${src.slice(i, j)}</span>`;
                        i = j;
                        continue;
                    }
                    // /* block comment */
                    if (ch2 === '*') {
                        let j = i + 2;
                        while (j + 1 < n && !(src[j] === '*' && src[j + 1] === '/')) j++;
                        j = Math.min(n, j + 2);
                        out += `<span class="tok-comm">${src.slice(i, j)}</span>`;
                        i = j;
                        continue;
                    }
                }

                // 2) strings: "...", '...', `...`
                if (ch === '"' || ch === "'" || ch === '`') {
                    const quote = ch;
                    let j = i + 1;
                    while (j < n) {
                        if (src[j] === '\\') { j += 2; continue; }
                        if (src[j] === quote) { j++; break; }
                        j++;
                    }
                    out += `<span class="tok-str">${src.slice(i, j)}</span>`;
                    i = j;
                    continue;
                }

                // 3) numbers
                if (/[0-9]/.test(ch)) {
                    let j = i + 1, seenDot = false;
                    while (j < n) {
                        const cj = src[j];
                        if (cj === '.' && !seenDot) { seenDot = true; j++; continue; }
                        if (/[0-9]/.test(cj)) { j++; continue; }
                        break;
                    }
                    out += `<span class="tok-num">${src.slice(i, j)}</span>`;
                    i = j;
                    continue;
                }

                // 4) property after . or ?.
                if (ch === '.' || (ch === '?' && i + 1 < n && src[i + 1] === '.')) {
                    let op = '.';
                    if (ch === '?') { op = '?.'; i += 2; } else { i += 1; }
                    out += op;

                    // keep whitespace after operator
                    let j = i;
                    while (j < n && /\s/.test(src[j])) { out += src[j]; j++; }

                    // identifier
                    if (j < n && /[A-Za-z_$]/.test(src[j])) {
                        let k = j + 1;
                        while (k < n && /[A-Za-z0-9_$]/.test(src[k])) k++;
                        out += `<span class="tok-prop">${src.slice(j, k)}</span>`;
                        i = k;
                        continue;
                    } else {
                        i = j;
                        continue;
                    }
                }

                // 5) identifiers / keywords / $ / jQuery  (+ تابع بعد از function)
                if (/[A-Za-z_$]/.test(ch)) {
                    let j = i + 1;
                    while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
                    const word = src.slice(i, j);

                    // jQuery ids
                    if (word === '$' || word === 'jQuery') {
                        out += `<span class="tok-jq">${word}</span>`;
                        i = j; continue;
                    }

                    // function keyword + optional name
                    if (word === 'function') {
                        out += `<span class="tok-kw">function</span>`;
                        // optional function name
                        let k = j, ws = '';
                        while (k < n && /\s/.test(src[k])) { ws += src[k]; k++; }
                        if (k < n && /[A-Za-z_$]/.test(src[k])) {
                            let e = k + 1;
                            while (e < n && /[A-Za-z0-9_$]/.test(src[e])) e++;
                            out += ws + `<span class="tok-fn">${src.slice(k, e)}</span>`;
                            i = e; continue;
                        }
                        out += ws; i = k; continue;
                    }

                    if (kwSet.has(word)) {
                        out += `<span class="tok-kw">${word}</span>`;
                    } else {
                        out += word;
                    }
                    i = j;
                    continue;
                }

                // 6) default
                out += ch;
                i++;
            }

            return out;
        }


        const langMap = {
            html: hiHTML,
            css: hiCSS,
            csharp: hiCSharp, cs: hiCSharp,
            js: hiJS, javascript: hiJS, jquery: hiJS
        };

        function linesHtml(count) {
            let s = '<ol class="cb-lines">'; for (let i = 0; i < count; i++) s += '<li></li>'; return s + '</ol>';
        }

        function buildBlock(raw, langLabel) {
            // پاکسازی نویز ابتدای متن + نرمال‌سازی
            raw = raw.replace(/^\uFEFF/, '').replace(/^[\u200B\u200C\u200D]+/, '');
            raw = raw.replace(/\r\n?/g, '\n').replace(/\s+$/, '');

            const escaped = escapeHtml(raw);
            // حذف کاراکترهای صفرعرض در کل متن (ZWSP/ZWNJ/ZWJ/LRM/RLM)
            const cleaned = escaped.replace(/[\u200B\u200C\u200D\u200E\u200F]/g, '');
            const lines = cleaned.split('\n');
            const hi = langMap[(langLabel || '').toLowerCase()];
            const highlighted = hi ? hi(lines.join('\n')) : lines.join('\n');

            const head = `<div class="cb-head" style=" text-align: left; direction: ltr;"><div class="cb-title">${langLabel || 'Code'}</div></div>`;
            const body = `<div class="cb-body"><pre class="cb-code" style="direction:ltr;text-align:left;">${highlighted}</pre>${linesHtml(lines.length)}</div>`;
            return `<div class="codeblock">${head}${body}</div>`;
        }

        async function fetchText(url) {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) throw new Error(res.statusText);
            let t = await res.text();
            return t.replace(/^\uFEFF/, '').replace(/^[\u200B\u200C\u200D]+/, '');
        }

        async function materialize(el) {
            const lang = el.getAttribute('data-lang') || 'Code';
            if (el.hasAttribute('data-src')) {
                try {
                    const txt = await fetchText(el.getAttribute('data-src'));
                    el.outerHTML = buildBlock(txt, lang);
                } catch {
                    el.outerHTML = buildBlock(`/* Failed to load: ${el.getAttribute('data-src')} */`, lang);
                }
            } else {
                const raw = el.textContent || '';
                el.outerHTML = buildBlock(raw, lang);
            }
        }

        function init(selector) {
            const sel = selector || '.cb';
            qsa(sel).forEach(materialize);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => init());
        } else {
            init();
        }

        window.CodeBlock = { init };
    })();
    // ====== navbar-sidebar-a ======
    (function ($) {
        "use strict";

        var $drawer = $(".navbar-sidebar-a");
        var $overlay = $(".navbar-sidebar-a__overlay");
        var $toggles = $(".navbar-sidebar-a__toggle");
        var $appMain = $("#appMain");
        var lastToggle = null;

        // NEW: افزودن آیکن به آیتم‌های دارای زیرمنو (فقط اگر نداشتند)
        function ensureSidebarCarets() {
            $(".navbar-sidebar-a .submenu-toggle").each(function () {
                var $t = $(this);
                if ($t.find(".submenu-caret").length === 0) {
                    // از Bootstrap Icons استفاده می‌کنیم: bi-chevron-down
                    $t.append(' <i class="bi bi-chevron-down submenu-caret" aria-hidden="true"></i>');
                }
            });
        }
        ensureSidebarCarets();

        function openDrawer(launcher) {
            lastToggle = launcher || null;

            $drawer.addClass("is-open").attr("aria-hidden", "false");
            $overlay.addClass("is-active").attr("aria-hidden", "false");
            $("body").addClass("no-scroll");

            if ($appMain.length) { $appMain.attr("inert", ""); }

            var $focusTarget = $drawer.find(".navbar-sidebar-a__close").first();
            if (!$focusTarget.length) {
                $focusTarget = $drawer.find("a,button,[tabindex]:not([tabindex='-1'])").filter(":visible").first();
            }
            if ($focusTarget.length) { $focusTarget.trigger("focus"); }
        }

        function closeDrawer() {
            if ($drawer.hasClass("is-open")) {
                var active = document.activeElement;
                if ($drawer.has(active).length) {
                    if (lastToggle && lastToggle.length) { lastToggle.trigger("focus"); }
                    else { $toggles.first().trigger("focus"); }
                }
            }

            $drawer.removeClass("is-open").attr("aria-hidden", "true");
            $overlay.removeClass("is-active").attr("aria-hidden", "true");
            $("body").removeClass("no-scroll");

            if ($appMain.length) { $appMain.removeAttr("inert"); }
        }

        $(document).on("click", ".navbar-sidebar-a__toggle", function () {
            var $btn = $(this);
            if ($drawer.hasClass("is-open")) { closeDrawer(); }
            else { openDrawer($btn); }
        });

        $(document).on("click", ".navbar-sidebar-a__overlay, .navbar-sidebar-a__close", function () {
            closeDrawer();
        });

        $(document).on("keydown", function (e) {
            if (e.key === "Escape" && $drawer.hasClass("is-open")) { closeDrawer(); }
        });

        // آکاردئونی: فقط هم‌سطح‌ها بسته شوند + caret بچرخد (با CSS)
        $(document).on("click", ".navbar-sidebar-a .submenu-toggle", function (e) {
            e.preventDefault();
            var $li = $(this).closest("li");
            var isOpen = $li.hasClass("is-open");
            $li.siblings(".has-submenu").removeClass("is-open");
            $li.toggleClass("is-open", !isOpen);
        });

    })(jQuery);
    // ====== navbar-top-a ======
    (function ($) {
        "use strict";

        function isDesktop() {
            return window.matchMedia("(min-width: 992px)").matches;
        }

        function readStickyOffset($wrap) {
            var dataVal = parseInt($wrap.attr("data-sticky-offset"), 10);
            if (!isNaN(dataVal)) return dataVal;

            var cssVar = getComputedStyle($wrap[0]).getPropertyValue("--sticky-offset").trim();
            if (cssVar) {
                var cssNum = parseInt(cssVar, 10);
                if (!isNaN(cssNum)) return cssNum;
            }

            if (typeof window.NAVBAR_TOP_OFFSET === "number") return window.NAVBAR_TOP_OFFSET;
            return 240; // پیش‌فرض
        }

        $(function () {
            var $wrap = $(".navbar-top-a");          // سکشن والد
            var $nav = $wrap.find(".navbar-top");   // کانتینر منو
            if ($wrap.length === 0 || $nav.length === 0) return;

            var stickyClass = "is-sticky";
            var usePlaceholder = true;
            var stickyOffset = readStickyOffset($wrap);

            // Placeholder برای جلوگیری از پرش لایه‌ها
            var wrapH = $wrap.outerHeight();
            var $ph = $wrap.next(".navbar-top-placeholder");
            if (usePlaceholder) {
                if ($ph.length === 0) {
                    $ph = $('<div class="navbar-top-placeholder"></div>');
                    $wrap.after($ph);
                }
                $ph[0].style.setProperty("--navbar-top-height", wrapH + "px");
            }

            function closeAllMega() {
                $nav.find(".dropdown-mega").removeClass("show")
                    .find(".dropdown-menu.mega").removeClass("show").attr("aria-hidden", "true");

                $nav.find(".dropdown-mega > a, .dropdown-mega > button, .dropdown-mega > .dropdown-toggle")
                    .attr("aria-expanded", "false");
            }

            function onScroll() {
                if ($(window).scrollTop() > stickyOffset) {
                    if (!$wrap.hasClass(stickyClass)) $wrap.addClass(stickyClass);
                } else {
                    $wrap.removeClass(stickyClass);
                }
            }

            function onResize() {
                wrapH = $wrap.outerHeight();
                if (usePlaceholder) $ph[0].style.setProperty("--navbar-top-height", wrapH + "px");
                closeAllMega(); // جلوگیری از وضعیت‌های ناهماهنگ
            }

            // کلیک روی تریگر (لینک/دکمه/تاگل)
            $nav.on("click", ".dropdown-mega > a, .dropdown-mega > button, .dropdown-mega > .dropdown-toggle", function (e) {
                e.preventDefault();
                e.stopPropagation();

                var $toggle = $(this);
                var $item = $toggle.closest(".dropdown-mega");
                var $menu = $item.find(".dropdown-menu.mega").first();

                var willOpen = !$item.hasClass("show");

                // فقط یکی باز باشد
                closeAllMega();

                if (willOpen) {
                    $item.addClass("show");
                    $menu.addClass("show").attr("aria-hidden", "false");
                    $toggle.attr("aria-expanded", "true");
                }
            });

            // کلیک داخل مگا بسته نشود
            $nav.on("click", ".dropdown-mega .dropdown-menu.mega", function (e) { e.stopPropagation(); });

            // کلیک بیرون از نوار => همه بسته
            $(document).on("click.navbarTopA.outside", function (e) {
                if ($(e.target).closest(".navbar-top").length === 0) {
                    closeAllMega();
                }
            });

            // بستن با ESC
            $(document).on("keydown.navbarTopA.esc", function (e) {
                if (e.key === "Escape") closeAllMega();
            });

            // استیکی و ریسایز
            $(window).on("scroll.navbarTopA", onScroll);
            $(window).on("resize.navbarTopA", onResize);

            // آغاز
            onResize();
            onScroll();
        });
    })(jQuery);
    $(function () {
        var $searchIcon = $(".bi-search[role='button']");
        var $searchBox = $(".navbar-icon-search");
        var $closeIcon = $(".navbar-icon-search .bi-x");

        // باز کردن
        $searchIcon.on("click", function (e) {
            e.stopPropagation(); // نذاره رو خودش بسته شه
            $searchBox.addClass("active");
        });

        // بستن با ایکس
        $closeIcon.on("click", function (e) {
            e.stopPropagation();
            $searchBox.removeClass("active");
        });

        // بستن با کلیک بیرون
        $(document).on("click", function (e) {
            if ($searchBox.hasClass("active") && !$(e.target).closest(".navbar-icon-search").length && !$(e.target).is($searchIcon)) {
                $searchBox.removeClass("active");
            }
        });
    });
    // ====== GLightbox ======
    if (typeof GLightbox !== "undefined") {
        // اول مطمئن شو فوکوس از لینک glightbox برداشته بشه
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('a.glightbox');
            if (trigger) {
                trigger.blur(); // جلوگیری از ارور aria-hidden
            }
        });

        // اجرای GLightbox
        const lightbox = GLightbox({
            loop: false,
            touchNavigation: true,
            selector: '.glightbox'
        });
    }

    // ====== owl hero-a ======
    $(function () {
        $('.owl-hero-a').owlCarousel({
            rtl: true,
            lazyLoad: true,
            animateOut: 'fadeOut',
            items: 1,
            loop: true,
            autoplay: true,
            autoplayTimeout: 6000,
            autoplayHoverPause: false,
            mouseDrag: false,
            touchDrag: false,
            pullDrag: false,
            dots: false,
            nav: false,
            onInitialized: startProgressBar,
            onTranslate: resetProgressBar,
            onTranslated: startProgressBar
        });
        function startProgressBar() {
            $(".hero-a-progress").css({
                width: "100%",
                transition: "width 5s linear"
            });
        }
        function resetProgressBar() {
            $(".hero-a-progress").css({
                width: 0,
                transition: "width 0s"
            });
        }
        // دکمه اسکرول به پایین
        $('.scrolldown').on('click', function () {
            $('html, body').animate({ scrollTop: $(window).scrollTop() + 650 }, 100);
        });
    });
    // ====== owl-b ======
    $('.owl-b .owl-carousel').owlCarousel({
        rtl: true,
        lazyLoad: true,
        items: 4,
        loop: true,
        autoplay: true,
        autoplayTimeout: 2000,
        autoplayHoverPause: true,
        dots: false,
        nav: false,
        margin: 10,
        responsive: {
            0: {
                items: 1,

            },
            541: {
                items: 2,
            },
            650: {
                items: 3,
            },
            992: {
                items: 4,
            }
        }

    });
    // ====== card-h owl ======
    $('.card-h .owl-carousel').owlCarousel({
        rtl: true,
        lazyLoad: true,
        items: 4,
        loop: true,
        autoplay: true,
        autoplayTimeout: 2000,
        autoplayHoverPause: true,
        dots: true,
        nav: false,
        margin: 30,
        responsive: {
            0: {
                items: 2,

            },
            541: {
                items: 2,
            },
            650: {
                items: 3,
            },
            992: {
                items: 5,
            }
        }

    });
    // ====== card-i owl ======
    $('.card-i .owl-carousel').owlCarousel({
        rtl: true,
        lazyLoad: true,
        items: 6,
        loop: true,
        autoplay: true,
        autoplayTimeout: 2000,
        autoplayHoverPause: true,
        dots: false,
        nav: false,
        margin: 10,
        responsive: {
            0: {
                items: 2,

            },
            541: {
                items: 2,
            },
            650: {
                items: 3,
            },
            992: {
                items: 4,
            },
            1200: {
                items: 5,
            }
        }

    });
    // ====== widget owl ======
    $('.widget .owl-carousel').owlCarousel({
        rtl: true,
        lazyLoad: true,
        items: 1,
        loop: true,
        autoplay: true,
        autoplayTimeout: 2000,
        autoplayHoverPause: true,
        dots: true,
        nav: false,
        margin: 0,
    });
    // ====== related posts owl ======
    $('.related-posts .owl-carousel').owlCarousel({
        rtl: true,
        lazyLoad: true,
        items: 3,
        loop: true,
        autoplay: true,
        autoplayTimeout: 2000,
        autoplayHoverPause: true,
        dots: false,
        nav: false,
        margin: 10,
        responsive: {
            0: {
                items: 1,

            },
            530: {
                items: 1,
            },
            650: {
                items: 2,
            },
            992: {
                items: 3,
            },
            1200: {
                items: 3,
            }
        }

    });
    // ====== widget owl ======
    $('.product-gallery .owl-carousel').owlCarousel({
        rtl: true,
        lazyLoad: true,
        items: 1,
        loop: true,
        autoplay: true,
        autoplayTimeout: 2000,
        autoplayHoverPause: true,
        dots: false,
        nav: false,
        margin: 0,
    });
    // ====== related product ======
    $('.related-product .owl-carousel').owlCarousel({
        rtl: true,
        lazyLoad: true,
        items: 4,
        loop: true,
        autoplay: true,
        autoplayTimeout: 2000,
        autoplayHoverPause: true,
        dots: false,
        nav: false,
        margin: 10,
        responsive: {
            0: {
                items: 2,

            },
            530: {
                items: 2,
            },
            650: {
                items: 3,
            },
            992: {
                items: 4,
            },
            1200: {
                items: 5,
            }
        }

    });
});

