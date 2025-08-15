/* ===== Message Box Function ===== */
function showMessage(msg, type = "success") {
    const box = document.createElement('div');
    box.textContent = msg;
    box.className = `message-box ${type}`;
    document.body.appendChild(box);
    setTimeout(() => { box.remove(); }, 3000);
}

/* ===== Cached Elements ===== */
const auth = document.getElementById('auth');
const mainSite = document.getElementById('mainSite');
const loginBox = document.getElementById('loginBox');
const registerBox = document.getElementById('registerBox');
const logoutBtn = document.getElementById('logoutBtn');

const confirmBtn = document.getElementById("confirmBtn");
const orderPopup = document.getElementById("orderPopup");
const closePopup = document.getElementById("closePopup");
const finalConfirmBtn = document.getElementById("finalConfirmBtn");

const popupCustNameInput = document.getElementById("popupCustNameInput");
const popupCustContactInput = document.getElementById("popupCustContactInput");
const popupOrderDateInput = document.getElementById("popupOrderDateInput");
const popupFoodInput = document.getElementById("popupFoodInput");
const popupQtyInput = document.getElementById("popupQtyInput");

const ordersTableBody = document.getElementById("ordersTableBody");

/* ===== Predefined Admin Account ===== */
let users = JSON.parse(localStorage.getItem('users')) || [];
if (!users.some(u => u.username === 'admin')) {
    users.push({ username: 'admin', password: 'admin12345', phone:'', address:'', isAdmin: true });
    localStorage.setItem('users', JSON.stringify(users));
}

/* ===== Logout ===== */
logoutBtn.addEventListener("click", () => {
    localStorage.removeItem('currentUser');
    mainSite.style.display = "none";
    auth.style.display = "flex";
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    showSection('dashboards');
    showMessage("You have been logged out.", "success");
});

/* ===== Auth Logic ===== */
window.onload = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if(currentUser){
        showMainSite();
    } else {
        auth.style.display = 'flex';
        mainSite.style.display = 'none';
    }
};

function toggleAuth() {
    loginBox.style.display = loginBox.style.display === 'none' ? 'block' : 'none';
    registerBox.style.display = registerBox.style.display === 'none' ? 'block' : 'none';
}

function register() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const address = document.getElementById('regAddress').value.trim();

    if(!username || !password || !phone || !address){
        showMessage('Please fill all fields', 'error');
        return;
    }

    let users = JSON.parse(localStorage.getItem('users')) || [];
    if(users.some(u => u.username === username)){
        showMessage('Username already exists', 'error');
        return;
    }

    users.push({username, password, phone, address, isAdmin: false});
    localStorage.setItem('users', JSON.stringify(users));
    showMessage('Registered successfully! Please login.', 'success');
    toggleAuth();
}

function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    let users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.username === username && u.password === password);

    if(user){
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainSite();
        showMessage(`Welcome, ${username}!`, 'success');

        // Hide inventory tab if not admin
        const inventoryBtn = document.querySelector('a.nav-btn[href="#"][onclick*="inventory"]');
        if(!user.isAdmin) inventoryBtn.style.display = 'none';
        else inventoryBtn.style.display = 'inline-flex';
    } else {
        showMessage('Invalid credentials', 'error');
    }
}

function showMainSite() {
    auth.style.display = 'none';
    mainSite.style.display = 'block';
    showSection('dashboards');
    populateOrders();
}

/* ===== Navigation ===== */
function showSection(section, e){
    if(section === 'inventory'){
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if(!currentUser.isAdmin){
            showMessage("Access denied. Only admin can view inventory.", "error");
            return;
        }
    }

    document.querySelectorAll('main, .container, .view-container, .dashboard-container').forEach(s => s.style.display = 'none');
    document.getElementById(section).style.display = section === 'inventory' ? 'flex' : 'block';
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    if(e) e.currentTarget.classList.add('active');
    else document.querySelector('.nav-btn').classList.add('active'); // fallback
}

