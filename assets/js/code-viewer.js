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
// ====== End Code Viewer ======