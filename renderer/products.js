var productList;

const productsHolder = document.getElementById("productsHolder");
const detailsHolder = document.getElementById("detailsHolder");

document.addEventListener("DOMContentLoaded", async () => {
  productList = await window.sqlite.storeManager("allProducts");

  console.log("Products: ", productList);
  loadProducts();
});

// Function to load products
// function loadProducts() {
//   // Group the products by supplier
//   const grouped = productList.reduce((acc, product) => {
//     const { name } = product;
//     if (!acc[name]) {
//       acc[name] = [];
//     }
//     acc[name].push(product);
//     return acc;
//   }, {});

//   console.log(grouped);

//   for (const name in grouped) {
//     const products = grouped[name];

//     const newDiv = document.createElement("div");
//     newDiv.innerHTML = `
//       <div class="bg-secondary rounded h-100 p-4">
//         <h6 class="mb-4">${name}</h6>
//         <div class="table-responsive">
//           <table class="table text-start align-middle table-bordered table-hover mb-0">
//             <thead>
//               <tr class="text-white">
//                 <th scope="col"><input class="form-check-input" type="checkbox"></th>
//                 <th scope="col">S/N</th>
//                 <th scope="col">Product name</th>
//                 <th scope="col">Category</th>
//                 <th scope="col">Wholesale price</th>
//                 <th scope="col">Wholesale Quantity</th>
//                 <th scope="col">Retail price</th>
//                 <th scope="col">Retail Quantity</th>
//                 <th scope="col">Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${products
//                 .map(
//                   (product, index) => `
//                 <tr>
//                   <td><input class="form-check-input" type="checkbox"></td>
//                   <td>${index + 1}</td>
//                   <td>${product.product_name}</td>
//                   <td>${product.category}</td>
//                   <td>₦${product.wholesale_price}</td>
//                   <td>${product.stock_quantity_wholesale}</td>
//                   <td>₦${product.retail_price}</td>
//                   <td>${product.stock_quantity_retail}</td>
//                   <td><a id="${
//                     product.product_id
//                   }" class="btn btn-sm btn-light view-sales-btn" data-bs-toggle="modal"
//                       data-bs-target="#allsales">All sales</a></td>
//                 </tr>
//               `
//                 )
//                 .join("")}
//             </tbody>
//           </table>
//         </div>
//       </div>`;

//     productsHolder.appendChild(newDiv);
//   }

//   // productList.forEach(product => {
//   //     console.log(product);

//   // });
//   // for (let i = 0; i < productList.length; i++) {
//   //     if (productList[i].category == 'Peak Evaporated Milk') {
//   //         console.log(`${productList[i].category}: ${productList[i]}`);

//   //         const tr = document.createElement('tr');
//   //         tr.innerHTML = `<td><input class="form-check-input" type="checkbox"></td>
//   //                   <td>Peak Evm Reg Can</td>
//   //                   <td>24x150g</td>
//   //                   <td>150</td>
//   //                   <td>₦40,000</td>
//   //                   <td>₦300,000</td>
//   //                   <td><a href="#" class="btn btn-sm btn-primary" data-bs-toggle="modal"
//   //                       data-bs-target="#myModal">Detail</a></td>
//   //                   <td><a href="#" class="btn btn-sm btn-light" data-bs-toggle="modal"
//   //                       data-bs-target="#allsales">All sales</a></td>`

//   //                       tbody.appendChild(tr);
//   //     }
//   // }

//   // grouped.map(product => {
//   //   if (product.category == product.category) {
//   //     const newDiv = document.createElement('newDiv');
//   //     newDiv.innerHTML = `<div class="bg-secondary rounded h-100 p-4">
//   //             <h5 class="mb-4">Product Record</h5>
//   //             <h6 class="mb-4">${product.category}</h6>
//   //             <div class="table-responsive">
//   //               <table class="table text-start align-middle table-bordered table-hover mb-0">
//   //                 <thead>
//   //                   <tr class="text-white">
//   //                     <th scope="col"><input class="form-check-input" type="checkbox"></th>
//   //                     <th scope="col">Product name</th>
//   //                     <th scope="col">Size</th>
//   //                     <th scope="col">Quantity</th>
//   //                     <th scope="col">Current Price</th>
//   //                     <th scope="col">Wholesale price</th>
//   //                     <th scope="col">View</th>
//   //                     <th scope="col">Action</th>
//   //                   </tr>
//   //                 </thead>
//   //                 <tbody id="tbody">
//   //                   <tr>
//   //                     <td><input class="form-check-input" type="checkbox"></td>
//   //                     <td>${product.product_name}</td>
//   //                     <td>${product.category}</td>
//   //                     <td>${product.stock_quantity_wholesale}</td>
//   //                     <td>${product.wholesale_price}</td>
//   //                     <td>${product.retail_price}</td>
//   //                     <td><a href="#" class="btn btn-sm btn-primary" data-bs-toggle="modal"
//   //                         data-bs-target="#myModal">Detail</a></td>
//   //                     <td><a href="#" class="btn btn-sm btn-light" data-bs-toggle="modal"
//   //                         data-bs-target="#allsales">All sales</a></td>
//   //                   </tr>
//   //                 </tbody>
//   //               </table>
//   //             </div>
//   //           </div>`

//   //     productsHolder.appendChild(newDiv);
//   //   }

//   // });
// }

