document.addEventListener('DOMContentLoaded', async () => {
    // Get today's date
    const date = new Date();
    let timeStamp = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    console.log('Date: ', timeStamp);

    // Get the analysis for today(Wholesale and Retail)
    const wholesaleAnalysisForToday = await window.sqlite.storeManager('getTodaySalesAnalysis', 'Wholesale', timeStamp);
    const retailAnalysisForToday = await window.sqlite.storeManager('getTodaySalesAnalysis', 'Retail', timeStamp);

    console.log(wholesaleAnalysisForToday);
    console.log(retailAnalysisForToday);

    // Update the html
    document.getElementById('wholesaleAmountToday').innerHTML = wholesaleAnalysisForToday[0].total ? (wholesaleAnalysisForToday[0].total).toLocaleString('en-US') : '0,00';
    document.getElementById('retailAmountToday').innerHTML = retailAnalysisForToday[0].total ? (retailAnalysisForToday[0].total).toLocaleString('en-US') : '0,00';
});