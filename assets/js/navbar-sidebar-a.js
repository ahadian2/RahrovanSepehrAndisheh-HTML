// ====== navbar-sidebar-a ======
(function ($) {
    "use strict";

    var $drawer = $(".navbar-sidebar-a");
    var $overlay = $(".navbar-sidebar-a__overlay");
    var $toggles = $(".navbar-sidebar-a__toggle");
    var $appMain = $("#appMain");
    var lastToggle = null;

    function openDrawer(launcher) {
        lastToggle = launcher || null;

        // بصری + ARIA
        $drawer.addClass("is-open").attr("aria-hidden", "false"); // هنگام باز بودن hidden=false
        $overlay.addClass("is-active").attr("aria-hidden", "false");
        $("body").addClass("no-scroll");

        // غیرقابل‌تعامل کردن محتوای اصلی
        if ($appMain.length) { $appMain.attr("inert", ""); }

        // فوکوس داخل کشو (اولویت با دکمه بستن)
        var $focusTarget = $drawer.find(".navbar-sidebar-a__close").first();
        if (!$focusTarget.length) {
            $focusTarget = $drawer.find("a,button,[tabindex]:not([tabindex='-1'])").filter(":visible").first();
        }
        if ($focusTarget.length) { $focusTarget.trigger("focus"); }
    }

    function closeDrawer() {
        // قبل از hidden کردن، فوکوس را برگردان به لانچر
        if ($drawer.hasClass("is-open")) {
            var active = document.activeElement;
            if ($drawer.has(active).length) {
                if (lastToggle && lastToggle.length) { lastToggle.trigger("focus"); }
                else { $toggles.first().trigger("focus"); }
            }
        }

        // بصری + ARIA
        $drawer.removeClass("is-open").attr("aria-hidden", "true");
        $overlay.removeClass("is-active").attr("aria-hidden", "true");
        $("body").removeClass("no-scroll");

        // آزاد کردن محتوای اصلی
        if ($appMain.length) { $appMain.removeAttr("inert"); }
    }

    // دکمه ساده (فقط کلاس)
    $(document).on("click", ".navbar-sidebar-a__toggle", function () {
        var $btn = $(this);
        if ($drawer.hasClass("is-open")) { closeDrawer(); }
        else { openDrawer($btn); }
    });

    // بستن با اوورلی یا دکمه بستن
    $(document).on("click", ".navbar-sidebar-a__overlay, .navbar-sidebar-a__close", function () {
        closeDrawer();
    });

    // بستن با Esc
    $(document).on("keydown", function (e) {
        if (e.key === "Escape" && $drawer.hasClass("is-open")) { closeDrawer(); }
    });

    // زیرمنوهای تو در تو داخل کشو (آکاردئونی بین هم‌سطح‌ها)
    $(document).on("click", ".navbar-sidebar-a .submenu-toggle", function (e) {
        e.preventDefault();
        var $li = $(this).closest("li");
        var isOpen = $li.hasClass("is-open");
        $li.siblings(".has-submenu").removeClass("is-open");
        $li.toggleClass("is-open", !isOpen);
    });

})(jQuery);

// ======End navbar-sidebar-a ======


