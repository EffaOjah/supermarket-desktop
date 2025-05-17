
document.addEventListener('DOMContentLoaded', async () => {
    const test = await window.functions.testFunction();
    console.log(test);
})
