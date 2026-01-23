/**
 * SeekerEats Admin Dashboard - JavaScript
 */

const API_BASE = '/admin/api';
let authToken = localStorage.getItem('admin_token');

// ============ UTILITY FUNCTIONS ============

async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      logout();
    }
    throw new Error(data.error || data.message || 'API Error');
  }

  return data;
}

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

function showPage(pageId) {
  $$('.page').forEach((p) => p.classList.add('hidden'));
  $(`#${pageId}-page`).classList.remove('hidden');

  $$('.nav-link').forEach((l) => l.classList.remove('active'));
  $(`.nav-link[data-page="${pageId}"]`)?.classList.add('active');
}

// ============ AUTH ============

async function login(password) {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();

    if (data.success) {
      authToken = data.token;
      localStorage.setItem('admin_token', authToken);
      showDashboard();
    } else {
      $('#login-error').textContent = 'Invalid password';
    }
  } catch (err) {
    $('#login-error').textContent = 'Login failed: ' + err.message;
  }
}

function logout() {
  authToken = null;
  localStorage.removeItem('admin_token');
  $('#login-screen').classList.remove('hidden');
  $('#dashboard-screen').classList.add('hidden');
}

function showDashboard() {
  $('#login-screen').classList.add('hidden');
  $('#dashboard-screen').classList.remove('hidden');
  loadRestaurants();
}

// ============ RESTAURANTS ============

let currentRestaurantId = null;

async function loadRestaurants() {
  try {
    const res = await api('/restaurants');
    const restaurants = res.data;

    const container = $('#restaurants-list');

    if (restaurants.length === 0) {
      container.innerHTML =
        '<p class="empty-state">No restaurants yet. Add your first restaurant!</p>';
      return;
    }

    container.innerHTML = restaurants
      .map(
        (r) => `
      <div class="restaurant-card" data-id="${r.id}">
        <h3>
          ${r.name}
          <span class="badge ${r.isActive ? 'badge-active' : 'badge-inactive'}">
            ${r.isActive ? 'Active' : 'Inactive'}
          </span>
        </h3>
        <p class="meta">${r.cuisine || 'No cuisine'} • ${r.city || 'No city'}</p>
        <div class="stats">
          <span>📋 ${r._count?.menuItems || 0} items</span>
          <span>📞 ${r.phone || 'No phone'}</span>
        </div>
      </div>
    `
      )
      .join('');

    // Add click handlers
    $$('.restaurant-card').forEach((card) => {
      card.addEventListener('click', () => editRestaurant(card.dataset.id));
    });
  } catch (err) {
    console.error('Failed to load restaurants:', err);
  }
}

function newRestaurant() {
  currentRestaurantId = null;
  $('#restaurant-edit-title').textContent = 'Add Restaurant';
  $('#restaurant-form').reset();
  $('#restaurant-id').value = '';
  $('#restaurant-isActive').value = 'true';
  $('#restaurant-priority').value = '999';
  $('#delete-restaurant-btn').classList.add('hidden');
  $('#menu-section').classList.add('hidden');
  showPage('restaurant-edit');
}

async function editRestaurant(id) {
  try {
    const res = await api(`/restaurants/${id}`);
    const r = res.data;

    currentRestaurantId = id;
    $('#restaurant-edit-title').textContent = 'Edit Restaurant';
    $('#restaurant-id').value = r.id;
    $('#restaurant-name').value = r.name || '';
    $('#restaurant-description').value = r.description || '';
    $('#restaurant-cuisine').value = r.cuisine || '';
    $('#restaurant-phone').value = r.phone || '';
    $('#restaurant-city').value = r.city || '';
    $('#restaurant-address').value = r.address || '';
    $('#restaurant-imageUrl').value = r.imageUrl || '';
    $('#restaurant-priority').value = r.priority || 999;
    $('#restaurant-fulfillmentType').value = r.fulfillmentType || 'PICKUP';
    $('#restaurant-isActive').value = r.isActive ? 'true' : 'false';

    $('#delete-restaurant-btn').classList.remove('hidden');
    $('#menu-section').classList.remove('hidden');

    showPage('restaurant-edit');
    loadMenuItems(id);
  } catch (err) {
    console.error('Failed to load restaurant:', err);
    alert('Failed to load restaurant: ' + err.message);
  }
}

