document.addEventListener('DOMContentLoaded', async () => {
    const sales = await window.sqlite.storeManager?.getSales();

    document.getElementById('myUl').innerHTML = sales.map(el => `${el.name}`);

    for (let i = 0; i < sales.length; i++) {
        console.log(sales[i]);   
    }
});