function loadProducts() {
  productsHolder.innerHTML = `<h5 class="mb-4">Product Record</h5>`;

  const grouped = productList.reduce((acc, product) => {
    const { name } = product;
    if (!acc[name]) {
      acc[name] = [];
    }
    acc[name].push(product);
    return acc;
  }, {});

  for (const name in grouped) {
    const products = grouped[name];

    const newDiv = document.createElement("div");
    newDiv.classList.add('supplier-group');
    newDiv.innerHTML = `
      <div class="bg-secondary rounded h-100 p-4">
        <h6 class="mb-4">${name}</h6>
        <div class="table-responsive">
          <table class="table text-start align-middle table-bordered table-hover mb-0">
            <thead>
              <tr class="text-white">
                <th scope="col"><input class="form-check-input" type="checkbox"></th>
                <th scope="col">S/N</th>
                <th scope="col">Product name</th>
                <th scope="col">Category</th>
                <th scope="col">Wholesale price</th>
                <th scope="col">Wholesale Quantity</th>
                <th scope="col">Retail price</th>
                <th scope="col">Retail Quantity</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              ${products
                .map(
                  (product, index) => `
                <tr class="product-row" data-name="${product.product_name.toLowerCase()}">
                  <td><input class="form-check-input" type="checkbox"></td>
                  <td>${index + 1}</td>
                  <td>${product.product_name}</td>
                  <td>${product.category}</td>
                  <td>₦${product.wholesale_price}</td>
                  <td>${product.stock_quantity_wholesale}</td>
                  <td>₦${product.retail_price}</td>
                  <td>${product.stock_quantity_retail}</td>
                  <td><a id="${
                    product.product_id
                  }" class="btn btn-sm btn-light view-sales-btn" data-bs-toggle="modal"
                      data-bs-target="#allsales">All sales</a></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>`;

    productsHolder.appendChild(newDiv);
  }
}


async function loadProductSales(productId) {
  const productSales = await window.sqlite.storeManager(
    "productSales",
    productId
  );
  console.log("Product Sales; ", productSales);

  if (productSales.length < 1) {
    console.log("No sales has been recorded!");
    detailsHolder.innerHTML = `<p>No Sales has been recorded!</p>`;
  } else {
    detailsHolder.innerHTML = `
      <div class="table-responsive mb-4">
                  <table id="productsTable" class="table table-bordered">
                    <thead class="table-dark">
                      <tr>
                        <th>S/N</th>
                        <th>Date</th>
                        <th>Quantity Sold</th>
                        <th>Sale Type</th>
                        <th>Price per Unit</th>
                        <th>Total</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                    ${productSales
                      .map(
                        (product, index) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td>${new Date(product.sales_date).toDateString()}</td>
                        <td>${product.quantity}</td>
                        <td>${product.sale_type}</td>
                        <td>₦${product.unit_price}</td>
                        <td>₦${product.unit_price * product.quantity}</td>
                        <td><a id="${product.product_id}:${
                          product.sale_id
                        }" class="btn btn-sm btn-light view-invoice-btn" data-bs-toggle="modal"
                      data-bs-target="#invoiceModal">View invoice</a></td>
                      </tr>
                  `
                      )
                      .join("")}
                    </tbody>
                  </table>
                </div>
    `;
  }
}

/* Event Delegation */
// Attach a single event listener to the parent
productsHolder.addEventListener("click", (event) => {
  if (event.target.classList.contains("view-sales-btn")) {
    loadProductSales(event.target.id);
  }
});

detailsHolder.addEventListener("click", (event) => {
  if (event.target.classList.contains("view-invoice-btn")) {
    const id = event.target.id;
    let split = id.split(":");

    viewSaleInvoice(split[1]);
  }
});

// Function to show invoice
async function viewSaleInvoice(saleId) {
  const invoiceHolder = document.getElementById("invoiceHolder");

  invoiceHolder.innerHTML = "";

  let saleDetails = await window.sqlite.storeManager(
    "getSaleItemsByProductId",
    saleId
  );
  console.log(saleDetails);

  const newDiv = document.createElement("div");
  newDiv.innerHTML = `
        <table id="saleDetailTable" class="table table-bordered invoice-details">
                      <thead>
                        <tr>
                          <th>ITEMS</th>
                          <th>PURCHASE TYPE</th>
                          <th>QUANTITY</th>
                          <th>PRICE</th>
                          <th>SUB TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${saleDetails
                          .map(
                            (sale) => `
                          <tr>
                          <td>${sale.product_name}</td>
                          <td>${sale.sale_type}</td>
                          <td>${sale.quantity}</td>
                          <td>₦${sale.unit_price}</td>
                          <td>${sale.quantity * sale.unit_price}</td>
                          </tr>
        
                          `
                          )
                          .join("")}
                      </tbody>
          </table>
          <p class="fs-6 text-end">Total: ${saleDetails[0].total_amount}</p>`;

  invoiceHolder.appendChild(newDiv);
}

function filterProducts(searchTerm) {
  const supplierGroups = document.querySelectorAll(".supplier-group");

  supplierGroups.forEach((group) => {
    const rows = group.querySelectorAll(".product-row");
    let hasVisibleRow = false;

    rows.forEach((row) => {
      const productName = row.dataset.name;
      if (productName.includes(searchTerm.toLowerCase())) {
        row.style.display = "";
        hasVisibleRow = true;
      } else {
        row.style.display = "none";
      }
    });

    // Hide or show the whole group based on row visibility
    group.style.display = hasVisibleRow ? "" : "none";
  });
}


const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
  filterProducts(searchInput.value.trim());
});