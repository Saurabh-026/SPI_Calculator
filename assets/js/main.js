document.addEventListener('DOMContentLoaded', init);

// --- GLOBAL STATE ---
const AppState = {
    currentUser: null,
    currentView: 'dashboard',
    // Adjusted SPI weights to include 'activities'
    spiWeights: { academics: 0.4, skills: 0.3, projects: 0.2, activities: 0.1 },
    skillBaseWeights: {'JavaScript':20,'React':25,'DSA':30,'Python':20,'ML':35,'Node.js':20,'SQL':15,'AutoCAD':25,'SolidWorks':25,'Java':15,'C++':15,'Figma':15,'Photoshop':10}
};

// --- INITIALIZATION & CORE APP LOGIC ---
async function init() {
    // Check login status by fetching user data
    const response = await fetch('api/profile.php');
    if (!response.ok) {
        // If not logged in, redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    // Store user data in our global state
    AppState.currentUser = await response.json();
    
    // Initial setup
    setupEventListeners();
    applyAppearance(AppState.currentUser);
    updateHeader();
    navigateTo('dashboard'); // This will now also set the page title
    lucide.createIcons();
}

function setupEventListeners() {
    // Main navigation
    document.getElementById('main-nav').addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link');
        if (!link) return; // Exit if the click wasn't on a link
    
        const view = link.dataset.view;
    
        // If the clicked link has a data-view attribute, use the SPA navigation.
        // Links without data-view (like 'about.html') will perform a default browser navigation.
        if (view) { 
            e.preventDefault(); // Prevent the default browser navigation
            navigateTo(view);  // Use our custom navigation function
        }
    
        // This part ensures the sidebar closes on mobile for ALL link clicks
        const sidebar = document.getElementById('sidebar');
        if (!sidebar.classList.contains('md:translate-x-0') && !sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.add('-translate-x-full'); // Hide sidebar
            const overlay = document.getElementById('sidebar-overlay');
            if (overlay) {
                overlay.remove(); // Remove overlay
            }
        }
    });

    // User dropdown menu
    const userMenuButton = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');
    userMenuButton.addEventListener('click', () => userDropdown.classList.toggle('hidden'));
    document.addEventListener('click', (e) => { 
        if (userMenuButton && !userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.add('hidden'); 
        }
    });

    // Logout button
    document.getElementById('logout-button').addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch('api/logout.php');
        window.location.href = 'login.html';
    });

    // Main content area listener for profile form submission
    document.getElementById('main-content').addEventListener('submit', async (e) => {
        if (e.target.id === 'profile-form') {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const response = await fetch('api/profile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                AppState.currentUser = { ...AppState.currentUser, ...data };
                updateHeader();
                alert('Profile updated successfully!');
                document.getElementById('profile-page-photo').src = data.photo_url;
            } else {
                alert('Error updating profile.');
            }
        }
    });

    // Modal container listener for all modal forms
    const modalContainer = document.getElementById('add-data-modal');
    modalContainer.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        let endpoint = '';
        let data = {};
        let viewToRefresh = AppState.currentView;

        if (form.id === 'add-academics-form') {
            endpoint = 'api/academics.php';
            const subjects = [];
            const subjectNameInputs = form.querySelectorAll('.subject-name');
            const subjectMarksInputs = form.querySelectorAll('.subject-marks');
            for (let i = 0; i < subjectNameInputs.length; i++) {
                const name = subjectNameInputs[i].value;
                const marks = parseInt(subjectMarksInputs[i].value);
                if (name && marks >= 0 && marks <= 100) {
                    subjects.push({ name, marks });
                }
            }
            data = { sem: parseInt(form.elements.sem.value), subjects: subjects };
            viewToRefresh = 'academics';
        } else if (form.id === 'add-skill-form') {
            endpoint = 'api/skills.php';
            data = { name: form.elements.name.value, level: form.elements.level.value, cert: form.elements.cert.value };
            viewToRefresh = 'skills';
        } else if (form.id === 'add-project-form') {
            endpoint = 'api/projects.php';
            data = { type: form.elements.type.value, title: form.elements.title.value, duration: form.elements.duration.value, desc: form.elements.desc.value };
            viewToRefresh = 'projects';
        } else if (form.id === 'add-extracurricular-form') { //
            endpoint = 'api/extracurricular.php'; //
            data = { //
                title: form.elements.title.value, //
                role: form.elements.role.value, //
                duration: form.elements.duration.value, //
                description: form.elements.description.value, //
                link: form.elements.link.value //
            }; //
            viewToRefresh = 'extracurricular'; //
        }
        
        if (!endpoint) return;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeModal();
            navigateTo(viewToRefresh);
        } else {
            alert('Failed to add item.');
        }
    });
    
    // Listener for adding more subject fields in the modal
    modalContainer.addEventListener('click', (e) => {
        if (e.target.id === 'add-subject-btn') {
            document.getElementById('subjects-container').insertAdjacentHTML('beforeend', `
            <div class="flex space-x-2 mb-2">
                <input placeholder="Subject Name" class="form-input subject-name">
                <input type="number" placeholder="Marks %" class="form-input subject-marks w-28">
            </div>`);
        }
    });

    // Sidebar Toggle Logic
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');

    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full'); 
            
            let overlay = document.getElementById('sidebar-overlay');
            if (sidebar.classList.contains('-translate-x-full')) {
                if (overlay) {
                    overlay.remove();
                }
            } else {
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'sidebar-overlay';
                    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden'; 
                    document.body.appendChild(overlay);

                    overlay.addEventListener('click', () => {
                        sidebar.classList.add('-translate-x-full'); 
                        overlay.remove(); 
                    });
                }
            }
        });
    }

    // Floating Widget Logic
    const chatWidget = document.getElementById('chat-widget-container');
    const toggleButton = document.getElementById('chat-toggle-btn');
    const closeButton = document.getElementById('close-chat-btn');

    toggleButton.addEventListener('click', () => {
        chatWidget.classList.toggle('active');
    });

    closeButton.addEventListener('click', () => {
        chatWidget.classList.remove('active');
    });

    setupChatListeners();
}

