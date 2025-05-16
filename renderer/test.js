
document.addEventListener('DOMContentLoaded', async () => {
    const customers = await window.sqlite.storeManager.getCustomers();
    console.log(customers);
})
