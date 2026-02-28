const segButton   = document.getElementById("seg-button");
const backButton  = document.getElementById("back-button");
const mainButtons = document.getElementById("main-buttons");
const segMenu     = document.getElementById("seg-menu");
const wrapper     = document.querySelector(".menu-wrapper");

/* Measure and apply an explicit pixel height to the wrapper.
   The wrapper has 8px bottom padding baked in, so add it to scrollHeight. */
function lockHeight(container) {
    wrapper.style.height = (container.scrollHeight + 8) + "px";
}

/* Stagger-reveal all .menu-btn children inside a container */
function animateIn(container) {
    const items = container.querySelectorAll(".menu-btn");
    items.forEach((item, index) => {
        setTimeout(() => item.classList.add("show"), index * 100);
    });
}

/* Stagger-hide all .menu-btn children in reverse, then run callback */
function animateOut(container, callback) {
    const items = Array.from(container.querySelectorAll(".menu-btn")).reverse();
    items.forEach((item, index) => {
        setTimeout(() => item.classList.remove("show"), index * 80);
    });
    setTimeout(callback, items.length * 80 + 200);
}

/* Swap menus with a smooth height transition */
function switchTo(hideEl, showEl) {
    // 1. Lock wrapper at current height so transition has a defined start value
    lockHeight(hideEl);

    animateOut(hideEl, () => {
        // 2. Swap visibility
        hideEl.classList.add("hidden");
        showEl.classList.remove("hidden");

        // 3. Transition wrapper to the new menu's natural height
        lockHeight(showEl);

        // 4. Stagger the new buttons in
        animateIn(showEl);
    });
}

/* Initial page load — set height instantly (no transition), then reveal buttons */
window.addEventListener("DOMContentLoaded", () => {
    wrapper.style.transition = "none";
    lockHeight(mainButtons);
    requestAnimationFrame(() => {
        wrapper.style.transition = "";
        animateIn(mainButtons);
    });
});

segButton.addEventListener("click",  () => switchTo(mainButtons, segMenu));
backButton.addEventListener("click", () => switchTo(segMenu, mainButtons));
