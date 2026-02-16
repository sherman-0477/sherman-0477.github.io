const segButton = document.getElementById("seg-button");
const mainButtons = document.getElementById("main-buttons");
const segMenu = document.getElementById("seg-menu");
const backButton = document.getElementById("back-button");

function animateIn(container) {
    const items = container.querySelectorAll(".menu-btn");
    items.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add("show");
        }, index * 120);
    });
}

function animateOut(container, callback) {
    const items = container.querySelectorAll(".menu-btn");
    items.forEach((item, index) => {
        setTimeout(() => {
            item.classList.remove("show");
        }, index * 100);
    });

    setTimeout(callback, items.length * 100 + 200);
}

window.addEventListener("DOMContentLoaded", () => {
    animateIn(mainButtons);
});

segButton.addEventListener("click", () => {
    animateOut(mainButtons, () => {
        mainButtons.classList.add("hidden");
        segMenu.classList.remove("hidden");
        animateIn(segMenu);
    });
});

backButton.addEventListener("click", () => {
    animateOut(segMenu, () => {
        segMenu.classList.add("hidden");
        mainButtons.classList.remove("hidden");
        animateIn(mainButtons);
    });
});