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

// Expand news page images inline on click.
(function () {
    document.addEventListener('click', function (e) {
        var thumb = e.target.closest('.news-page .news-thumb');
        if (!thumb) return;
        thumb.classList.toggle('expanded');
    });
})();

// Bookworm devouring portrait animation
(function () {
    function init() {
        const canvas = document.getElementById('hero-portrait-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Choose source image based on container/view size (matching original aspect ratios)
        const isMobile = window.innerWidth <= 900;
        const imgSrc = isMobile ? canvas.getAttribute('data-mobile') : canvas.getAttribute('data-desktop');

        const img = new Image();

        let canvasWidth = 368;
        let canvasHeight = 654;

        if (isMobile) {
            canvasWidth = 280;
            canvasHeight = 397;
        }

        // Set high internal resolution for crisp rendering
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        let animationFrameId;
        let isHovered = false;
        let imgLoaded = false;

        // Eaten mask coordinates trail
        let eatenTrail = []; // elements: {x, y, radius}

        // Worm state
        let worm = {
            segments: [], // elements: {x, y}
            numSegments: 12,
            segmentSpacing: 6,
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            angle: 0,
            speed: 0.3, // crawling speed on load
            isLeaving: false,
            scaredSpeed: 6.0, // fast exit speed when scared
            visible: true
        };

        // Path coordinates for the worm to slowly crawl over and devour the portrait.
        let waypoints = [];
        let currentWaypointIndex = 0;

        function initWorm() {
            // Worm starts near left corner of portrait (e.g. x = -30, y = 120)
            const startX = -30;
            const startY = canvasHeight * 0.25;

            worm.x = startX;
            worm.y = startY;
            worm.segments = [];
            for (let i = 0; i < worm.numSegments; i++) {
                worm.segments.push({ x: startX, y: startY });
            }

            worm.isLeaving = false;
            worm.visible = true;
            worm.speed = 0.3; // crawling speed

            // Generate a random path of waypoints across the canvas for organic wandering
            waypoints = [];
            const numWaypoints = 12; // 12 random waypoints before exiting
            for (let i = 0; i < numWaypoints; i++) {
                const marginX = canvasWidth * 0.12;
                const marginY = canvasHeight * 0.12;
                const x = marginX + Math.random() * (canvasWidth - 2 * marginX);
                const y = marginY + Math.random() * (canvasHeight - 2 * marginY);
                waypoints.push({ x: x, y: y });
            }
            // Final exit waypoint - crawls out of bounds at the bottom
            waypoints.push({ x: canvasWidth * 0.5, y: canvasHeight + 80 });

            currentWaypointIndex = 0;
            worm.targetX = waypoints[0].x;
            worm.targetY = waypoints[0].y;
        }

        img.onload = function () {
            if (imgLoaded) return;
            imgLoaded = true;
            initWorm();
            requestAnimationFrame(tick);
        };
        img.onerror = function () {
            console.error("Failed to load hero portrait: " + imgSrc);
        };
        img.src = imgSrc;

        // If cached/already loaded
        if (img.complete || img.naturalWidth > 0) {
            if (!imgLoaded) {
                imgLoaded = true;
                initWorm();
                requestAnimationFrame(tick);
            }
        }

        // Bind event to DEBUG button
        const debugBtn = document.getElementById('hero-portrait-debug-btn');
        if (debugBtn) {
            debugBtn.addEventListener('click', function (e) {
                scareWorm(e);
                // Hide button after click
                debugBtn.style.opacity = '0';
                debugBtn.style.visibility = 'hidden';
                debugBtn.style.pointerEvents = 'none';
            });
        }

        function scareWorm(e) {
            if (worm.isLeaving) return;
            worm.isLeaving = true;
            
            // Speed up significantly
            worm.speed = worm.scaredSpeed;

            // Choose the closest edge to exit quickly
            const rect = canvas.getBoundingClientRect();
            const clientX = (e && typeof e.clientX === 'number') ? e.clientX : (rect.left + rect.width / 2);
            const clientY = (e && typeof e.clientY === 'number') ? e.clientY : (rect.top + rect.height / 2);

            const mouseX = ((clientX - rect.left) / rect.width) * canvasWidth;
            const mouseY = ((clientY - rect.top) / rect.height) * canvasHeight;

            const distLeft = worm.x + 50;
            const distRight = (canvasWidth - worm.x) + 50;
            const distTop = worm.y + 50;
            const distBottom = (canvasHeight - worm.y) + 50;

            const minDist = Math.min(distLeft, distRight, distTop, distBottom);
            if (minDist === distLeft) {
                worm.targetX = -100;
                worm.targetY = worm.y;
            } else if (minDist === distRight) {
                worm.targetX = canvasWidth + 100;
                worm.targetY = worm.y;
            } else if (minDist === distTop) {
                worm.targetX = worm.x;
                worm.targetY = -100;
            } else {
                worm.targetX = worm.x;
                worm.targetY = canvasHeight + 100;
            }
        }

        // Main Animation Loop
        function tick() {
            update();
            render();
            animationFrameId = requestAnimationFrame(tick);
        }

        function update() {
            // If debugging (worm is leaving), restore / heal the portrait
            if (worm.isLeaving) {
                // Shrink the eaten trail radius slowly (heal effect)
                eatenTrail.forEach(bite => {
                    if (bite.radius > 0) {
                        bite.radius -= 0.3; // heal speed
                        if (bite.radius < 0) bite.radius = 0;
                    }
                });
                // Remove fully healed bites
                eatenTrail = eatenTrail.filter(bite => bite.radius > 0);
            }

            // 2. Do not reset worm! It appears only once per page load.

            // 3. Update Worm position
            if (worm.visible) {
                const dx = worm.targetX - worm.x;
                const dy = worm.targetY - worm.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 5) {
                    // Move towards target
                    worm.angle = Math.atan2(dy, dx);
                    worm.x += Math.cos(worm.angle) * worm.speed;
                    worm.y += Math.sin(worm.angle) * worm.speed;
                } else {
                    if (!worm.isLeaving) {
                        // Move to next waypoint
                        currentWaypointIndex++;
                        if (currentWaypointIndex < waypoints.length) {
                            worm.targetX = waypoints[currentWaypointIndex].x;
                            worm.targetY = waypoints[currentWaypointIndex].y;
                        } else {
                            worm.visible = false;
                        }
                    } else {
                        worm.visible = false;
                    }
                }

                // Check if worm is out of bounds (when leaving)
                if (worm.isLeaving) {
                    if (worm.x < -60 || worm.x > canvasWidth + 60 || worm.y < -60 || worm.y > canvasHeight + 60) {
                        worm.visible = false;
                    }
                }

                // Body segments follow in chain (rope follow kinematics)
                worm.segments[0] = { x: worm.x, y: worm.y };
                for (let i = 1; i < worm.numSegments; i++) {
                    const segPrev = worm.segments[i - 1];
                    const segCurr = worm.segments[i];
                    const sDx = segPrev.x - segCurr.x;
                    const sDy = segPrev.y - segCurr.y;
                    const sDist = Math.sqrt(sDx * sDx + sDy * sDy);
                    if (sDist > worm.segmentSpacing) {
                        const angle = Math.atan2(sDy, sDx);
                        segCurr.x = segPrev.x - Math.cos(angle) * worm.segmentSpacing;
                        segCurr.y = segPrev.y - Math.sin(angle) * worm.segmentSpacing;
                    }
                }

                // 4. Devour portrait
                if (!worm.isLeaving && worm.visible && worm.x > 0 && worm.x < canvasWidth && worm.y > 0 && worm.y < canvasHeight) {
                    let shouldAddBite = true;
                    if (eatenTrail.length > 0) {
                        const lastBite = eatenTrail[eatenTrail.length - 1];
                        const bDx = worm.x - lastBite.x;
                        const bDy = worm.y - lastBite.y;
                        const bDist = Math.sqrt(bDx * bDx + bDy * bDy);
                        if (bDist < 5) {
                            shouldAddBite = false;
                        }
                    }
                    if (shouldAddBite) {
                        eatenTrail.push({
                            x: worm.x,
                            y: worm.y,
                            radius: 14 + Math.random() * 4 // moderate bite radius for organic random devouring holes
                        });
                    }
                }
            }
        }

        function render() {
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            if (!imgLoaded) return;

            // Draw Portrait with Devoured Bites (using destination-out)
            ctx.save();
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

            if (eatenTrail.length > 0) {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.fillStyle = '#000';
                eatenTrail.forEach(bite => {
                    ctx.beginPath();
                    ctx.arc(bite.x, bite.y, bite.radius, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.globalCompositeOperation = 'source-over';
            }
            ctx.restore();

            // Draw Bookworm (Cute cartoon version - Lite Green, Round Glasses, Blush & Smile)
            if (worm.visible && worm.segments.length > 0) {
                ctx.save();
                
                // Draw worm body segments back-to-front (tail to head)
                for (let i = worm.numSegments - 1; i >= 0; i--) {
                    const seg = worm.segments[i];
                    if (!seg) continue;
                    
                    const sizeRatio = (worm.numSegments - i) / worm.numSegments; 
                    // Uniform thickness throughout the body
                    const radius = 6.5; 

                    // Soft drop shadow
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
                    ctx.shadowBlur = 5;
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 2;

                    // Lite Green - light pastel grass/caterpillar green
                    const r = Math.floor(140 + sizeRatio * 20);
                    const g = Math.floor(215 + sizeRatio * 15);
                    const b = Math.floor(95 + sizeRatio * 25);
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`; 
                    
                    ctx.beginPath();
                    ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Highlight glare reflection spot
                    ctx.shadowColor = 'transparent';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                    ctx.beginPath();
                    ctx.arc(seg.x - radius * 0.35, seg.y - radius * 0.35, radius * 0.25, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Draw Head Details (cute round cartoon eyes, glasses, blush cheeks, smile)
                const head = worm.segments[0];
                if (head) {
                    const angle = worm.angle;

                    // Perpendicular eye offsets
                    const eyeAngle1 = angle - Math.PI / 4.2;
                    const eyeAngle2 = angle + Math.PI / 4.2;
                    const eyeDist = 5.0;

                    const eye1X = head.x + Math.cos(eyeAngle1) * eyeDist;
                    const eye1Y = head.y + Math.sin(eyeAngle1) * eyeDist;
                    const eye2X = head.x + Math.cos(eyeAngle2) * eyeDist;
                    const eye2Y = head.y + Math.sin(eyeAngle2) * eyeDist;

                    // 1. Draw pink blush cheeks
                    ctx.fillStyle = 'rgba(255, 130, 160, 0.65)';
                    ctx.beginPath();
                    ctx.arc(head.x + Math.cos(angle - Math.PI / 2.3) * 6.5, head.y + Math.sin(angle - Math.PI / 2.3) * 6.5, 2.5, 0, Math.PI * 2);
                    ctx.arc(head.x + Math.cos(angle + Math.PI / 2.3) * 6.5, head.y + Math.sin(angle + Math.PI / 2.3) * 6.5, 2.5, 0, Math.PI * 2);
                    ctx.fill();

                    // 2. Eyes (large white circles)
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(eye1X, eye1Y, 3.2, 0, Math.PI * 2);
                    ctx.arc(eye2X, eye2Y, 3.2, 0, Math.PI * 2);
                    ctx.fill();

                    // 3. Pupils (black inner circles - look scared/smaller if leaving)
                    ctx.fillStyle = '#000000';
                    const pupilRadius = worm.isLeaving ? 1.0 : 1.4;
                    const lookX = Math.cos(angle) * 0.7;
                    const lookY = Math.sin(angle) * 0.7;
                    ctx.beginPath();
                    ctx.arc(eye1X + lookX, eye1Y + lookY, pupilRadius, 0, Math.PI * 2);
                    ctx.arc(eye2X + lookX, eye2Y + lookY, pupilRadius, 0, Math.PI * 2);
                    ctx.fill();

                    // 4. Spectacles (cute round frames - bookworm style!)
                    ctx.strokeStyle = '#111111';
                    ctx.lineWidth = 1.3;
                    ctx.beginPath();
                    ctx.arc(eye1X, eye1Y, 4.3, 0, Math.PI * 2); // left lens frame
                    ctx.arc(eye2X, eye2Y, 4.3, 0, Math.PI * 2); // right lens frame
                    ctx.stroke();

                    // Spectacles bridge line
                    ctx.beginPath();
                    ctx.moveTo(eye1X + Math.cos(angle + Math.PI / 2) * 1.5, eye1Y + Math.sin(angle + Math.PI / 2) * 1.5);
                    ctx.lineTo(eye2X + Math.cos(angle - Math.PI / 2) * 1.5, eye2Y + Math.sin(angle - Math.PI / 2) * 1.5);
                    ctx.stroke();

                    // 5. Tiny happy smile arc
                    ctx.strokeStyle = '#222222';
                    ctx.lineWidth = 1.4;
                    ctx.beginPath();
                    const mouthX = head.x + Math.cos(angle) * 5.8;
                    const mouthY = head.y + Math.sin(angle) * 5.8;
                    ctx.arc(mouthX, mouthY, 2.0, angle - Math.PI / 3, angle + Math.PI / 3);
                    ctx.stroke();

                    // Sweat droplet if running/scared
                    if (worm.isLeaving) {
                        ctx.fillStyle = '#7cd1ff';
                        ctx.beginPath();
                        ctx.arc(head.x - Math.cos(angle) * 8 + Math.cos(angle + Math.PI / 2) * 4, head.y - Math.sin(angle) * 8 + Math.sin(angle + Math.PI / 2) * 4, 1.2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                ctx.restore();
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// Ladybugs animation on Navbar
(function () {
    const LADYBUG_COUNT = 1;
    const SVG_CONTENT = `
<svg width="11" height="11" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" style="overflow: visible; display: block;">
  <line class="leg" x1="2" y1="4" x2="10" y2="8" stroke="#111" stroke-width="0.8"/>
  <line class="leg" x1="10" y1="4" x2="2" y2="8" stroke="#111" stroke-width="0.8"/>
  <line class="leg" x1="1" y1="6" x2="11" y2="6" stroke="#111" stroke-width="0.8"/>
  
  <circle cx="6" cy="6.5" r="4.2" fill="#111"/>
  <circle cx="6" cy="2" r="1.8" fill="#111"/>
  <path d="M 5 1.2 Q 4 0.5 4.5 -0.5 M 7 1.2 Q 8 0.5 7.5 -0.5" stroke="#111" stroke-width="0.5" fill="none"/>
  
  <g class="wing left-wing" style="transform-origin: 6px 3px; transition: transform 0.1s ease;">
    <path d="M 6 3 C 3.5 3, 2 5.5, 2 8 C 2 10.5, 4.5 11, 6 11 Z" fill="#e41613"/>
    <circle cx="4.2" cy="5.5" r="0.6" fill="#111"/>
    <circle cx="3.8" cy="8.2" r="0.65" fill="#111"/>
    <circle cx="5.1" cy="9.8" r="0.5" fill="#111"/>
  </g>
  
  <g class="wing right-wing" style="transform-origin: 6px 3px; transition: transform 0.1s ease;">
    <path d="M 6 3 C 8.5 3, 10 5.5, 10 8 C 10 10.5, 7.5 11, 6 11 Z" fill="#e41613"/>
    <circle cx="7.8" cy="5.5" r="0.6" fill="#111"/>
    <circle cx="8.2" cy="8.2" r="0.65" fill="#111"/>
    <circle cx="6.9" cy="9.8" r="0.5" fill="#111"/>
  </g>
</svg>
`;

    function init() {
        const header = document.querySelector('.site-header');
        if (!header) return;

        // Inject Styles
        const style = document.createElement('style');
        style.textContent = `
            .ladybug-container {
                position: absolute;
                width: 11px;
                height: 11px;
                pointer-events: auto;
                cursor: pointer;
                z-index: 1000;
                transform-origin: center center;
                will-change: transform, left, top;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .ladybug-container svg {
                width: 100%;
                height: 100%;
                transform-origin: center center;
            }
            .ladybug-container.flying .left-wing {
                animation: ladybug-left-wing-flutter 0.04s infinite alternate linear;
            }
            .ladybug-container.flying .right-wing {
                animation: ladybug-right-wing-flutter 0.04s infinite alternate linear;
            }
            .ladybug-container.sitting .left-wing,
            .ladybug-container.sitting .right-wing {
                transform: rotate(0deg);
            }
            .ladybug-container.sitting .leg {
                animation: ladybug-leg-wiggle 0.25s infinite alternate ease-in-out;
            }
            @keyframes ladybug-left-wing-flutter {
                0% { transform: rotate(-10deg); }
                100% { transform: rotate(-45deg); }
            }
            @keyframes ladybug-right-wing-flutter {
                0% { transform: rotate(10deg); }
                100% { transform: rotate(45deg); }
            }
            @keyframes ladybug-leg-wiggle {
                0% { transform: skewX(-2deg); }
                100% { transform: skewX(2deg); }
            }
        `;
        document.head.appendChild(style);

        const bugs = [];

        function chooseNewTarget(bug) {
            const links = header.querySelectorAll('.site-nav a');
            const hRect = header.getBoundingClientRect();
            const inner = header.querySelector('.header-inner');
            const innerRect = inner ? inner.getBoundingClientRect() : hRect;
            const relativeLeft = innerRect.left - hRect.left;
            const relativeTop = innerRect.top - hRect.top;

            // 70% chance to sit on a link, 30% chance to fly around the center menu
            if (links.length > 0 && Math.random() < 0.7) {
                // Filter links to find nearby ones
                const candidateLinks = [];
                let closestLink = null;
                let minLinkDist = Infinity;

                links.forEach(link => {
                    const rect = link.getBoundingClientRect();
                    const linkCenterX = rect.left + rect.width / 2 - hRect.left;
                    const dist = Math.abs(linkCenterX - bug.x);
                    
                    if (dist < minLinkDist) {
                        minLinkDist = dist;
                        closestLink = link;
                    }
                    if (dist < 140) {
                        candidateLinks.push(link);
                    }
                });

                // Pick from nearby links; fallback to the single closest link
                const linksToUse = candidateLinks.length > 0 ? candidateLinks : (closestLink ? [closestLink] : Array.from(links));
                const link = linksToUse[Math.floor(Math.random() * linksToUse.length)];
                const rect = link.getBoundingClientRect();
                
                const linkLeft = rect.left - hRect.left;
                const linkTop = rect.top - hRect.top;
                
                // Sit near the text on the link
                bug.tx = linkLeft + Math.random() * rect.width;
                bug.ty = linkTop + rect.height / 2 + (Math.random() - 0.5) * 6;
                bug.targetLink = link;
            } else {
                // Fly to random point near the bug (short flight within .header-inner bounds)
                const maxOffset = 70;
                const offsetX = (Math.random() - 0.5) * maxOffset * 2;
                const offsetY = (Math.random() - 0.5) * 20;

                bug.tx = Math.max(relativeLeft, Math.min(relativeLeft + innerRect.width, bug.x + offsetX));
                bug.ty = Math.max(relativeTop, Math.min(relativeTop + innerRect.height, bug.y + offsetY));
                bug.targetLink = null;
            }

            bug.state = 'flying';
            bug.dom.classList.remove('sitting');
            bug.dom.classList.add('flying');
        }

        // Spawn bugs (with isFirstFrame flag, to set position on the first requestAnimationFrame render)
        for (let i = 0; i < LADYBUG_COUNT; i++) {
            const dom = document.createElement('div');
            dom.className = 'ladybug-container flying';
            dom.innerHTML = SVG_CONTENT;
            header.appendChild(dom);

            const bug = {
                x: 0,
                y: 0,
                tx: 0,
                ty: 0,
                angle: 0,
                state: 'flying',
                timer: 0,
                targetLink: null,
                dom: dom,
                wingTimer: Math.random() * 100,
                isFirstFrame: true
            };

            dom.addEventListener('mouseenter', () => {
                if (bug.state === 'sitting') {
                    chooseNewTarget(bug);
                }
            });

            bugs.push(bug);
        }

        // Scare bugs on link hover
        const links = header.querySelectorAll('.site-nav a');
        links.forEach(link => {
            link.addEventListener('mouseenter', () => {
                bugs.forEach(bug => {
                    if (bug.state === 'sitting' && bug.targetLink === link) {
                        chooseNewTarget(bug);
                    }
                });
            });
        });

        // Scare bugs on window resize
        window.addEventListener('resize', () => {
            bugs.forEach(bug => {
                if (bug.state === 'sitting') {
                    chooseNewTarget(bug);
                }
            });
        });

        // Animation loop
        let lastTime = performance.now();
        function update(now) {
            const deltaTime = now - lastTime;
            lastTime = now;

            const hRect = header.getBoundingClientRect();
            
            bugs.forEach(bug => {
                if (bug.isFirstFrame) {
                    bug.isFirstFrame = false;
                    const links = header.querySelectorAll('.site-nav a');
                    const inner = header.querySelector('.header-inner');
                    const innerRect = inner ? inner.getBoundingClientRect() : hRect;
                    const relativeLeft = innerRect.left - hRect.left;
                    const relativeTop = innerRect.top - hRect.top;
                    
                    if (links.length > 0) {
                        const link = links[Math.floor(Math.random() * links.length)];
                        const rect = link.getBoundingClientRect();
                        const linkLeft = rect.left - hRect.left;
                        const linkTop = rect.top - hRect.top;

                        bug.tx = linkLeft + Math.random() * rect.width;
                        bug.ty = linkTop + rect.height / 2 + (Math.random() - 0.5) * 6;
                        bug.targetLink = link;

                        const spawnOffsetDir = Math.random() < 0.5 ? -1 : 1;
                        bug.x = bug.tx + spawnOffsetDir * (20 + Math.random() * 15);
                        bug.y = bug.ty + (Math.random() - 0.5) * 10;
                        bug.angle = Math.atan2(bug.ty - bug.y, bug.tx - bug.x);
                    } else {
                        bug.tx = relativeLeft + innerRect.width / 2;
                        bug.ty = relativeTop + innerRect.height / 2;
                        bug.x = bug.tx - 25;
                        bug.y = bug.ty + 5;
                        bug.angle = Math.atan2(bug.ty - bug.y, bug.tx - bug.x);
                    }
                }

                if (bug.state === 'flying') {
                    const dx = bug.tx - bug.x;
                    const dy = bug.ty - bug.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 4) {
                        // Land or start resting
                        if (bug.targetLink) {
                            bug.state = 'sitting';
                            bug.x = bug.tx;
                            bug.y = bug.ty;
                            bug.dom.classList.remove('flying');
                            bug.dom.classList.add('sitting');
                            // Sit for 25 to 55 seconds (fly very infrequently)
                            bug.timer = 25000 + Math.random() * 30000;
                            // Angle points random direction when sitting
                            bug.angle = Math.random() * Math.PI * 2;
                        } else {
                            // Brief rest in header space or pick new target immediately
                            if (Math.random() < 0.4) {
                                bug.state = 'sitting';
                                bug.x = bug.tx;
                                bug.y = bug.ty;
                                bug.dom.classList.remove('flying');
                                bug.dom.classList.add('sitting');
                                // Sit for 15 to 30 seconds
                                bug.timer = 15000 + Math.random() * 15000;
                            } else {
                                chooseNewTarget(bug);
                            }
                        }
                    } else {
                        // Fly speed (slightly faster so it lands quickly)
                        const maxSpeed = 0.85;
                        const speed = Math.min(maxSpeed, 0.25 + dist * 0.035);

                        // Organic buzz vibration noise (perpendicular to movement direction)
                        bug.wingTimer += 0.14;
                        const buzzAmp = 0.25;
                        const buzzX = -Math.sin(bug.angle) * Math.sin(bug.wingTimer) * buzzAmp;
                        const buzzY = Math.cos(bug.angle) * Math.sin(bug.wingTimer) * buzzAmp;

                        bug.x += (dx / dist) * speed + buzzX;
                        bug.y += (dy / dist) * speed + buzzY;

                        // Smooth rotation towards target (faster turn rate so it lands quickly on short paths)
                        const targetAngle = Math.atan2(dy, dx);
                        let angleDiff = targetAngle - bug.angle;
                        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                        bug.angle += angleDiff * 0.095;
                    }
                } else if (bug.state === 'sitting') {
                    bug.timer -= deltaTime;
                    if (bug.timer <= 0) {
                        chooseNewTarget(bug);
                    }
                }

                // Render
                bug.dom.style.left = bug.x + 'px';
                bug.dom.style.top = bug.y + 'px';
                const deg = (bug.angle * 180 / Math.PI) + 90;
                bug.dom.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
            });

            requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

