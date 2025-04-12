const makeParticles = () => {
    const container = document.getElementById('particles');
    for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        p.style.width = `${Math.random() * 4 + 1}px`;
        p.style.height = p.style.width;
        p.style.animationDelay = `${Math.random() * 8}s`;
        container.appendChild(p);
    }
};

const addBtn = document.getElementById('newFileBtn');
const modal = document.getElementById('newProjectModal');
const cancelBtn = document.getElementById('cancelBtn');
const projectForm = document.getElementById('newProjectForm');
const CLIENT_ID = '0v231kX6jhn2dP4A';
const CLIENT_SECRET = '4b3948411b426495b285b7fb273eb33cb2';
const REDIRECT_URI = 'http://localhost:3000/callback';

addBtn.onclick = () => modal.style.display = 'flex';
cancelBtn.onclick = () => modal.style.display = 'none';
window.onclick = e => e.target === modal && (modal.style.display = 'none');

projectForm.onsubmit = async e => {
    e.preventDefault();
    const name = document.getElementById('projectName').value.trim();
    if (!name) return;

    const state = Math.random().toString(36).substring(2);
    localStorage.setItem('oauth_state', state);
    localStorage.setItem('project_name', name);
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=repo&state=${state}`;
};

const handleCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = localStorage.getItem('oauth_state');
    const name = localStorage.getItem('project_name');

    if (code && state && state === storedState && name) {
        try {
            const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    code,
                    redirect_uri: REDIRECT_URI
                })
            });

            if (!tokenResponse.ok) throw new Error('Token exchange failed');
            const { access_token } = await tokenResponse.json();
            if (!access_token) throw new Error('No access token received');

            const repoResponse = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    Accept: 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, private: false, auto_init: true })
            });

            if (!repoResponse.ok) throw new Error('Repo creation failed');
            const { html_url: githubUrl, full_name: githubRepo } = await repoResponse.json();

            const projects = JSON.parse(localStorage.getItem('byteblock-projects') || '[]');
            const project = {
                id: String(Date.now()),
                name,
                created: new Date().toISOString(),
                files: [],
                githubUrl,
                githubRepo
            };

            projects.push(project);
            localStorage.setItem('byteblock-projects', JSON.stringify(projects));
            localStorage.removeItem('oauth_state');
            localStorage.removeItem('project_name');

            window.location.href = `/project.html?id=${project.id}`;
        } catch (error) {
            console.error(error);
            alert('Failed to create GitHub repository');
        }
    }
};

const glowElem = document.querySelector('.glow');
const moveGlow = e => {
    glowElem.style.left = `${e.clientX}px`;
    glowElem.style.top = `${e.clientY}px`;
};

window.onload = () => {
    makeParticles();
    document.addEventListener('mousemove', moveGlow);
    if (window.location.pathname === '/callback') handleCallback();
};
