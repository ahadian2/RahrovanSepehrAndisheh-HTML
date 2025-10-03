// ====== Code map ======
/* =========================================================
 * Leaflet Map Widget (iframe version with custom SVG markers)
 * فقط HTML + CSS + JavaScript/jQuery — بدون PHP/وردپرس
 * تابع سراسری: window.createMapIframe(opts)
 * =========================================================
 *
 * نمونه استفاده:
 * createMapIframe({
 *   container: '#map-a',
 *   data: [
 *     { province:'تهران', city:'تهران', company:'ره‌روان مهرگان سرزمین', address:'خیابان بهشتی، پلاک 436، ساختمان پارسه، طبقه 4، واحد 16', phone:'02188102351 | 09128177521', lat:35.757, lng:51.410 }
 *   ],
 *   mode: 'auto', // یا single / multi
 *   height: '520px',
 *   className: 'map-embed is-large',
 *   features: { filterProvince:true, filterCity:true, searchCompany:true },
 *   innerCssHref: '../assets/js/map/map-widget.css' // مسیر صحیح CSS
 * });
 */

(function ($) {
    window.createMapIframe = function createMapIframe(opts) {
        if (!opts || !opts.container) return;

        const $host = $(opts.container);
        if (!$host.length) return;

        const raw = Array.isArray(opts.data) ? opts.data : [];
        const locations = raw.filter(validPoint);
        if (!locations.length) {
            $host.text('هیچ نقطه‌ای برای نمایش نقشه ارسال نشده است.');
            return;
        }

        const autoMode = locations.length > 1 ? 'multi' : 'single';
        const mode = (opts.mode === 'single' || opts.mode === 'multi') ? opts.mode : autoMode;

        const features = Object.assign(
            { filterProvince: true, filterCity: true, searchCompany: true },
            opts.features || {}
        );

        const cssHref = opts.innerCssHref || ''; // مسیر CSS بیرون از آی‌فریم (اختیاری)

        const srcdoc = buildSrcDoc({
            mode,
            locations,
            features,
            cssHref
        });

        const iframe = document.createElement('iframe');
        iframe.className = opts.className || 'map-embed';
        iframe.style.height = opts.height || (mode === 'single' ? '380px' : '520px');
        // جلوگیری از فاصله‌ی زیر آی‌فریم
        iframe.style.display = 'block';
        iframe.style.border = '0';
        iframe.style.verticalAlign = 'top';
        iframe.style.lineHeight = '0';
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        iframe.srcdoc = srcdoc;

        $host.empty().append(iframe);
    };

    function validPoint(p) {
        return p && Number.isFinite(p.lat) && Number.isFinite(p.lng);
    }

    function escapeHtml(s) {
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function buildSrcDoc({ mode, locations, features, cssHref }) {
        const DATA = JSON.stringify({ mode, locations, features });
        return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="anonymous">
<link rel="stylesheet" href="../assets/js//map/map-widget.css">
${cssHref ? `<link rel="stylesheet" href="${escapeHtml(cssHref)}">` : ''}
</head>
<body>
<div id="app">
  <div id="toolbar" style="${mode === 'multi' ? '' : 'display:none'}">
    <span id="ctl-province" style="display:${features.filterProvince ? 'inline-flex' : 'none'}; gap:6px; align-items:center;">
      <label for="filter-province" style="display:none">استان:</label>
      <select id="filter-province"><option value="">فیلتر بر اساس استان</option></select>
    </span>
    <span id="ctl-city" style="display:${features.filterCity ? 'inline-flex' : 'none'}; gap:6px; align-items:center;">
      <label for="filter-city">شهر:</label>
      <select id="filter-city"><option value="">همه</option></select>
    </span>
    <span id="ctl-search" style="display:${features.searchCompany ? 'inline-flex' : 'none'}; gap:6px; align-items:center;">
      <label for="filter-q">جست‌وجو:</label>
      <input id="filter-q" type="search" placeholder="نام شرکت / آدرس...">
    </span>
    <span class="badge" id="count" style="display:none">—</span>
  </div>
  <div id="map" style="height:100%"></div>
</div>

<script>
  const BOOT = ${DATA};

  function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.body.appendChild(s);});}

  // ---- SVG Marker Functions ----
  function svgPin(fill='#2e7d32', stroke='#155724'){
    return \`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
      <path d="M12 0C5.93 0 1 4.93 1 11c0 7.58 9.27 21.9 10.04 23.05a1.2 1.2 0 0 0 1.92 0C13.73 32.9 23 18.58 23 11 23 4.93 18.07 0 12 0z" fill="\${fill}" stroke="\${stroke}" stroke-width="1"/>
      <circle cx="12" cy="11" r="4.5" fill="white" opacity="0.9"/>
    </svg>\`;
  }
  function iconUrlFromSvg(svg){ return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg); }
  function makeIcon(color, stroke){
    const url = iconUrlFromSvg(svgPin(color, stroke));
    return L.icon({ iconUrl:url, iconRetinaUrl:url, iconSize:[24,36], iconAnchor:[12,36], popupAnchor:[0,-30], className:'lw-marker' });
  }
  function makeActiveIcon(color, stroke){
    const url = iconUrlFromSvg(svgPin(color, stroke));
    return L.icon({ iconUrl:url, iconRetinaUrl:url, iconSize:[26,39], iconAnchor:[13,39], popupAnchor:[0,-32], className:'lw-marker is-active' });
  }
  function colorForPoint(p){
    if (p && p.color) return p.color;
    const palette=['#2e7d32','#1565c0','#6a1b9a','#ef6c00','#c2185b','#00897b'];
    const key=(p&&p.province)||''; let hash=0; for(let i=0;i<key.length;i++) hash=(hash*31+key.charCodeAt(i))>>>0;
    return palette[hash%palette.length];
  }

  // ---- Popup Helpers ----
  function _esc(s=""){
    return String(s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  function _digits(str=""){
    const mapFa = "۰۱۲۳۴۵۶۷۸۹", mapAr = "٠١٢٣٤٥٦٧٨٩";
    let x = String(str).replace(/[۰-۹]/g, d => mapFa.indexOf(d));
    x = x.replace(/[٠-٩]/g, d => "0123456789"[mapAr.indexOf(d)]);
    return x.replace(/\\D+/g,"");
  }
  function _splitPhones(phone=""){
    return String(phone)
      .split(/\\n|,|؛|\\||\\/|\\s{2,}/g)
      .map(t=>t.trim()).filter(Boolean)
      .filter((t,i,a)=>a.findIndex(x=>_digits(x)===_digits(t))===i);
  }
  function _row(label, value, {raw=false}={}){
    if(!value) return "";
    const val = raw ? value : _esc(value);
    return \`
      <div class="pc-row \${label==='استان'?'is-province':label==='شهر'?'is-city':label==='آدرس'?'is-address':label==='تلفن'?'is-phone':''}">
        <span class="pc-label">\${label}</span>
        <span class="pc-value">\${val}</span>
      </div>\`;
  }

  // --- پاپ‌آپ ---
  function renderPopup(p){
    const phones = _splitPhones(p.phone);
    const telHtml = phones.length
      ? phones.map(t=>\`<a href="tel:\${_digits(t)}">\${_esc(t)}</a>\`).join(' <span class="sep">•</span> ')
      : "";
    return \`
      <div class="popup-card glow" dir="rtl" style="--pc-accent:\${colorForPoint(p)}">
        <div class="pc-header">
          <div class="pc-badge" aria-hidden="true"></div>
          <div class="pc-title">\${_esc(p.company || "—")}</div>
        </div>
        <div class="pc-body">
          \${p.province ? _row("استان", p.province) : ""}
          \${p.city ? _row("شهر", p.city) : ""}
          \${p.address ? _row("آدرس", p.address) : ""}
          \${telHtml ? _row("تلفن", telHtml, {raw:true}) : ""}
        </div>
      </div>\`;
  }

  (async function init(){
    await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');

    const map = L.map('map', { zoomControl:true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map);

    // ===== اصلاح مدیریت لایه‌ها برای جلوگیری از باقی ماندن مارکر قبلی =====
    let group = L.featureGroup().addTo(map);  // گروه فعلی
    let activeMarker = null;                  // مارکر کلیک‌شده فعلی
    const allMarkers = [];                    // همهٔ مارکرها برای حذف مطمئن

    function renderPins(list){
      // 1) هر پاپ‌آپ باز را ببند
      try { if (activeMarker) activeMarker.closePopup(); } catch(e){}
      try { if (map && map.closePopup) map.closePopup(); } catch(e){}
      try { if (map && map.closeTooltip) map.closeTooltip(); } catch(e){}

      // 2) اگر مارکر فعالی داریم، خودش را هم از نقشه بردار
      if (activeMarker) {
        try { map.removeLayer(activeMarker); } catch(e){}
        activeMarker = null;
      }

      // 3) همه مارکرهای قبلی را از نقشه بردار و آرایه را خالی کن
      allMarkers.forEach(m => { try { map.removeLayer(m); } catch(e){} });
      allMarkers.length = 0;

      // 4) گروه قبلی را کامل حذف کن و یک گروه تازه بساز
      if (group) {
        try { group.clearLayers(); map.removeLayer(group); } catch(e){}
      }
      group = L.featureGroup().addTo(map);

      // 5) مارکرهای جدید را بساز
      list.forEach((p)=>{
        const color = colorForPoint(p);
        const baseIcon = makeIcon(color,'#0e3c1e');
        const activeIcon = makeActiveIcon(color,'#0a2a15');

        const m = L.marker([p.lat, p.lng], {
          icon: baseIcon,
          title: (p.company||'') + (p.city?(' - '+p.city):''),
          keyboard: true
        }).bindPopup(renderPopup(p));

        // رویدادها + مدیریت active
        m.__baseIcon = baseIcon;
        m.on('click keypress', (ev) => {
          if (ev.type === 'keypress' && !(ev.originalEvent.key === 'Enter' || ev.originalEvent.key === ' ')) return;
          if (activeMarker && activeMarker !== m) {
            try { activeMarker.setIcon(activeMarker.__baseIcon); activeMarker.closePopup(); } catch(e){}
          }
          m.setIcon(activeIcon);
          activeMarker = m;
          m.openPopup();
        });
        m.on('popupclose', () => {
          try { m.setIcon(m.__baseIcon); } catch(e){}
          if (activeMarker === m) activeMarker = null;
        });

        group.addLayer(m);
        allMarkers.push(m);
      });

      // 6) دید نقشه
      if (list.length === 1) {
        map.setView([list[0].lat, list[0].lng], 14);
      } else if (list.length > 1) {
        map.fitBounds(group.getBounds().pad(0.15));
      } else {
        map.setView([32.0, 53.0], 5);
      }

      const countEl = document.getElementById('count');
      if (countEl) countEl.textContent = list.length + ' نتیجه';
    }

    const all = BOOT.locations || [];

    if(BOOT.mode==='multi'){
      const provSel=document.getElementById('filter-province');
      const citySel=document.getElementById('filter-city');
      const qInput=document.getElementById('filter-q');

      function unique(a){return [...new Set(a)];}
      const provinces=unique(all.map(x=>x.province).filter(Boolean)).sort((a,b)=>a.localeCompare(b,'fa'));
      provinces.forEach(p=>{const o=document.createElement('option');o.value=p;o.textContent=p;provSel.appendChild(o);});

      function citiesFor(pv){
        return unique(all.filter(x=>!pv||x.province===pv).map(x=>x.city).filter(Boolean)).sort((a,b)=>a.localeCompare(b,'fa'));
      }
      function fillCities(){
        const pv=provSel.value;
        citySel.innerHTML='<option value="">همه</option>';
        citiesFor(pv).forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;citySel.appendChild(o);});
      }

      function applyFilters(){
        const pv=provSel.value, cv=citySel.value, q=(qInput.value||'').trim().toLowerCase();
        const cur=all.filter(x=>{
          const okP=!pv||x.province===pv;
          const okC=!cv||x.city===cv;
          const hay=[x.company,x.address,x.city,x.province].filter(Boolean).join(' ').toLowerCase();
          const okQ=!q||hay.includes(q);
          return okP&&okC&&okQ;
        });
        // قبل از رندر پین‌ها، هر پاپ‌آپ باز را ببند
        try { if (map && map.closePopup) map.closePopup(); } catch(e){}
        renderPins(cur);
      }

      provSel.addEventListener('change', ()=>{ try{ map.closePopup(); }catch(e){} fillCities(); applyFilters(); });
      citySel.addEventListener('change', ()=>{ try{ map.closePopup(); }catch(e){} applyFilters(); });
      qInput.addEventListener('input',  ()=>{ try{ map.closePopup(); }catch(e){} applyFilters(); });

      fillCities(); applyFilters();
    } else {
      renderPins([all[0]]);
    }
  })();
</script>
</body>
</html>`;
    }
})(jQuery);

// ====== End map ======