/* ===== Orders Logic ===== */
confirmBtn.addEventListener("click", () => {
    const custName = document.getElementById("custName").value.trim();
    const custContact = document.getElementById("custContact").value.trim();
    const orderDate = document.getElementById("orderDate").value;
    const foodSelect = document.getElementById("foodSelect").value;
    const orderQty = document.getElementById("orderQty").value;

    if(!custName || !custContact || !orderDate || !foodSelect || !orderQty){
        showMessage("Please fill out all fields.", "error");
        return;
    }

    // Fill popup inputs
    popupCustNameInput.value = custName;
    popupCustContactInput.value = custContact;
    popupOrderDateInput.value = orderDate;
    popupFoodInput.value = foodSelect;
    popupQtyInput.value = orderQty;

    orderPopup.style.display = "flex";

    // Add new order
    finalConfirmBtn.onclick = function () {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const order = { 
            custName: popupCustNameInput.value,
            custContact: popupCustContactInput.value,
            orderDate: popupOrderDateInput.value,
            food: popupFoodInput.value,
            quantity: popupQtyInput.value
        };

        const orders = JSON.parse(localStorage.getItem(currentUser.username + "_orders")) || [];
        orders.push(order);
        localStorage.setItem(currentUser.username + "_orders", JSON.stringify(orders));

        // Clear form
        document.getElementById('custName').value = '';
        document.getElementById('custContact').value = '';
        document.getElementById('orderDate').value = '';
        document.getElementById('foodSelect').value = '';
        document.getElementById('orderQty').value = '';

        showSection('vieworder');
        populateOrders();
        orderPopup.style.display = "none";
        showMessage("Order placed successfully!", "success");
    };
});

closePopup.addEventListener("click", () => {
    orderPopup.style.display = "none";
});

window.addEventListener("click", (e) => {
    if(e.target === orderPopup) {
        orderPopup.style.display = "none";
    }
});

/* ===== Populate Orders with Edit/Delete ===== */
function populateOrders() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const priceList = {
        "Tapsilog": 80, "Longsilog": 75, "Maling silog": 70,
        "Hotsilog": 65, "Silog": 60, "Bangus silog": 85, "Porksilog": 90
    };

    const orders = JSON.parse(localStorage.getItem(currentUser.username + "_orders")) || [];
    ordersTableBody.innerHTML = '';

    if (orders.length === 0) {
        ordersTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#0c2d68;">No orders yet.</td></tr>`;
    } else {
        orders.forEach((order, index) => {
            const foodName = order.food || "Unknown";
            const qty = parseInt(order.quantity) || 0;
            const amount = (priceList[foodName] || 0) * qty;
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${order.orderDate || "-"}</td>
                <td>${order.custName || "-"}</td>
                <td>${order.custContact || "-"}</td>
                <td>${foodName}</td>
                <td>${qty}</td>
                <td>${amount.toFixed(2)}</td>
                <td>Pending</td>
                <td>
                    <button onclick="editOrder(${index})" style="background:#ffc107;color:black;padding:4px 8px;border:none;border-radius:4px;cursor:pointer;">Edit</button>
                    <button onclick="deleteOrder(${index})" style="background:#dc3545;color:white;padding:4px 8px;border:none;border-radius:4px;cursor:pointer;">Delete</button>
                </td>
            `;
            ordersTableBody.appendChild(tr);
        });
    }
}

/* ===== Edit & Delete Functions ===== */
function editOrder(index) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const orders = JSON.parse(localStorage.getItem(currentUser.username + "_orders")) || [];
    const order = orders[index];

    // Fill popup inputs
    popupCustNameInput.value = order.custName;
    popupCustContactInput.value = order.custContact;
    popupOrderDateInput.value = order.orderDate;
    popupFoodInput.value = order.food;
    popupQtyInput.value = order.quantity;

    orderPopup.style.display = "flex";

    // Override finalConfirmBtn to save edits
    finalConfirmBtn.onclick = function () {
        orders[index] = {
            custName: popupCustNameInput.value,
            custContact: popupCustContactInput.value,
            orderDate: popupOrderDateInput.value,
            food: popupFoodInput.value,
            quantity: popupQtyInput.value
        };
        localStorage.setItem(currentUser.username + "_orders", JSON.stringify(orders));
        orderPopup.style.display = "none";
        populateOrders();
        showMessage("Order updated successfully!", "success");
    };
}

function deleteOrder(index) {
    if (!confirm("Are you sure you want to delete this order?")) return;
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let orders = JSON.parse(localStorage.getItem(currentUser.username + "_orders")) || [];
    orders.splice(index, 1);
    localStorage.setItem(currentUser.username + "_orders", JSON.stringify(orders));
    populateOrders();
    showMessage("Order deleted successfully!", "success");
}
