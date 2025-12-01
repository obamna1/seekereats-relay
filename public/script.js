// Configuration
const API_BASE_URL = 'http://localhost:3000';
const RELAY_SECRET = 'seekereats-hackathon-secret-2024';

// State
let currentQuote = null;
let currentDeliveryId = null;

// DOM Elements
const quoteForm = document.getElementById('quote-form');
const quoteSection = document.getElementById('quote-section');
const quoteResultSection = document.getElementById('quote-result-section');
const deliveryStatusSection = document.getElementById('delivery-status-section');
const quoteResultDiv = document.getElementById('quote-result');
const deliveryStatusDiv = document.getElementById('delivery-status');
const acceptQuoteBtn = document.getElementById('accept-quote-btn');
const backToQuoteBtn = document.getElementById('back-to-quote-btn');
const refreshStatusBtn = document.getElementById('refresh-status-btn');
const newDeliveryBtn = document.getElementById('new-delivery-btn');
const autofillBtn = document.getElementById('autofill-btn');
const errorMessage = document.getElementById('error-message');
const apiStatusDot = document.querySelector('.dot');

// Test data
const testData = {
    pickup_address: '1000 4th Ave, Seattle, WA 98104',
    pickup_business_name: 'Test Pickup Restaurant',
    pickup_phone_number: '+16505555555',
    pickup_instructions: 'Ring doorbell when arrived',
    dropoff_address: '1201 3rd Ave, Seattle, WA 98101',
    dropoff_business_name: 'Test Dropoff Location',
    dropoff_phone_number: '+16505555555',
    dropoff_instructions: 'Leave at front desk',
    order_value: '1999',
};

// Autofill form with test data
function autofillForm() {
    Object.keys(testData).forEach(key => {
        const input = quoteForm.elements[key];
        if (input) {
            input.value = testData[key];
        }
    });
}

// Auto fill button
autofillBtn.addEventListener('click', autofillForm);

// Check API availability on load
window.addEventListener('load', () => {
    checkAPIStatus();
});

// Check if relay API is available
async function checkAPIStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            apiStatusDot.classList.remove('offline');
            apiStatusDot.classList.add('online');
            document.getElementById('api-status').innerHTML = 'API: <span class="dot online"></span> Online';
        }
    } catch (error) {
        apiStatusDot.classList.remove('online');
        apiStatusDot.classList.add('offline');
        document.getElementById('api-status').innerHTML = 'API: <span class="dot offline"></span> Offline';
    }
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 6000);
}

// Show section
function showSection(section) {
    quoteSection.classList.remove('active');
    quoteResultSection.classList.remove('active');
    deliveryStatusSection.classList.remove('active');
    section.classList.add('active');
}

// Format JSON for display
function formatJSON(obj) {
    return JSON.stringify(obj, null, 2);
}

// Quote form submission
quoteForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(quoteForm);
    const payload = {
        pickup_address: formData.get('pickup_address'),
        pickup_business_name: formData.get('pickup_business_name'),
        pickup_phone_number: formData.get('pickup_phone_number'),
        pickup_instructions: formData.get('pickup_instructions') || undefined,
        dropoff_address: formData.get('dropoff_address'),
        dropoff_business_name: formData.get('dropoff_business_name'),
        dropoff_phone_number: formData.get('dropoff_phone_number'),
        dropoff_instructions: formData.get('dropoff_instructions') || undefined,
        order_value: parseInt(formData.get('order_value')),
    };

    try {
        quoteResultDiv.innerHTML = '<p class="loading">Getting quote...</p>';
        showSection(quoteResultSection);

        const response = await fetch(`${API_BASE_URL}/relay/delivery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Relay-Secret': RELAY_SECRET,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        currentQuote = data;
        currentDeliveryId = data.external_delivery_id;

        // Display quote
        const quoteDisplay = `
QUOTE RECEIVED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Delivery ID: ${data.external_delivery_id}
Status: ${data.delivery_status}
Fee: $${(data.fee / 100).toFixed(2)} USD
Currency: ${data.currency}

Pickup Address:
  ${data.pickup_address}

Dropoff Address:
  ${data.dropoff_address}

Estimated Pickup: ${new Date(data.pickup_time_estimated).toLocaleString()}
Estimated Dropoff: ${new Date(data.dropoff_time_estimated).toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full Response:
${formatJSON(data)}
        `;

        quoteResultDiv.innerHTML = `<pre>${quoteDisplay}</pre>`;
        acceptQuoteBtn.disabled = false;

    } catch (error) {
        showError(`Quote Error: ${error.message}`);
        quoteResultDiv.innerHTML = `<p class="loading">Error: ${error.message}</p>`;
    }
});

// Accept quote
acceptQuoteBtn.addEventListener('click', async () => {
    if (!currentDeliveryId) return;

    try {
        acceptQuoteBtn.disabled = true;
        quoteResultDiv.innerHTML = '<p class="loading">Accepting quote...</p>';

        const response = await fetch(
            `${API_BASE_URL}/relay/delivery/${currentDeliveryId}/accept`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Relay-Secret': RELAY_SECRET,
                },
                body: JSON.stringify({}),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();

        // Show delivery status
        showDeliveryStatus(data);
        showSection(deliveryStatusSection);

    } catch (error) {
        showError(`Accept Quote Error: ${error.message}`);
        acceptQuoteBtn.disabled = false;
    }
});

// Show delivery status
function showDeliveryStatus(data) {
    const statusDisplay = `
DELIVERY CREATED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Delivery ID: ${data.external_delivery_id}
Status: ${data.delivery_status}
Fee: $${(data.fee / 100).toFixed(2)} USD
Currency: ${data.currency}

Pickup Address:
  ${data.pickup_address}

Dropoff Address:
  ${data.dropoff_address}

${data.tracking_url ? `Tracking URL:
  ${data.tracking_url}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full Response:
${formatJSON(data)}
    `;

    deliveryStatusDiv.innerHTML = `<pre>${statusDisplay}</pre>`;
}

// Refresh delivery status
refreshStatusBtn.addEventListener('click', async () => {
    if (!currentDeliveryId) return;

    try {
        deliveryStatusDiv.innerHTML = '<p class="loading">Refreshing status...</p>';

        const response = await fetch(
            `${API_BASE_URL}/relay/delivery/${currentDeliveryId}`,
            {
                method: 'GET',
                headers: {
                    'X-Relay-Secret': RELAY_SECRET,
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        showDeliveryStatus(data);

    } catch (error) {
        showError(`Status Refresh Error: ${error.message}`);
        deliveryStatusDiv.innerHTML = `<p class="loading">Error: ${error.message}</p>`;
    }
});

// Back to quote
backToQuoteBtn.addEventListener('click', () => {
    quoteForm.reset();
    currentQuote = null;
    currentDeliveryId = null;
    acceptQuoteBtn.disabled = true;
    showSection(quoteSection);
});

// New delivery
newDeliveryBtn.addEventListener('click', () => {
    quoteForm.reset();
    currentQuote = null;
    currentDeliveryId = null;
    acceptQuoteBtn.disabled = true;
    showSection(quoteSection);
});

// Check API status periodically
setInterval(checkAPIStatus, 10000);
