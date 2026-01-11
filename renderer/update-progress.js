const progressBar = document.getElementById("progressBar");
const statusText = document.getElementById("statusText");

if (window.electronAPI) {
    window.electronAPI.onUpdateProgress((percent) => {
        // In Squirrel.Windows, percent might not be available consistently.
        // We'll show a "Downloading and preparing installation..." status.
        if (progressBar) {
            progressBar.classList.add('progress-bar-animated');
            progressBar.style.width = "75%"; // Indeterminate-ish
        }
        if (statusText) {
            statusText.innerHTML = `
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                <span>Downloading & preparing installation...</span>
            `;
        }
    });

    window.electronAPI.onUpdateDownloaded(() => {
        if (progressBar) {
            progressBar.style.width = "100%";
            progressBar.classList.remove('progress-bar-animated');
            progressBar.classList.add('bg-success');
        }
        if (statusText) {
            statusText.innerHTML = `
                <i class="bi bi-check-circle-fill text-success me-2"></i>
                <span class="text-success fw-bold">Download Complete. Restarting...</span>
            `;
        }
    });
}
