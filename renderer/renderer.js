const signinForm = document.getElementById('signinForm');

signinForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = {
        username: e.target.username.value,
        password: e.target.password.value,
    };

    console.log(data);

    window.electronStore.login(data.username, data.password).then((result) => {
        console.log(result);

        if (result.success === false) {
            return window.electronAPI.errorDialog('Invalid credentials', result.message);
        }

        window.electronStore.getProtectedData().then((result) => {
            console.log(result);

            // redirect the user based on the user's role
            if (result.decoded.role == 'salesRep') {
                // Redirect the user
                window.pageRedirect.redirect('./pages/index.html');
            } else {
                // Redirect the user
                window.pageRedirect.redirect('./pages/index.html');
            }
        });
    });
});

// Check for updates
const checkUpdateBtn = document.getElementById('checkUpdateBtn');
if (checkUpdateBtn) {
    checkUpdateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Checking for updates...');
        window.electronAPI.checkForUpdates();

        // Visual feedback
        const originalText = checkUpdateBtn.innerHTML;
        checkUpdateBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Checking...';
        checkUpdateBtn.classList.add('text-muted');
        checkUpdateBtn.style.pointerEvents = 'none';

        setTimeout(() => {
            checkUpdateBtn.innerHTML = originalText;
            checkUpdateBtn.classList.remove('text-muted');
            checkUpdateBtn.style.pointerEvents = 'auto';
        }, 3000);
    });
}

// Set App Version on load
document.addEventListener('DOMContentLoaded', async () => {
    if (window.electronAPI && window.electronAPI.getAppVersion) {
        const appVersion = await window.electronAPI.getAppVersion();
        const versionEls = document.querySelectorAll('.app-version');
        versionEls.forEach(el => el.innerText = appVersion);
    }
});