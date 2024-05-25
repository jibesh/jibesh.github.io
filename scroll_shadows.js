function create_trigger() {
    ScrollTrigger.create({
        trigger: ".shadow_trigger",
        start: "top top",
        end: "top bottom",
        scrub: 1,
        animation: gsap.to("nav", { css: { className: 'navbar shadow navbar-expand-lg navbar-light bg-light sticky-top py-3' }, immediateRender: false }),
        toggleActions: "restart none none reverse",
        preventOverlaps: true,
        scaleX: 0,
        pin: true,
        transformOrigin: "left center", 
    })
}

create_trigger();


function selected_theme_color(){
    let selected_color_hex = getComputedStyle(document.body).getPropertyValue('--navbar_brand_color');
    let divHex = document.getElementById("hex_color");
    divHex.style = `color:${selected_color_hex}`;
    divHex.textContent = `🖌️ ${selected_color_hex} `;
}

selected_theme_color();