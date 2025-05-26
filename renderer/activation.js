const activationForm = document.getElementById('activationForm');
const errorMessage = document.getElementById('errorMessage');

activationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    errorMessage.innerHTML = '';

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
                return errorMessage.innerHTML = 'Invalid activation key!';
            }
            
            console.log('Software successfully activated', data);

            // Update the software
            const updateSoftware = await window.electronAPI.activateSoftware(data.checkForBranch[0].branch_id, data.checkForBranch[0].branch_name);
            console.log(updateSoftware);
        })
        .catch((err) => {
            console.log('Error sending request: ', err);
            errorMessage.innerHTML = 'Please check your internet connection';
        });
});