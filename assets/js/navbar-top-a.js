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
// ======End navbar-top-a ======