async function navigateTo(view) {
    AppState.currentView = view;
    // Highlight the active link in the sidebar
    document.querySelectorAll('#main-nav .nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.view === view);
    });
    
    const pageTitle = document.getElementById('page-title');
    let titleText = '';
    switch (view) {
        case 'dashboard':
            titleText = 'Dashboard';
            break;
        case 'profile':
            titleText = 'My Profile';
            break;
        case 'academics':
            titleText = 'Academics';
            break;
        case 'skills':
            titleText = 'Skills';
            break;
        case 'projects':
            titleText = 'Projects';
            break;
        case 'extracurricular': //
            titleText = 'Extra-curricular Activities'; //
            break; //
        case 'leaderboard':
            titleText = 'Leaderboard';
            break;
        case 'resume':
            titleText = 'Resume Builder';
            break;
        // The 'about' view is no longer handled as an SPA route here, as it's a direct link.
        case 'appearance':
            titleText = 'Appearance';
            break;
        default:
            titleText = 'Welcome'; 
    }
    if (pageTitle) { 
        pageTitle.textContent = titleText; 
    }

    const mainContent = document.getElementById('main-content');
    const renderFunction = window.ViewRenders[view];
    if (renderFunction) {
        await renderFunction();
    } else {
        // If no render function, clear content or show a message.
        // This applies to 'about' if its data-view was still present but not handled.
        // With the current change to index.html, 'about' will just be a normal link.
        console.error(`No render function found for view: ${view}`);
        mainContent.innerHTML = `<div class="text-center text-red-500">Content not found for this view, or it's an external link.</div>`;
    }

    // After rendering, set up listeners for specific pages
    if (view === 'appearance') {
        setupAppearanceListeners();
    }
}

// --- UI & APPEARANCE FUNCTIONS ---

function updateHeader() {
    document.getElementById('header-user-name').textContent = AppState.currentUser.name;
    document.getElementById('header-user-photo').src = AppState.currentUser.photo_url;
}

function applyAppearance(user) {
    const body = document.body;
    body.className = '';
    body.classList.add(user.theme, user.font);
    
    const fontMap = {
        'font-inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
        'font-roboto-mono': 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap',
        'font-lora': 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;700&display=swap'
    };
    document.getElementById('font-link').href = fontMap[user.font];
}

function setupAppearanceListeners() {
    const saveAppearance = async (data) => {
        await fetch('api/profile.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    };

    // Theme Selector Logic
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        if (AppState.currentUser.theme === option.dataset.theme) {
            option.style.borderColor = 'var(--accent-color)';
        }
        option.addEventListener('click', () => {
            const selectedTheme = option.dataset.theme;
            AppState.currentUser.theme = selectedTheme;
            applyAppearance(AppState.currentUser);
            saveAppearance({ theme: selectedTheme });
            themeOptions.forEach(opt => opt.style.borderColor = 'var(--border-color)');
            option.style.borderColor = 'var(--accent-color)';
        });
    });
    
    // Font Selector Logic
    const fontSelector = document.getElementById('font-selector');
    if(fontSelector) {
        fontSelector.addEventListener('change', (e) => {
            const selectedFont = e.target.value;
            AppState.currentUser.font = selectedFont;
            applyAppearance(AppState.currentUser);
            saveAppearance({ font: selectedFont });
        });
    }
}

