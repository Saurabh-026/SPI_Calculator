document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('request-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const errorEl = document.getElementById('error-message');
        errorEl.textContent = '';
        try {
            const response = await fetch('api/get_secret_question.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username}) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'An error occurred.');
            window.location.href = `reset_with_question.html?username=${username}&question=${encodeURIComponent(data.secret_question)}`;
        } catch (error) {
            errorEl.textContent = error.message;
        }
    });
});