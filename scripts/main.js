function toggleMenu(menuId) {
    const mainMenu = document.getElementById('main-menu');
    const labsMenu = document.getElementById('labs-menu');

    if (menuId === 'labs-menu') {
        mainMenu.classList.remove('active');
        mainMenu.classList.add('hidden');
        labsMenu.classList.remove('hidden');
        labsMenu.classList.add('active');
    } else {
        labsMenu.classList.remove('active');
        labsMenu.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        mainMenu.classList.add('active');
    }
}