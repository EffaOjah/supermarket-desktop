const activationForm = document.getElementById('activationForm');
const statusMessage = document.getElementById('statusMessage');
const activateDiv1 = document.getElementById('activateDiv1');
const activateDiv2 = document.getElementById('activateDiv2');
const syncProgress = document.getElementById('syncProgress');
const syncTitle = document.getElementById('syncTitle');
const statusText = document.getElementById('status');
const theBtn = document.getElementById('theBtn');

// Base URL for API
const API_BASE_URL = 'https://web.marybillconglomerate.com.ng/storeApi';

if (theBtn) {
    theBtn.addEventListener('click', getProducts);
}

activationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusMessage.innerHTML = `
        <div class="alert alert-primary border-0 shadow-sm d-flex align-items-center justify-content-center py-2 mb-0" role="alert">
            <div class="spinner-border spinner-border-sm me-2" role="status"></div>
            <div class="fw-medium fst-italic">Verifying software license...</div>
        </div>
    `;

    const activationKey = e.target.key.value;

    try {
        console.log('Sending activation request for key:', activationKey);
        const response = await fetch(`${API_BASE_URL}/activate-software?activation_key=${activationKey}`);

        if (!response.ok) throw new Error("Server communication failed");

        const data = await response.json();
        console.log('Response data:', data);

        if (!data.success) {
            statusMessage.innerHTML = `
                <div class="alert alert-danger border-0 shadow-sm d-flex align-items-center justify-content-center py-3 mb-0" role="alert">
                    <i class="bi bi-x-circle-fill fs-5 me-2"></i>
                    <div class="fw-bold text-center">Invalid Activation Key!<br><small class="fw-normal">Please check and try again.</small></div>
                </div>
            `;
            return;
        }

        console.log('Software successfully activated', data);

        let branchName = data.checkForBranch[0].branch_name;
        // Legacy mappings
        if (branchName === 'CALABAR SOUTH') branchName = 'MARYBILL MABILCO VENTURES';
        if (branchName === 'TINAPA') branchName = 'MABILCO ENTERPRISE';

        // Update local software state
        await window.electronAPI.activateSoftware(data.checkForBranch[0].branch_id, branchName);

        // Switch to progress view
        activateDiv1.classList.add('d-none');
        activateDiv2.classList.remove("d-none");

        getProducts();

    } catch (err) {
        console.error('Activation error:', err);
        statusMessage.innerHTML = `
            <div class="alert alert-warning border-0 shadow-sm d-flex align-items-center justify-content-center py-3 mb-0" role="alert">
                <i class="bi bi-wifi-off fs-5 me-2"></i>
                <div class="fw-bold text-center">Connection Error!<br><small class="fw-normal">Please check your internet and try again.</small></div>
            </div>
        `;
    }
});

async function getProducts() {
    statusText.style.color = 'var(--text-secondary)';
    statusText.innerHTML = 'Connecting to server...';
    document.getElementById('taBtn').classList.add('d-none');
    updateProgress(5);

    try {
        const response = await fetch(`${API_BASE_URL}/get-all-products`);
        if (!response.ok) throw new Error("Failed to fetch products");

        const data = await response.json();
        if (!data.products || data.products.length === 0) {
            throw new Error("No products found for this branch");
        }

        updateProgress(20);
        statusText.innerHTML = `Found ${data.products.length} products. Provisioning...`;

        const total = data.products.length;
        let processed = 0;

        // Process products in chunks to avoid blocking and show progress
        for (const product of data.products) {
            await window.sqlite.storeManager(
                'stockBranch',
                product.product_id,
                product.product_name,
                product.wholesale_cost_price,
                product.wholesale_selling_price,
                product.retail_cost_price,
                product.retail_selling_price,
                0, // Initial stocking qty
                0,
                product.supplier_id,
                product.category
            );

            processed++;
            const progress = Math.floor(20 + (processed / total) * 70);
            updateProgress(progress);
            statusText.innerHTML = `Syncing: ${product.product_name} (${processed}/${total})`;
        }

        statusText.innerHTML = 'Finalizing setup...';
        updateProgress(95);

        // Update sync timestamp
        const lastProduct = data.products[data.products.length - 1];
        const date = new Date(lastProduct.date_modified);
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

        await window.sqlite.storeManager('updateLastSyncedDate', formattedDate);

        updateProgress(100);
        statusText.innerHTML = 'Setup complete! Redirecting...';

        setTimeout(() => {
            window.pageRedirect.redirect('./pages/signin.html');
        }, 1000);

    } catch (err) {
        console.error('Sync error:', err);
        statusText.style.color = 'var(--danger-color)';
        statusText.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-1"></i> ${err.message || 'Sync failed'}`;
        document.getElementById('taBtn').classList.remove('d-none');
    }
}

function updateProgress(percent) {
    if (syncProgress) {
        syncProgress.style.width = `${percent}%`;
        syncProgress.setAttribute('aria-valuenow', percent);
    }
}

// Set App Version on load
document.addEventListener('DOMContentLoaded', async () => {
    if (window.electronAPI && window.electronAPI.getAppVersion) {
        const appVersion = await window.electronAPI.getAppVersion();
        const versionEls = document.querySelectorAll('.app-version');
        versionEls.forEach(el => el.innerText = appVersion);
    }
});
