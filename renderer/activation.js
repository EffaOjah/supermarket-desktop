const activationForm = document.getElementById('activationForm');
const statusMessage = document.getElementById('statusMessage');

const activateDiv1 = document.getElementById('activateDiv1');
const activateDiv2 = document.getElementById('activateDiv2');

const theBtn = document.getElementById('theBtn');
theBtn.addEventListener('click', getProducts);

activationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    statusMessage.innerHTML = 'verifying...';
    statusMessage.classList.add('fst-italic')

    const activationKey = e.target.key.value
    console.log(activationKey);

    // Send a request to the server
    fetch(`https://web.marybillconglomerate.com.ng/storeApi/activate-software?activation_key=${activationKey}`, {
        method: 'GET'
    })
        .then(response => {
            if (!response.ok) throw new Error("Server error");
            return response.json();
        })
        .then(async (data) => {
            if (!data.success) {
                console.log(data);
                statusMessage.style.color = 'red';
                return statusMessage.innerHTML = 'Invalid activation key!';
            }

            console.log('Software successfully activated', data);

            // Update the software
            const updateSoftware = await window.electronAPI.activateSoftware(data.checkForBranch[0].branch_id, data.checkForBranch[0].branch_name);

            // Show get products page
            activateDiv1.style.display = 'none';
            activateDiv2.classList.remove("d-none");

            getProducts();
        })
        .catch((err) => {
            console.log('Error sending request: ', err);
            statusMessage.style.color = 'red';
            statusMessage.innerHTML = 'Please check your internet connection';
        });
});

// Function to get products
async function getProducts() {
    document.getElementById('status').style.color = 'white';
    document.getElementById('status').innerHTML = 'please be patient...';

    try {
        const response = await fetch('https://web.marybillconglomerate.com.ng/storeApi/get-all-products');
        if (!response.ok) throw new Error("Server error");

        const data = await response.json();
        if (!data.products) {
            console.log('Could not get products');
            document.getElementById('status').style.color = 'red';
            document.getElementById('status').innerHTML = 'Could not get products!';
            document.getElementById('taBtn').classList.remove('d-none');
            return;
        }

        const storePromises = data.products.map(product => {
            console.log(product.product_name, product.product_id);
            return window.sqlite.storeManager(
                'stockBranch',
                product.product_id,
                product.product_name,
                product.wholesale_cost_price,
                product.wholesale_selling_price,
                product.retail_cost_price,
                product.retail_selling_price,
                0,
                0,
                product.supplier_id,
                product.category
            );
        });

        // Wait for all store operations to complete
        await Promise.all(storePromises);

        // Update the last synced date using the last product's date_modified
        const lastProduct = data.products[data.products.length - 1];

        // Original ISO string
        const isoString = lastProduct.date_modified;

        // Convert to a Date object
        const date = new Date(isoString);

        // Extract the date components (year, month, day, hours, minutes, seconds)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');  // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours() + 1).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        // Format the result as "YYYY-MM-DD HH:mm:ss"
        const result = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        console.log(result);



        const updateLastSyncedDate = await window.sqlite.storeManager('updateLastSyncedDate', result);
        console.log(updateLastSyncedDate);

        // Redirect the user
        window.pageRedirect.redirect('./pages/signin.html');

    } catch (err) {
        console.log('Error: ', err);
        document.getElementById('status').style.color = 'red';
        document.getElementById('status').innerHTML = 'Could not get products, please check your internet connection!';
        document.getElementById('taBtn').classList.remove('d-none');
    }
}
