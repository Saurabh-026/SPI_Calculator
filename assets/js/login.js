document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
        const errorEl = document.getElementById('login-error');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorEl.textContent = '';
            
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            const response = await fetch('api/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                window.location.href = 'index.html'; // Redirect to the main app
            } else {
                const result = await response.json();
                errorEl.textContent = result.error || 'An unknown error occurred.';
            }
        });
    }

    if (signupForm) {
        const errorEl = document.getElementById('signup-error');
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorEl.textContent = '';
            
            const formData = new FormData(signupForm);
            const data = Object.fromEntries(formData.entries());

            const response = await fetch('api/signup.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                window.location.href = 'index.html'; // Redirect to the main app on successful signup
            } else {
                const result = await response.json();
                errorEl.textContent = result.error || 'An unknown error occurred.';
            }
        });
    }
});