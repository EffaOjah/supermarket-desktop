const signinForm = document.getElementById('signinForm');

signinForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = {
        username: e.target.username.value,
        password: e.target.password.value,
        role: e.target.role.value,
    };

    console.log(data);

    window.electronStore.login(data.username, data.password, data.role).then((result) => {
        console.log(result);

        if (result.success === false) {
            return window.electronAPI.errorDialog('Invalid credentials', result.message);
        }

        window.electronStore.getProtectedData().then((result) => {
            console.log(result);

            // redirect the user based on the user's role
            if (result.decoded.role == 'salesRep') {
                // Redirect the user
                window.pageRedirect.redirect('./pages/new sale.html');
            } else {
                // Redirect the user
                window.pageRedirect.redirect('./pages/products(admin).html');
            }
        });
    });
});

// document.getElementById('setBTN').addEventListener('click', () => {
//     window.electronStore.manualSet().then((result) => {
//         console.log(result);
//     });
// });

// document.getElementById('testBTN').addEventListener('click', () => {
//     window.electronStore.getProtectedData().then((result) => {
//         console.log(result);

//         window.pageRedirect.redirect('./pages/index.html');
//     });
// });
