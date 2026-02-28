document.addEventListener('DOMContentLoaded', function() {
    const cascadeToggle = document.getElementById('cascade-toggle');
    const cascadeItems = document.getElementById('cascade-items');

    if (cascadeToggle && cascadeItems) {
        cascadeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            cascadeItems.classList.toggle('show');
            cascadeToggle.classList.toggle('active');
        });

        const cascadeLinks = cascadeItems.querySelectorAll('a');
        cascadeLinks.forEach(link => {
            link.addEventListener('click', function() {
                cascadeItems.classList.remove('show');
                cascadeToggle.classList.remove('active');
            });
        });

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.cascade-container')) {
                cascadeItems.classList.remove('show');
                cascadeToggle.classList.remove('active');
            }
        });
    }
});