async function saveRestaurant(e) {
  e.preventDefault();

  const data = {
    name: $('#restaurant-name').value,
    description: $('#restaurant-description').value,
    cuisine: $('#restaurant-cuisine').value,
    phone: $('#restaurant-phone').value,
    city: $('#restaurant-city').value,
    address: $('#restaurant-address').value,
    imageUrl: $('#restaurant-imageUrl').value,
    priority: parseInt($('#restaurant-priority').value) || 999,
    fulfillmentType: $('#restaurant-fulfillmentType').value,
    isActive: $('#restaurant-isActive').value === 'true',
  };

  try {
    if (currentRestaurantId) {
      await api(`/restaurants/${currentRestaurantId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } else {
      const res = await api('/restaurants', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      currentRestaurantId = res.data.id;
      $('#restaurant-id').value = currentRestaurantId;
      $('#delete-restaurant-btn').classList.remove('hidden');
      $('#menu-section').classList.remove('hidden');
    }

    alert('Restaurant saved!');
    loadRestaurants();
  } catch (err) {
    alert('Failed to save: ' + err.message);
  }
}

async function deleteRestaurant() {
  if (!currentRestaurantId) return;
  if (!confirm('Deactivate this restaurant?')) return;

  try {
    await api(`/restaurants/${currentRestaurantId}`, { method: 'DELETE' });
    showPage('restaurants');
    loadRestaurants();
  } catch (err) {
    alert('Failed to delete: ' + err.message);
  }
}

// ============ MENU ITEMS ============

let currentMenuItemId = null;

async function loadMenuItems(restaurantId) {
  try {
    const res = await api(`/restaurants/${restaurantId}/menu`);
    const items = res.data;

    const container = $('#menu-items-list');

    if (items.length === 0) {
      container.innerHTML = '<p class="empty-state">No menu items yet</p>';
      return;
    }

    container.innerHTML = items
      .map(
        (item) => `
      <div class="menu-item-card" data-id="${item.id}">
        <h4>
          ${item.name}
          <span class="price">$${item.price.toFixed(2)}</span>
        </h4>
        <p class="category">${item.category || 'Uncategorized'} ${item.available ? '' : '• Unavailable'}</p>
      </div>
    `
      )
      .join('');

    $$('.menu-item-card').forEach((card) => {
      card.addEventListener('click', () => editMenuItem(card.dataset.id));
    });
  } catch (err) {
    console.error('Failed to load menu items:', err);
  }
}

function newMenuItem() {
  currentMenuItemId = null;
  $('#menu-modal-title').textContent = 'Add Menu Item';
  $('#menu-form').reset();
  $('#menu-item-id').value = '';
  $('#menu-available').checked = true;
  $('#delete-menu-item-btn').classList.add('hidden');
  $('#menu-modal').classList.remove('hidden');
}

async function editMenuItem(id) {
  try {
    // Find item in current list (already loaded)
    const container = $('#menu-items-list');
    const card = container.querySelector(`[data-id="${id}"]`);

    // Fetch fresh data
    const res = await api(`/restaurants/${currentRestaurantId}/menu`);
    const item = res.data.find((i) => i.id === id);

    if (!item) {
      alert('Menu item not found');
      return;
    }

    currentMenuItemId = id;
    $('#menu-modal-title').textContent = 'Edit Menu Item';
    $('#menu-item-id').value = item.id;
    $('#menu-name').value = item.name || '';
    $('#menu-description').value = item.description || '';
    $('#menu-price').value = item.price || 0;
    $('#menu-category').value = item.category || '';
    $('#menu-available').checked = item.available;

    $('#delete-menu-item-btn').classList.remove('hidden');
    $('#menu-modal').classList.remove('hidden');
  } catch (err) {
    alert('Failed to load menu item: ' + err.message);
  }
}

async function saveMenuItem(e) {
  e.preventDefault();

  const data = {
    name: $('#menu-name').value,
    description: $('#menu-description').value,
    price: parseFloat($('#menu-price').value) || 0,
    category: $('#menu-category').value,
    available: $('#menu-available').checked,
  };

  try {
    if (currentMenuItemId) {
      await api(`/menu/${currentMenuItemId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } else {
      await api(`/restaurants/${currentRestaurantId}/menu`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }

    closeModal();
    loadMenuItems(currentRestaurantId);
  } catch (err) {
    alert('Failed to save: ' + err.message);
  }
}

async function deleteMenuItem() {
  if (!currentMenuItemId) return;
  if (!confirm('Delete this menu item?')) return;

  try {
    await api(`/menu/${currentMenuItemId}`, { method: 'DELETE' });
    closeModal();
    loadMenuItems(currentRestaurantId);
  } catch (err) {
    alert('Failed to delete: ' + err.message);
  }
}

function closeModal() {
  $('#menu-modal').classList.add('hidden');
}

// ============ ORDERS ============

async function loadOrders() {
  try {
    const res = await api('/orders');
    const orders = res.data;

    const container = $('#orders-list');

    if (orders.length === 0) {
      container.innerHTML = '<p class="empty-state">No orders yet</p>';
      return;
    }

    container.innerHTML = `
      <div class="order-row header">
        <span>Order ID</span>
        <span>Restaurant</span>
        <span>Total</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
      ${orders
        .map(
          (o) => `
        <div class="order-row" data-id="${o.id}">
          <span>${o.id.slice(0, 8)}...</span>
          <span>${o.restaurant?.name || 'Unknown'}</span>
          <span>$${o.total.toFixed(2)}</span>
          <span>
            <span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span>
          </span>
          <span>
            ${
              o.paymentStatus !== 'REFUND_PENDING' && o.status !== 'COMPLETED'
                ? `<button class="btn btn-danger btn-sm" onclick="markRefund('${o.id}')">Refund</button>`
                : ''
            }
          </span>
        </div>
      `
        )
        .join('')}
    `;
  } catch (err) {
    console.error('Failed to load orders:', err);
  }
}

async function markRefund(orderId) {
  if (!confirm('Mark this order for refund?')) return;

  try {
    await api(`/orders/${orderId}/refund`, { method: 'POST' });
    loadOrders();
  } catch (err) {
    alert('Failed to mark refund: ' + err.message);
  }
}

// ============ EVENT LISTENERS ============

document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  if (authToken) {
    showDashboard();
  }

  // Login form
  $('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    login($('#password').value);
  });

  // Logout
  $('#logout-btn').addEventListener('click', logout);

  // Navigation
  $$('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      showPage(page);

      if (page === 'restaurants') loadRestaurants();
      if (page === 'orders') loadOrders();
    });
  });

  // Add restaurant button
  $('#add-restaurant-btn').addEventListener('click', newRestaurant);

  // Restaurant form
  $('#restaurant-form').addEventListener('submit', saveRestaurant);
  $('#delete-restaurant-btn').addEventListener('click', deleteRestaurant);

  // Back buttons
  $$('.back-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      showPage(btn.dataset.back);
      if (btn.dataset.back === 'restaurants') loadRestaurants();
    });
  });

  // Menu items
  $('#add-menu-item-btn').addEventListener('click', newMenuItem);
  $('#menu-form').addEventListener('submit', saveMenuItem);
  $('#delete-menu-item-btn').addEventListener('click', deleteMenuItem);

  // Modal close
  $$('.close-modal').forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });

  // Refresh orders
  $('#refresh-orders-btn').addEventListener('click', loadOrders);

  // Close modal on backdrop click
  $('#menu-modal').addEventListener('click', (e) => {
    if (e.target === $('#menu-modal')) closeModal();
  });
});
