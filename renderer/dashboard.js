(function () {
    'use strict';

    window.initDashboard = async function () {
        console.log("Initializing Dashboard...");

        try {
            // 1. Salutation & Date
            updateHeader();

            // 2. Load Stats
            await loadStats();

        } catch (err) {
            console.error("Dashboard initialization failed:", err);
        }
    };

    function updateHeader() {
        const greetingEl = document.getElementById("dashboardGreeting");
        const dateEl = document.getElementById("dashboardDate");

        if (!greetingEl || !dateEl) return;

        const now = new Date();
        const hour = now.getHours();
        let greeting = "Good Evening";

        if (hour < 12) greeting = "Good Morning";
        else if (hour < 17) greeting = "Good Afternoon";

        // Attempt to get user name
        window.electronStore.getProtectedData().then(result => {
            const userName = result.decoded && result.decoded.username ? result.decoded.username : "User";
            greetingEl.innerText = `${greeting}, ${userName.charAt(0).toUpperCase() + userName.slice(1)}`;
        }).catch(() => {
            greetingEl.innerText = `${greeting}, User`;
        });

        dateEl.innerText = `Here's what's happening today, ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    async function loadStats() {
        const stats = await window.sqlite.storeManager("getDashboardStats");
        if (!stats) return;

        const salesEl = document.getElementById("statsDailySales");
        const transEl = document.getElementById("statsTransactions");
        const lowStockEl = document.getElementById("statsLowStock");

        if (salesEl) salesEl.innerText = `₦${Number(stats.dailySales).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        if (transEl) transEl.innerText = stats.transactions;
        if (lowStockEl) {
            lowStockEl.innerText = `${stats.lowStock} Items`;
            if (stats.lowStock > 0) lowStockEl.classList.add("text-danger");
            else lowStockEl.classList.remove("text-danger");
        }
    }

})();
