document.addEventListener('DOMContentLoaded', init);

async function init() {
    const loadingScreen = document.getElementById('loading-screen');
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            loadingScreen.addEventListener('transitionend', () => {
                window.location.href = 'gett.html';
            }, { once: true });
        } else {
            window.location.href = 'gett.html';
        }
    }, 3000);
}