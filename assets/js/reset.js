document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('username');
    const question = params.get('question');
    document.getElementById('secret-question-display').textContent = question;
    document.getElementById('username').value = username;
    document.getElementById('reset-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const errorEl = document.getElementById('error-message');
        errorEl.textContent = '';
        try {
            const response = await fetch('api/reset_via_question.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'An error occurred.');
            document.getElementById('reset-container').innerHTML = `
                <div class="text-center bg-black/20 backdrop-blur-md py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-white/10">
                    <h2 class="text-3xl font-extrabold text-white">Success!</h2>
                    <p class="mt-4 text-gray-300">${result.success}</p>
                    <a href="login.html" class="mt-6 inline-block w-full py-2 px-4 border rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Back to Login</a>
                </div>
            `;
        } catch (error) {
            errorEl.textContent = error.message;
        }
    });
});