var suppliersList;

// Get all suppliers
document.addEventListener('DOMContentLoaded', async () => {
    suppliersList = await window.sqlite.storeManager('getSuppliers');
    console.log(suppliersList);
    
    loadSuppliers();
});

function loadSuppliers() {
    const newTbody = document.createElement('tbody');
    newTbody.innerHTML = `
        ${suppliersList.map((supplier, index) => `
            <tr>
                          <td><input class="form-check-input" type="checkbox"></td>
                          <td>${supplier.name}</td>
                          <td>${!supplier.address ? 'N/A' : supplier.address}</td>
                          <td>${!supplier.contact ? 'N/A' : supplier.contact}</td>
                          <td>${!supplier.email ? 'N/A' : supplier.email}</td>
                          <td><a id="${index + 1}" class="btn btn-sm w-100 btn-primary bg-btn view-products-btn" href="#" data-bs-toggle="modal"
                              data-bs-target="#productsSuppliedModal">View products</a></td>
                          <td><a class="btn btn-sm w-50 w-100 btn-primary bg-btn" href="#" data-bs-toggle="modal"
                              data-bs-target="#companyModal">About</a></td>
                        </tr>
        `).join('')}
    `

        document.getElementById('suppliersTable').append(newTbody);




    // suppliersList.map(supplier => {
    //     const tr = document.createElement('tr');
    //     tr.innerHTML = `
    //                   <td><input class="form-check-input" type="checkbox"></td>
    //                   <td>${supplier.name}</td>
    //                   <td>${supplier.address}</td>
    //                   <td>${supplier.contact}</td>
    //                   <td>${supplier.email}</td>
    //                   <td><a class="btn btn-sm w-100 btn-primary bg-btn" href="#" data-bs-toggle="modal"
    //                       data-bs-target="#companyModal">View products</a></td>
    //                   <td><a class="btn btn-sm w-50 w-100 btn-primary bg-btn" href="#" data-bs-toggle="modal"
    //                       data-bs-target="#companyModal">About</a></td>
    //                 `

    //                 suppliersTable.append(tr);
    // });
}


const addSupplierForm = document.getElementById('addSupplierForm');

addSupplierForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let data = {
        name: e.target.name.value,
        address: e.target.address.value,
        contact: e.target.contact.value,
        email: e.target.email.value,
    }

    console.log(data);

    // Insert the details 
    const addNewSupplier = window.sqlite.storeManager('addSupplier', data.name, data.address, data.contact, data.email);
    console.log(addNewSupplier);
    
    if (window.functions.handleDBError(addNewSupplier.code)) {
        console.log('Error while executing db query: ', addNewSupplier.code, addNewSupplier.message);

        window.electronAPI.errorDialog('Server Error', 'An Error occured!');
        return;
    }

    alert('Successfully added supplier!');

    suppliersList = await window.sqlite.storeManager('getSuppliers');
    loadSuppliers();
});

// Get products by a supplier
async function loadSupplierProducts(supplierId) {
    const products = await window.sqlite.storeManager('supplierProducts', supplierId);

    const holder2 = document.getElementById('holder2');
    
    // Check if there are products supplied
    if (products.length < 1) {
        holder2.innerHTML = '<p class="text-secondary">No Products Supplied</p>';
    } else {
        holder2.innerHTML = `
        <ol>
        ${products.map((product, index) => `
            <li class="text-secondary list-unstyled">${index + 1}.) ${product.product_name}</li>
        `).join('')}
                </ol>
        `
    }
}

/* Event Delegation */
// Attach a single event listener to the parent
document.getElementById('suppliersTable').addEventListener('click', (event) => {
    if (event.target.classList.contains('view-products-btn')) {
        loadSupplierProducts(event.target.id)
    }
});