// Sticky header — hairline + shadow once the page is scrolled.
(function () {
    function init() {
        var header = document.querySelector('.site-header');
        if (!header) return;
        function onScroll() {
            header.classList.toggle('is-scrolled', window.scrollY > 8);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// Gallery carousel — keyboard navigation.
// Active slide = the :target slide; if none, the most-visible album's first slide.
(function () {
    function getActiveSlide() {
        var targeted = document.querySelector('.slide:target');
        if (targeted) return targeted;
        // Fallback: the album whose center is closest to viewport center.
        var albums = document.querySelectorAll('.album');
        if (!albums.length) return null;
        var vh = window.innerHeight, best = null, bestDist = Infinity;
        albums.forEach(function (a) {
            var r = a.getBoundingClientRect();
            if (r.bottom < 0 || r.top > vh) return;
            var d = Math.abs((r.top + r.bottom) / 2 - vh / 2);
            if (d < bestDist) { bestDist = d; best = a; }
        });
        return best ? best.querySelector('.slide') : null;
    }

    function activate(link) {
        if (!link) return;
        var href = link.getAttribute('href');
        if (!href || href.charAt(0) !== '#') { link.click(); return; }
        // Set hash so :target updates natively, then immediately restore scroll
        // so the page doesn't jump to the slide.
        var x = window.scrollX, y = window.scrollY;
        location.hash = href;
        window.scrollTo(x, y);
    }

    // Intercept carousel anchor clicks to prevent the page-jump.
    document.addEventListener('click', function (e) {
        var a = e.target.closest('.nav-arrow, .thumb');
        if (!a) return;
        e.preventDefault();
        activate(a);
    });

    document.addEventListener('keydown', function (e) {
        // Don't intercept when typing in an input/textarea
        var t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

        var active = getActiveSlide();
        if (!active) return;
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            activate(active.querySelector('.nav-next'));
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            activate(active.querySelector('.nav-prev'));
        }
    });

    // Highlight the active thumbnail to match :target
    function syncActiveThumb() {
        document.querySelectorAll('.thumb.is-active').forEach(function (t) {
            t.classList.remove('is-active');
        });
        var hash = location.hash;
        if (!hash) return;
        var thumb = document.querySelector('.thumb[href="' + hash + '"]');
        if (thumb) {
            thumb.classList.add('is-active');
            thumb.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        }
    }
    window.addEventListener('hashchange', syncActiveThumb);
    document.addEventListener('DOMContentLoaded', syncActiveThumb);
})();
