// Simple SPA Router for Marybill Conglomerate Dashboard
(function () {
    'use strict';

    // Global version population function
    window.populateAppVersion = async () => {
        if (!window.electronAPI || !window.electronAPI.getAppVersion) return;
        try {
            const appVersion = await window.electronAPI.getAppVersion();
            const versionEls = document.querySelectorAll('.app-version');
            versionEls.forEach(el => el.innerText = appVersion);
        } catch (err) {
            console.error("Failed to populate app version:", err);
        }
    };

    // Route configuration
    const routes = {
        'dashboard': '../pages/routes/dashboard.html',
        'new-sale': '../pages/routes/new-sale.html',
        'products': '../pages/routes/products.html',
        'customers': '../pages/routes/customers.html',
        'sales-history': '../pages/routes/sales-history.html',
        'stocking': '../pages/routes/stocking.html'
    };

    // Default route
    const defaultRoute = 'dashboard';

    // Get content container
    const contentContainer = document.getElementById('app-content');

    // Load page content
    async function loadPage(pageName) {
        const route = routes[pageName];

        if (!route) {
            console.error(`Route not found: ${pageName}`);
            pageName = defaultRoute;
        }

        try {
            const response = await fetch(routes[pageName]);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            contentContainer.innerHTML = html;

            // Update active nav link
            updateActiveNav(pageName);

            // Update page title
            updatePageTitle(pageName);

            // Page specific initialization
            if (pageName === 'new-sale' && window.initNewSale) {
                window.initNewSale();
            } else if (pageName === 'dashboard' && window.initDashboard) {
                window.initDashboard();
            } else if (pageName === 'customers' && window.initCustomers) {
                window.initCustomers();
            } else if (pageName === 'sales-history' && window.initSales) {
                window.initSales();
            } else if (pageName === 'stocking' && window.initStocking) {
                window.initStocking();
            } else if (pageName === 'products' && window.initProducts) {
                window.initProducts();
            }

            // Close sidebar on mobile after navigation
            closeSidebarOnMobile();

            // Populate app version on the newly loaded page
            if (window.populateAppVersion) {
                window.populateAppVersion();
            }

            // Trigger immediate sync to refresh data for the current page
            if (window.SyncService) {
                window.SyncService.syncAll();
            }

        } catch (error) {
            console.error('Error loading page:', error);
            contentContainer.innerHTML = `
        <div class="content-wrapper">
          <div class="alert alert-danger">
            <h4>Error Loading Page</h4>
            <p>Could not load the requested page. Please try again.</p>
          </div>
        </div>
      `;
        }
    }

    // Update active navigation link
    function updateActiveNav(pageName) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current page link
        const activeLink = document.querySelector(`[data-page="${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Update page title
    function updatePageTitle(pageName) {
        const titles = {
            'dashboard': 'Dashboard',
            'new-sale': 'New Sale',
            'products': 'Products',
            'customers': 'Customers',
            'sales-history': 'Sales History',
            'stocking': 'Stocking'
        };

        document.title = `${titles[pageName] || 'Dashboard'} | Marybill Conglomerate`;
    }

    // Close sidebar on mobile after navigation
    function closeSidebarOnMobile() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && window.innerWidth < 992) {
            sidebar.classList.remove('active');
        }
    }

    // Handle hash change
    function handleHashChange() {
        let hash = window.location.hash.slice(1); // Remove #
        if (!hash || !routes[hash]) {
            hash = defaultRoute;
            window.location.hash = hash;
        }
        loadPage(hash);
    }

    // Initialize router
    function init() {
        // Listen for hash changes
        window.addEventListener('hashchange', handleHashChange);

        // Load initial page
        handleHashChange();
    }

    // Start router when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