function setupChatListeners() {
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');

    if (!chatInput || !sendButton || !chatMessages) {
        return;
    }

    const sendMessage = async () => {
        const message = chatInput.value.trim();
        if (!message) return;

        chatMessages.innerHTML += `<div class="p-3 rounded-lg bg-indigo-500 text-white self-end">${message}</div>`;
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const thinkingIndicator = document.createElement('div');
        thinkingIndicator.id = 'thinking';
        thinkingIndicator.innerHTML = `<div class="p-3 rounded-lg bg-slate-200 text-slate-600 self-start">Thinking...</div>`;
        chatMessages.appendChild(thinkingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const response = await fetch('api/chat.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();
        
        thinkingIndicator.remove();
        chatMessages.innerHTML += `<div class="p-3 rounded-lg bg-slate-200 text-slate-600 self-start">${data.reply}</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// --- MODAL MANAGEMENT ---1
function openModal(type) {
    const modalContent = document.getElementById('modal-content');
    let content = '';
    if (type === 'academics') {
        content = `
        <h2 class="text-2xl font-bold mb-4">Add Academic Record</h2>
        <form id="add-academics-form" class="space-y-4">
            <div><label class="block text-sm font-medium">Semester Number</label><input type="number" name="sem" required class="form-input"></div>
            <div id="subjects-container"><label class="block text-sm font-medium mb-1">Subjects</label><div class="flex space-x-2 mb-2"><input placeholder="Subject Name" class="form-input subject-name"><input type="number" placeholder="Marks %" class="form-input subject-marks w-28"></div></div>
            <button type="button" id="add-subject-btn" class="text-sm" style="color: var(--accent-color);">+ Add another subject</button>
            <div class="flex justify-end space-x-4 pt-4"><button type="button" onclick="closeModal()" class="px-4 py-2 rounded-md" style="background-color: var(--border-color);">Cancel</button><button type="submit" class="btn-primary w-auto px-5">Save Record</button></div>
        </form>`;
    } else if (type === 'skills') {
        content = `
        <h2 class="text-2xl font-bold mb-4">Add Skill</h2>
        <form id="add-skill-form" class="space-y-4">
            <div><label class="block text-sm font-medium">Skill Name</label><input type="text" name="name" required class="form-input"></div>
            <div><label class="block text-sm font-medium">Proficiency</label><select name="level" class="form-input"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
            <div><label class="block text-sm font-medium">Certificate URL (Optional)</label><input type="url" name="cert" class="form-input"></div>
            <div class="flex justify-end space-x-4 pt-4"><button type="button" onclick="closeModal()" class="px-4 py-2 rounded-md" style="background-color: var(--border-color);">Cancel</button><button type="submit" class="btn-primary w-auto px-5">Add Skill</button></div>
        </form>`;
    } else if (type === 'projects') {
        content = `
        <h2 class="text-2xl font-bold mb-4">Add Project/Internship</h2>
        <form id="add-project-form" class="space-y-4">
            <div><label class="block text-sm font-medium">Type</label><select name="type" class="form-input"><option>Project</option><option>Internship</option></select></div>
            <div><label class="block text-sm font-medium">Title</label><input type="text" name="title" required class="form-input"></div>
            <div><label class="block text-sm font-medium">Duration</label><input type="text" name="duration" placeholder="e.g., 3 Months" required class="form-input"></div>
            <div><label class="block text-sm font-medium">Description</label><textarea name="desc" rows="3" required class="form-input"></textarea></div>
            <div class="flex justify-end space-x-4 pt-4"><button type="button" onclick="closeModal()" class="px-4 py-2 rounded-md" style="background-color: var(--border-color);">Cancel</button><button type="submit" class="btn-primary w-auto px-5">Add</button></div>
        </form>`;
    } else if (type === 'extracurricular') { //
        content = `
        <h2 class="text-2xl font-bold mb-4">Add Extra-curricular Activity</h2>
        <form id="add-extracurricular-form" class="space-y-4">
            <div><label class="block text-sm font-medium">Activity Title</label><input type="text" name="title" required class="form-input"></div>
            <div><label class="block text-sm font-medium">Your Role</label><input type="text" name="role" required class="form-input"></div>
            <div><label class="block text-sm font-medium">Duration</label><input type="text" name="duration" placeholder="e.g., Jan 2023 - Dec 2024" required class="form-input"></div>
            <div><label class="block text-sm font-medium">Description</label><textarea name="description" rows="3" required class="form-input"></textarea></div>
            <div><label class="block text-sm font-medium">Link (Optional)</label><input type="url" name="link" class="form-input"></div>
            <div class="flex justify-end space-x-4 pt-4"><button type="button" onclick="closeModal()" class="px-4 py-2 rounded-md" style="background-color: var(--border-color);">Cancel</button><button type="submit" class="btn-primary w-auto px-5">Add Activity</button></div>
        </form>`; //
    }
    modalContent.innerHTML = content;
    document.getElementById('add-data-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('add-data-modal').classList.remove('active');
}

// --- HELPER FUNCTIONS ---
function calculateCurrentUserSPI() {
    const user = AppState.currentUser;
    if (!user.academics) return { total: 0, cgpa: 0, breakdown: {} };

    const totalSgpa = user.academics.reduce((acc, sem) => acc + parseFloat(sem.sgpa), 0);
    const cgpa = user.academics.length > 0 ? totalSgpa / user.academics.length : 0;
    const academicScore = cgpa * 10;

    let skillScore = 0;
    if (user.skills && Array.isArray(user.skills)) user.skills.forEach(skill => skillScore += AppState.skillBaseWeights[skill.name] || 10);
    skillScore = Math.min(100, skillScore);

    let projectScore = 0;
    if (user.projects && Array.isArray(user.projects)) user.projects.forEach(p => projectScore += p.type === 'Internship' ? 15 : 10);
    projectScore = Math.min(100, projectScore);
    
    let activityScore = 0; //
    if (user.extracurricular && Array.isArray(user.extracurricular)) user.extracurricular.forEach(a => activityScore += 5); // Simple scoring, adjust as needed
    activityScore = Math.min(100, activityScore); //

    const totalSPI = (academicScore * AppState.spiWeights.academics) + 
                     (skillScore * AppState.spiWeights.skills) + 
                     (projectScore * AppState.spiWeights.projects) +
                     (activityScore * AppState.spiWeights.activities); //

    return { total: Math.min(100, totalSPI), cgpa: cgpa, breakdown: { academics: academicScore, skills: skillScore, projects: projectScore, activities: activityScore } }; //
}

function getResumeSuggestions(user, spiData) {
    const suggestions = [];

    if (spiData.total < 50) {
        suggestions.push('Focus on all areas to improve your overall SPI score.');
    } else if (spiData.total < 75) {
        suggestions.push('You\'re on the right track! Adding more high-value projects or skills can give you a significant boost.');
    }
    if (spiData.cgpa < 7.5 && spiData.cgpa > 0) {
        suggestions.push('Consider focusing on improving your grades to boost your academic score.');
    }
    if (user.skills.length < 5) {
        suggestions.push('Broaden your skillset. Aim for at least 5 key skills in your field.');
    }
    const hasInternship = user.projects.some(p => p.type === 'Internship');
    if (!hasInternship && user.projects.length > 0) {
        suggestions.push('You have good projects! An internship would make your profile even stronger.');
    } else if (user.projects.length < 2) {
         suggestions.push('Add at least two significant projects or an internship to showcase your practical experience.');
    }
    if (user.extracurricular && user.extracurricular.length < 2) { //
        suggestions.push('Highlight your leadership and teamwork skills by adding more extra-curricular activities.'); //
    } //
    if (!user.linkedin_url || user.linkedin_url === '#') {
        suggestions.push('Add your LinkedIn profile URL to look more professional.');
    }
    if (!user.github_url || user.github_url === '#') {
        suggestions.push('A GitHub profile is essential for showcasing your coding projects. Add the link!');
    }
    return suggestions;
}

// --- RENDER FUNCTIONS ---
window.ViewRenders = {
    dashboard: async () => {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `<div class="text-center">Loading Dashboard...</div>`;
        
        AppState.currentUser.academics = await (await fetch('api/academics.php')).json();
        AppState.currentUser.skills = await (await fetch('api/skills.php')).json();
        AppState.currentUser.projects = await (await fetch('api/projects.php')).json();
        AppState.currentUser.extracurricular = await (await fetch('api/extracurricular.php')).json(); // Fetch extracurricular data

        const spi = calculateCurrentUserSPI();

        mainContent.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
            <div class="lg:col-span-2 card p-6">
                <h3 class="font-bold text-lg mb-4">SPI Breakdown</h3>
                <div class="relative h-96"><canvas id="spiDashboardChart"></canvas></div>
            </div>
            <div class="space-y-6">
                <div class="card p-6 text-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white"><h3 class="font-semibold opacity-80">Overall SPI Score</h3><p class="text-5xl font-extrabold mt-2">${spi.total.toFixed(2)}%</p></div>
                <div class="card p-6"><h3 class="font-bold text-lg mb-4">Quick Stats</h3><div class="space-y-4">
                    <div class="flex justify-between items-center"><span class="font-medium">CGPA</span><span class="font-bold text-lg">${spi.cgpa.toFixed(2)}</span></div>
                    <div class="flex justify-between items-center"><span class="font-medium">Skills</span><span class="font-bold text-lg">${AppState.currentUser.skills.length}</span></div>
                    <div class="flex justify-between items-center"><span class="font-medium">Projects</span><span class="font-bold text-lg">${AppState.currentUser.projects.length}</span></div>
                    <div class="flex justify-between items-center"><span class="font-medium">Activities</span><span class="font-bold text-lg">${AppState.currentUser.extracurricular.length}</span></div>
                </div></div>
            </div>
        </div>`;
        
        const ctx = document.getElementById('spiDashboardChart').getContext('2d');
        new Chart(ctx, { 
            type: 'doughnut', 
            data: { 
                labels: ['Academics', 'Skills', 'Projects', 'Activities'], // Added 'Activities' label
                datasets: [{ 
                    data: [
                        (spi.breakdown.academics * AppState.spiWeights.academics), 
                        (spi.breakdown.skills * AppState.spiWeights.skills), 
                        (spi.breakdown.projects * AppState.spiWeights.projects),
                        (spi.breakdown.activities * AppState.spiWeights.activities) // Added activities data
                    ], 
                    backgroundColor: ['#6366f1', '#22c55e', '#facc15', '#f472b6'], // Added a new color for activities
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim(), 
                    borderWidth: 4 
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: true, 
                cutout: '70%', 
                plugins: { 
                    legend: { 
                        position: 'bottom', 
                        labels: { 
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() 
                        } 
                    } 
                } 
            } 
        });
    },
    profile: () => {
        const user = AppState.currentUser;
        document.getElementById('main-content').innerHTML = `
        <div class="card p-8 max-w-4xl mx-auto fade-in">
            <form id="profile-form">
                <div class="flex items-center space-x-6 mb-8">
                    <img id="profile-page-photo" src="${user.photo_url}" class="w-24 h-24 rounded-full border-4" style="border-color: var(--border-color);">
                    <div><label class="block text-sm font-medium">Profile Photo URL</label><input type="text" name="photo_url" value="${user.photo_url}" class="form-input"></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label class="block text-sm font-medium">Full Name</label><input type="text" name="name" value="${user.name}" class="form-input"></div>
                    <div><label class="block text-sm font-medium">Contact Email</label><input type="email" name="email" value="${user.email}" class="form-input"></div>
                    <div><label class="block text-sm font-medium">Branch</label><input type="text" name="branch" value="${user.branch}" class="form-input"></div>
                    <div><label class="block text-sm font-medium">Semester</label><input type="number" name="semester" value="${user.semester}" class="form-input"></div>
                    <div><label class="block text-sm font-medium">LinkedIn URL</label><input type="url" name="linkedin_url" value="${user.linkedin_url}" class="form-input"></div>
                    <div><label class="block text-sm font-medium">GitHub URL</label><input type="url" name="github_url" value="${user.github_url}" class="form-input"></div>
                </div>
                <div class="mt-8 flex justify-end"><button type="submit" class="btn-primary w-auto px-6">Save Changes</button></div>
            </form>
        </div>`;
    },
    academics: async () => {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="text-center">Loading...</div>`;

    const response = await fetch('api/academics.php');
    const academicsData = await response.json();
    AppState.currentUser.academics = academicsData;

    let content = `
    <div class="fade-in space-y-6">
        <div class="flex justify-between items-center mb-4">
            <div>
                <h2 class="text-2xl font-bold">Academic Records</h2>
                <p class="text-sm text-gray-500">Track your semester-wise academic performance</p>
            </div>
            <button onclick="openModal('academics')" class="btn-primary w-auto px-5">Add Semester Record</button>
        </div>
    `;

    if (academicsData.length > 0) {
        academicsData.forEach(sem => {
            const subjectList = sem.subjects.length > 0
                ? sem.subjects.map(sub => {
                    let badgeColor = 'text-gray-700 bg-gray-100';
                    const marks = parseFloat(sub.marks);
                    if (marks >= 85) badgeColor = 'text-green-700 bg-green-100';
                    else if (marks >= 70) badgeColor = 'text-yellow-700 bg-yellow-100';
                    else if (marks >= 50) badgeColor = 'text-orange-700 bg-orange-100';
                    else badgeColor = 'text-red-700 bg-red-100';

                    return `
                        <li class="flex justify-between items-center p-2 rounded-md border border-gray-100 hover:shadow-sm">
                            <span>${sub.name}</span>
                            <span class="text-sm px-2 py-1 rounded ${badgeColor} font-semibold">${marks.toFixed(2)}%</span>
                        </li>`;
                }).join('')
                : `<p class="text-sm text-gray-500 mt-2">No subjects recorded for this semester.</p>`;

            content += `
            <div class="card p-6 hover:shadow-md transition-shadow duration-300">
                <h3 class="text-xl font-bold mb-1">Semester ${sem.semester_number}</h3>
                <p class="font-semibold mb-4 text-indigo-600">SGPA: ${parseFloat(sem.sgpa).toFixed(2)}</p>
                <ul class="space-y-2">${subjectList}</ul>
            </div>`;
        });
    } else {
        content += `
        <div class="card p-6 text-center text-gray-500">
            No academic records found.
        </div>`;
    }

    content += `</div>`;
    mainContent.innerHTML = content;
},

    skills: async () => {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="text-center">Loading...</div>`;

    const response = await fetch('api/skills.php');
    const skillsData = await response.json();
    AppState.currentUser.skills = skillsData;

    let content = `
    <div class="fade-in">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-2xl font-bold">Skills</h2>
                <p class="text-sm text-gray-500">Your technical and professional skills</p>
            </div>
            <button onclick="openModal('skills')" class="btn-primary w-auto px-5">Add New Skill</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    `;

    if (skillsData.length > 0) {
        skillsData.forEach(skill => {
            // Style the skill level as a badge
            let levelBadgeColor = 'bg-gray-100 text-gray-700';
            if (skill.level.toLowerCase().includes('beginner')) levelBadgeColor = 'bg-yellow-100 text-yellow-800';
            else if (skill.level.toLowerCase().includes('intermediate')) levelBadgeColor = 'bg-blue-100 text-blue-800';
            else if (skill.level.toLowerCase().includes('advanced')) levelBadgeColor = 'bg-green-100 text-green-800';

            content += `
            <div class="card p-5 hover:shadow-md transition-shadow duration-300">
                <h3 class="text-lg font-bold mb-1">${skill.name}</h3>
                <span class="inline-block text-xs font-semibold px-2 py-1 rounded ${levelBadgeColor}">${skill.level}</span>
                ${
                    skill.certificate_url 
                    ? `<a href="${skill.certificate_url}" target="_blank" class="text-sm mt-3 inline-block text-indigo-600 hover:underline">📄 View Certificate</a>` 
                    : ''
                }
            </div>`;
        });
    } else {
        content += `
        <div class="md:col-span-2 lg:col-span-3 card p-6 text-center text-gray-500">
            No skills added yet.
        </div>`;
    }

    content += `</div></div>`;
    mainContent.innerHTML = content;
},

    projects: async () => {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="text-center">Loading...</div>`;

    const response = await fetch('api/projects.php');
    const projectsData = await response.json();
    AppState.currentUser.projects = projectsData;

    let content = `
    <div class="fade-in">
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold">Projects & Internships</h2>
            <button onclick="openModal('projects')" class="btn-primary w-auto px-5">Add Project/Internship</button>
        </div>
        <div class="space-y-6">
    `;

    if (projectsData.length > 0) {
        projectsData.forEach(p => {
            const badgeColor = p.type === 'Internship' ? 'text-green-600 bg-green-100' : 'text-blue-600 bg-blue-100';
            const icon = p.type === 'Internship' ? '🧑‍💼' : '💻';
            const shortDesc = p.description.length > 200 ? `${p.description.slice(0, 200)}...` : p.description;

            content += `
            <div class="card p-6 hover:shadow-lg transition-shadow duration-300">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold uppercase ${badgeColor} px-2 py-1 rounded-full">${icon} ${p.type}</span>
                </div>
                <h3 class="font-bold text-xl mt-2">${p.title}</h3>
                <p class="text-sm mb-2 text-gray-500">${p.duration}</p>
                <p title="${p.description.replace(/"/g, '&quot;')}">${shortDesc}</p>
            </div>
            `;
        });
    } else {
        content += `
        <div class="card p-6 text-center text-gray-500">
            <img src="assets/empty-projects.svg" alt="No Projects" class="w-32 h-32 mx-auto mb-4 opacity-75" />
            No projects or internships added yet.
        </div>`;
    }

    content += `</div></div>`;
    mainContent.innerHTML = content;

    
    },

    extracurricular: async () => { //
        const mainContent = document.getElementById('main-content'); //
        mainContent.innerHTML = `<div class="text-center">Loading Extra-curricular Activities...</div>`; //

        const response = await fetch('api/extracurricular.php'); //
        const activitiesData = await response.json(); //
        AppState.currentUser.extracurricular = activitiesData; //

        let content = `
        <div class="fade-in">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl font-bold">Extra-curricular Activities</h2>
                    <p class="text-sm text-gray-500">Showcase your involvement outside academics</p>
                </div>
                <button onclick="openModal('extracurricular')" class="btn-primary w-auto px-5">Add Activity</button>
            </div>
            <div class="space-y-6">
        `; //

        if (activitiesData.length > 0) { //
            activitiesData.forEach(activity => { //
                content += `
                <div class="card p-6 hover:shadow-lg transition-shadow duration-300">
                    <h3 class="font-bold text-xl">${activity.title}</h3>
                    <p class="text-sm mb-2 text-gray-500">${activity.role} | ${activity.duration}</p>
                    <p>${activity.description}</p>
                    ${activity.link ? `<a href="${activity.link}" target="_blank" class="text-sm mt-3 inline-block text-indigo-600 hover:underline">🔗 View Details</a>` : ''}
                </div>
                `; //
            }); //
        } else { //
            content += `
            <div class="card p-6 text-center text-gray-500">
                <img src="assets/empty-activities.svg" alt="No Activities" class="w-32 h-32 mx-auto mb-4 opacity-75" />
                No extra-curricular activities added yet.
            </div>`; //
        }

        content += `</div></div>`; //
        mainContent.innerHTML = content; //
    }, //

    leaderboard: async () => {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="text-center">Calculating ranks...</div>`;

    const response = await fetch('api/leaderboard.php');
    const rankedUsers = await response.json();

    if (!rankedUsers.length) {
        mainContent.innerHTML = `<div class="text-center text-gray-600 mt-10">No users found on the leaderboard.</div>`;
        return;
    }

    let content = `
    <div class="card p-6 fade-in">
        <h2 class="text-2xl font-bold mb-1">Student Leaderboard</h2>
        <p class="text-sm text-gray-500 mb-6">Top performers ranked by SPI</p>
        <div class="overflow-x-auto">
        <table class="w-full text-left border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <thead class="bg-gray-100 text-gray-700 text-sm uppercase tracking-wider">
                <tr>
                    <th class="p-4">Rank</th>
                    <th class="p-4">Student</th>
                    <th class="p-4">Branch</th>
                    <th class="p-4">SPI</th>
                </tr>
            </thead>
            <tbody class="text-sm text-gray-800">
    `;

    rankedUsers.forEach((user, i) => {
        const rank = i + 1;
        let badge = "";
        if (rank === 1) badge = " 🥇";
        else if (rank === 2) badge = " 🥈";
        else if (rank === 3) badge = " 🥉";

        content += `
        <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-slate-100 dark:hover:bg-slate-800 border-b border-gray-200">
            <td class="p-4 font-bold text-lg">${rank}${badge}</td>
            <td class="p-4 flex items-center">
                <img src="${user.photo_url}" class="w-10 h-10 rounded-full mr-4 object-cover" />
                <span>${user.name}</span>
            </td>
            <td class="p-4">${user.branch}</td>
            <td class="p-4 font-semibold" style="color: var(--accent-color);">${user.spi.toFixed(2)}%</td>
        </tr>
        `;
    });

    content += `
            </tbody>
        </table>
        </div>
    </div>
    `;

    mainContent.innerHTML = content;
    },

    resume: async () => {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="text-center">Generating Resume...</div>`;
    const user = AppState.currentUser;
    if (!user.academics) user.academics = await (await fetch('api/academics.php')).json();
    if (!user.skills) user.skills = await (await fetch('api/skills.php')).json();
    if (!user.projects) user.projects = await (await fetch('api/projects.php')).json();
    if (!user.extracurricular) user.extracurricular = await (await fetch('api/extracurricular.php')).json(); // Fetch extracurricular data for resume

    const spi = calculateCurrentUserSPI();
    const suggestions = getResumeSuggestions(user, spi);
    mainContent.innerHTML = `
    <div class="flex justify-end mb-6"><button id="print-resume-btn" class="btn-primary w-auto px-5 flex items-center">Print to PDF</button></div>
    <div class="card mb-8 fade-in">
        <div class="p-6 md:flex md:items-center md:gap-8">
            <div class="text-center md:text-left mb-4 md:mb-0">
                <h3 class="text-lg font-semibold ">Resume Readiness Score</h3>
                <p class="text-6xl font-bold" style="color: var(--accent-color);">${spi.total.toFixed(0)}<span class="text-3xl">%</span></p>
            </div>
            <div class="flex-1">
                <h4 class="font-semibold mb-2 ">Suggestions for Improvement:</h4>
                ${
                    suggestions.length > 0 
                        ? `<ul class="list-disc list-inside space-y-1 text-sm text-gray-600 ">${suggestions.map(s => `<li>${s}</li>`).join('')}</ul>` 
                        : `<p class="text-sm text-green-600 font-semibold">Your profile looks great! Keep up the excellent work.</p>`
                }
            </div>
        </div>
    </div>
    <div id="resume-output" class="bg-white p-8 shadow-2xl max-w-4xl mx-auto text-black">
        <div class="grid grid-cols-3 gap-8">
            <div class="col-span-1 border-r-2 pr-8 border-gray-200">
                <img src="${user.photo_url}" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover">
                <h1 class="text-3xl font-bold text-center">${user.name}</h1>
                <h2 class="text-lg text-center text-indigo-600 font-semibold">${user.branch}</h2>
                <div class="mt-8">
                    <h3 class="text-sm font-bold uppercase tracking-wider mb-2 border-b-2 border-gray-300 pb-1">Contact</h3>
                    <p class="text-sm break-all">${user.email}</p>
                    <a href="${user.linkedin_url}" class="text-sm text-blue-600 block">LinkedIn</a>
                    <a href="${user.github_url}" class="text-sm text-blue-600 block">GitHub</a>
                </div>
                <div class="mt-6">
                    <h3 class="text-sm font-bold uppercase tracking-wider mb-2 border-b-2 border-gray-300 pb-1">Skills</h3>
                    ${AppState.currentUser.skills.map(s => `<span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">${s.name}</span>`).join('')}
                </div>
            </div>
            <div class="col-span-2">
                <h3 class="text-sm font-bold uppercase tracking-wider mb-2 border-b-2 border-gray-300 pb-1">Summary</h3>
                <p class="text-sm mb-6">
                    An enthusiastic and highly motivated student specializing in ${user.branch}, consistently striving for academic and personal excellence. Demonstrates strong analytical and problem-solving skills with a solid foundation in core technical subjects. Maintains a commendable CGPA of ${spi.cgpa.toFixed(2)} and an overall SPI of ${spi.total.toFixed(2)}%, reflecting a commitment to continuous improvement and academic achievement.
                </p>
                <h3 class="text-sm font-bold uppercase tracking-wider mb-2 mt-6 border-b-2 border-gray-300 pb-1">Projects & Experience</h3>
                ${AppState.currentUser.projects.map(p => `
                    <div class="mb-4">
                        <h4 class="font-bold">${p.title} <span class="text-sm font-normal text-gray-500">| ${p.duration}</span></h4>
                        <p class="text-sm">${p.description}</p>
                    </div>
                `).join('')}
                <h3 class="text-sm font-bold uppercase tracking-wider mb-2 mt-6 border-b-2 border-gray-300 pb-1">Extra-curricular Activities</h3> ${AppState.currentUser.extracurricular.map(a => ` <div class="mb-4"> <h4 class="font-bold">${a.title} <span class="text-sm font-normal text-gray-500">| ${a.role}</span></h4> <p class="text-sm">${a.description}</p> </div> `).join('')} <h3 class="text-sm font-bold uppercase tracking-wider mb-2 mt-6 border-b-2 border-gray-300 pb-1">Academics</h3>
                ${AppState.currentUser.academics.map(sem => `
                    <div class="mb-2">
                        <span class="font-semibold">Semester ${sem.semester_number}:</span> ${parseFloat(sem.sgpa).toFixed(2)} SGPA
                    </div>
                `).join('')}
            </div>
        </div>
    </div>`;
    document.getElementById('print-resume-btn').addEventListener('click', () => window.print());
    },

    appearance: () => {
    const user = AppState.currentUser;
    const mainContent = document.getElementById('main-content');

    mainContent.innerHTML = `
    <div class="space-y-10 max-w-5xl mx-auto px-4 fade-in">
        <section class="card p-8 shadow-md rounded-xl bg-white dark:bg-gray-800">
            <h2 class="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Choose Your Theme</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="theme-selector">
                ${renderThemeOption("theme-light", "Light", "bg-slate-100 border-slate-300")}
                ${renderThemeOption("theme-dark", "Dark", "bg-slate-900 border-slate-700")}
                ${renderThemeOption("theme-ocean", "Ocean", "bg-blue-50 border-blue-200")}
                ${renderThemeOption("theme-nebula", "Nebula", "bg-gradient-to-br from-indigo-900 to-purple-900 border-purple-700")}
            </div>
        </section>

        <section class="card p-8 shadow-md rounded-xl bg-white dark:bg-gray-800">
            <h2 class="text-3xl font-bold mb-4 text-gray-800 dark:text-white">Font Style</h2>
            <p class="text-gray-500 dark:text-gray-300 mb-6">Choose a font that suits your style.</p>
            <label for="font-selector" class="sr-only">Select Font</label>
            <select id="font-selector" class="form-input w-full max-w-sm rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
                <option value="font-inter" ${user.font === 'font-inter' ? 'selected' : ''}>Inter (Default)</option>
                <option value="font-roboto-mono" ${user.font === 'font-roboto-mono' ? 'selected' : ''}>Roboto Mono (Tech)</option>
                <option value="font-lora" ${user.font === 'font-lora' ? 'selected' : ''}>Lora (Elegant)</option>
            </select>
        </section>
    </div>
    `;

    function renderThemeOption(theme, label, classes) {
        return `
        <div class="theme-option cursor-pointer p-4 border-2 rounded-lg hover:shadow-md transition duration-200" data-theme="${theme}" aria-label="Select ${label} theme">
            <div class="w-full h-12 ${classes} rounded-md mb-2"></div>
            <h3 class="font-semibold text-center text-gray-700 dark:text-gray-200">${label}</h3>
        </div>`;
    }
}

};