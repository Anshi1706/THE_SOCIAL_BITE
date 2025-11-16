// OrderHistory.js - Fixed version with user-specific orders
class AuthManager {
    isLoggedIn() {
        const user = localStorage.getItem('currentUser');
        return user !== null;
    }

    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }

    showNotification(message, type = 'info') {
        const existingAlert = document.querySelector('.custom-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `custom-alert alert-${type}`;
        alertDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 500px;
            animation: slideIn 0.5s ease-out;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
            border-radius: 8px;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        
        alertDiv.innerHTML = `
            <i class="fas fa-${icon} me-2"></i>
            ${message}
            <button type="button" class="btn-close ms-auto" onclick="this.parentElement.remove()" style="border: none; background: none; font-size: 0.8rem; cursor: pointer;">×</button>
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

const auth = new AuthManager();

class OrderHistory {
    constructor() {
        this.orders = JSON.parse(localStorage.getItem('orders')) || [];
    }

    loadHistory() {
        const user = auth.getCurrentUser();
        if (!user) {
            this.showNotification('Please login to view your order history', 'error');
            return [];
        }
        
        // Filter orders for current user only
        const userOrders = this.orders.filter(order => order.userId === user.id);
        return userOrders.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by most recent first
    }

    displayHistory() {
        if (!auth.isLoggedIn()) {
            this.showNotification('Please login to view your order history', 'error');
            return;
        }

        const orders = this.loadHistory();
        const currentUser = auth.getCurrentUser();
        
        const historyHtml = `
            <div class="modal fade" id="historyModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-history me-2"></i>Order History for ${currentUser.username}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${orders.length === 0 ? 
                                '<div class="text-center text-muted py-4">' +
                                    '<i class="fas fa-shopping-cart fa-3x mb-3"></i>' +
                                    '<p>No orders found</p>' +
                                    '<p class="small">Your orders will appear here once you place them</p>' +
                                '</div>' :
                                orders.map(order => `
                                    <div class="card mb-3 border-0 shadow-sm">
                                        <div class="card-body">
                                            <div class="d-flex justify-content-between align-items-start mb-2">
                                                <div class="flex-grow-1">
                                                    <h6 class="mb-1 text-primary">Order #${order.id}</h6>
                                                    <p class="text-muted small mb-1">
                                                        <i class="fas fa-calendar me-1"></i>${order.date}
                                                    </p>
                                                    <p class="mb-2">
                                                        <span class="badge ${this.getStatusBadgeClass(order.status)}">
                                                            ${this.formatStatus(order.status)}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div class="text-end">
                                                    <strong class="text-success">₹${order.total}</strong>
                                                </div>
                                            </div>
                                            
                                            <div class="border-top pt-2">
                                                <h6 class="small text-muted mb-2">ITEMS:</h6>
                                                ${order.items.map(item => `
                                                    <div class="d-flex justify-content-between align-items-center small mb-1">
                                                        <div class="d-flex align-items-center">
                                                            ${item.image ? `
                                                                <img src="${item.image}" alt="${item.name}" 
                                                                     class="img-thumbnail me-2" 
                                                                     style="width: 40px; height: 40px; object-fit: cover;">
                                                            ` : ''}
                                                            <span>${item.name} × ${item.quantity}</span>
                                                        </div>
                                                        <span>₹${item.price * item.quantity}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')
                            }
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            ${orders.length > 0 ? `
                                <button type="button" class="btn btn-outline-primary" onclick="orderHistory.exportHistory()">
                                    <i class="fas fa-download me-1"></i>Export
                                </button>
                                <button type="button" class="btn btn-outline-danger" onclick="orderHistory.clearHistory()">
                                    <i class="fas fa-trash me-1"></i>Clear History
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('historyModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', historyHtml);
        const modal = new bootstrap.Modal(document.getElementById('historyModal'));
        modal.show();
        
        // Add event listener for modal close
        document.getElementById('historyModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    getStatusBadgeClass(status) {
        const classes = {
            'confirmed': 'bg-primary',
            'preparing': 'bg-warning text-dark',
            'out_for_delivery': 'bg-info',
            'delivered': 'bg-success',
            'cancelled': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    formatStatus(status) {
        const statusMap = {
            'confirmed': 'Confirmed',
            'preparing': 'Preparing',
            'out_for_delivery': 'Out for Delivery',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingAlert = document.querySelector('.custom-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `custom-alert alert-${type}`;
        alertDiv.innerHTML = `
            <div class="alert-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                ${message}
            </div>
        `;

        document.body.appendChild(alertDiv);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 3000);
    }

    exportHistory() {
        const orders = this.loadHistory();
        if (orders.length === 0) {
            this.showNotification('No orders to export', 'info');
            return;
        }

        const data = JSON.stringify(orders, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `order-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Order history exported successfully!', 'success');
    }

    clearHistory() {
        if (!confirm('Are you sure you want to clear your order history? This action cannot be undone.')) {
            return;
        }

        const user = auth.getCurrentUser();
        if (!user) {
            this.showNotification('Please login to clear order history', 'error');
            return;
        }

        // Remove only current user's orders
        const allOrders = JSON.parse(localStorage.getItem('orders')) || [];
        const otherUsersOrders = allOrders.filter(order => order.userId !== user.id);
        
        localStorage.setItem('orders', JSON.stringify(otherUsersOrders));
        this.orders = otherUsersOrders;
        
        this.showNotification('Order history cleared successfully!', 'success');
        
        // Close and reopen modal to show updated list
        const modal = bootstrap.Modal.getInstance(document.getElementById('historyModal'));
        if (modal) modal.hide();
        
        setTimeout(() => {
            this.displayHistory();
        }, 500);
    }

    getOrderStats() {
        const orders = this.loadHistory();
        const stats = {
            totalOrders: orders.length,
            totalSpent: orders.reduce((sum, order) => sum + order.total, 0),
            deliveredOrders: orders.filter(order => order.status === 'delivered').length,
            pendingOrders: orders.filter(order => order.status !== 'delivered').length
        };
        return stats;
    }

    displayOrderStats() {
        if (!auth.isLoggedIn()) {
            return;
        }

        const stats = this.getOrderStats();
        const statsHtml = `
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-primary">${stats.totalOrders}</h3>
                            <p class="text-muted mb-0">Total Orders</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-success">₹${stats.totalSpent}</h3>
                            <p class="text-muted mb-0">Total Spent</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-info">${stats.deliveredOrders}</h3>
                            <p class="text-muted mb-0">Delivered</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h3 class="text-warning">${stats.pendingOrders}</h3>
                            <p class="text-muted mb-0">Pending</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return statsHtml;
    }
}

// Initialize order history system
const orderHistory = new OrderHistory();

// Make it globally available
window.orderHistory = orderHistory;