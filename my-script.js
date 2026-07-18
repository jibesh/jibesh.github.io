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

        // Sparkle particles list
        let sparkles = [];

        function spawnSparkles(x, y, count = 2) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 30;
                sparkles.push({
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.5 - 0.5, // slight upward float
                    size: Math.random() * 4 + 2,
                    maxSize: Math.random() * 8 + 4,
                    opacity: 1,
                    decay: Math.random() * 0.02 + 0.015
                });
            }
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

        // Handle Mouse Events
        canvas.addEventListener('mouseenter', function (e) {
            isHovered = true;
            scareWorm(e);
        });

        canvas.addEventListener('mousemove', function (e) {
            if (!isHovered) isHovered = true;
            // Get mouse position relative to canvas coordinate system
            const rect = canvas.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * canvasWidth;
            const mouseY = ((e.clientY - rect.top) / rect.height) * canvasHeight;
            spawnSparkles(mouseX, mouseY, 2);
            scareWorm(e);
        });

        canvas.addEventListener('mouseleave', function () {
            isHovered = false;
        });

        function scareWorm(e) {
            if (worm.isLeaving) return;
            worm.isLeaving = true;
            
            // Speed up significantly
            worm.speed = worm.scaredSpeed;

            // Choose the closest edge to exit quickly
            const rect = canvas.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * canvasWidth;
            const mouseY = ((e.clientY - rect.top) / rect.height) * canvasHeight;

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
            // 1. Update Sparkles
            for (let i = sparkles.length - 1; i >= 0; i--) {
                const s = sparkles[i];
                s.x += s.vx;
                s.y += s.vy;
                s.opacity -= s.decay;
                if (s.opacity <= 0) {
                    sparkles.splice(i, 1);
                }
            }

            // If hovered, restore / heal the portrait
            if (isHovered) {
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



            // Draw Sparkles (glowing stars)
            if (sparkles.length > 0) {
                sparkles.forEach(s => {
                    drawSparkle(ctx, s.x, s.y, s.size, s.opacity);
                });
            }
        }

        function drawSparkle(ctx, x, y, size, opacity) {
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = 'rgba(255, 240, 150, ' + opacity + ')';
            ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
            ctx.shadowBlur = 6;
            
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.quadraticCurveTo(x, y, x + size, y);
            ctx.quadraticCurveTo(x, y, x, y + size);
            ctx.quadraticCurveTo(x, y, x - size, y);
            ctx.quadraticCurveTo(x, y, x, y - size);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
