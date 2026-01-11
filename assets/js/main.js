const sidebar = document.querySelector(".sidebar");
const menuToggle = document.querySelector(".menu-toggle");

if (menuToggle) {
    menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("active");
    });
}

const closeBtn = document.querySelector(".sidebar-close-btn");
if (closeBtn) {
    closeBtn.addEventListener("click", () => {
        sidebar.classList.remove("active");
    });
}

var branchName;
document.addEventListener('DOMContentLoaded', async () => {
    const branchDetails = await window.electronAPI.getSoftwareDetails();
    console.log('branchDetails :', branchDetails);

    branchName = branchDetails.branchName;
    document.getElementById('branchName').innerHTML = branchName;

    // Initialize background sync service
    if (window.SyncService) {
        window.SyncService.init();
    }
})

var navs = document.getElementsByClassName('navs');

for (let i = 0; i < navs.length; i++) {
    navs[i].addEventListener('click', (e) => {
        let pageName = e.currentTarget.innerText.toLowerCase().trim();

        window.pageRedirect.redirect(`./pages/${pageName}.html`);
    });
}

var signOutBtn = document.querySelector('.sign-out-nav');

signOutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    // Trigger the logout operation
    const logout = await window.electronStore.logout();

    const redirect = await window.pageRedirect.redirect(`./pages/login.html`);
});