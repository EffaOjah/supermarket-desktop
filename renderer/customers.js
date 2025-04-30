var customersList;

document.addEventListener('DOMContentLoaded', async () => {
    customersList = await window.sqlite.storeManager?.getCustomers();
    console.log(customersList);
   
    loadCustomers();
});

function loadCustomers() {
    const customersHolder = document.getElementById('customersHolder');
    customersHolder.innerHTML = '';
    
    customersList.map(customer => {
        let newDiv = document.createElement('div');
        newDiv.innerHTML = `<div class="d-flex align-items-center border-bottom py-3">
                <img class="rounded-circle flex-shrink-0 chUser1" src="../assets/img/user-01.jpg" alt="">
                <div class="w-100 ms-3">
                  <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-0">${customer.name}</h6>
                    <span>27th August <i class="fa fa-arrow"></i><a href="#" class="ms-3" data-bs-toggle="modal"
                        data-bs-target="#myModal">Edit</a>
                      <button class="btn btn-primary btn-sm ms-3" data-bs-toggle="modal"
                        data-bs-target="#customerModal">All sales</button>
                    </span>
                  </div>
                  <span>Nigeria</span>
                </div>
              </div>`

              customersHolder.appendChild(newDiv);
    });
}

const addCustomerForm = document.getElementById('addCustomerForm');

addCustomerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let data = {
        name: e.target.name.value,
        address: e.target.address.value,
        contact: e.target.contact.value,
    }

    console.log(data);

    // Insert the details 
    const addNewCustomer = window.sqlite.storeManager?.addCustomer(data.name, data.address, data.contact);
    console.log(addNewCustomer);
    
    if (window.functions.handleDBError(addNewCustomer.code)) {
        console.log('Error while executing db query: ', addNewCustomer.code, addNewCustomer.message);

        window.electronAPI.errorDialog('Server Error', 'An Error occured!');
        return;
    }

    alert('Successfully added customer!');

    customersList = await window.sqlite.storeManager?.getCustomers();
    loadCustomers();
});