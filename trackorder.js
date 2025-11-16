// TrackOrder.js - Enhanced Order Tracking System
class TrackOrder {
    constructor() {
        this.orders = this.loadOrders();
        this.refreshInterval = null;
        this.init();
    }

    init() {
        try {
            this.addTrackingToOrderHistory();
            this.addTrackingToCartCompletion();
            this.setupGlobalEventListeners();
            console.log('TrackOrder system initialized');
        } catch (error) {
            console.error('Failed to initialize TrackOrder:', error);
            this.showNotification('Tracking system initialization failed', 'error');
        }
    }

    loadOrders() {
        try {
            return JSON.parse(localStorage.getItem('orders')) || [];
        } catch (error) {
            console.error('Error loading orders:', error);
            return [];
        }
    }

    setupGlobalEventListeners() {
        // Listen for order updates from other components
        document.addEventListener('orderStatusUpdated', (event) => {
            if (event.detail && event.detail.orderId) {
                this.refreshOrderData(event.detail.orderId);
            }
        });

        // Listen for storage changes (other tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === 'orders') {
                this.orders = this.loadOrders();
                this.refreshActiveTrackingModal();
            }
        });
    }

    addTrackingToOrderHistory() {
        // Use DOMContentLoaded or check if DOM is already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.injectTrackingButtons();
                this.setupMutationObserver();
            });
        } else {
            this.injectTrackingButtons();
            this.setupMutationObserver();
        }
    }

    setupMutationObserver() {
        // Also inject when order history is dynamically loaded
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    this.injectTrackingButtons();
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    addTrackingToCartCompletion() {
        document.addEventListener('orderCompleted', (event) => {
            if (event.detail && event.detail.order) {
                const orderId = event.detail.order.id;
                setTimeout(() => {
                    this.showOrderCompletionTracking(orderId);
                }, 1500);
            }
        });
    }

    injectTrackingButtons() {
        try {
            const orderHistoryItems = document.querySelectorAll('.order-history-item, [data-order-id], .card[data-order-id]');
            
            orderHistoryItems.forEach(item => {
                const orderId = this.extractOrderId(item);
                if (orderId && !item.querySelector('.track-order-btn')) {
                    this.createTrackingButton(item, orderId);
                }
            });

            // Also look for order history modal content
            const historyModal = document.getElementById('historyModal');
            if (historyModal) {
                const historyItems = historyModal.querySelectorAll('.card[data-order-id]');
                historyItems.forEach(item => {
                    const orderId = this.extractOrderId(item);
                    if (orderId && !item.querySelector('.track-order-btn')) {
                        this.createTrackingButton(item, orderId);
                    }
                });
            }
        } catch (error) {
            console.error('Error injecting tracking buttons:', error);
        }
    }

    extractOrderId(element) {
        return element.dataset.orderId || 
               element.querySelector('[data-order-id]')?.dataset.orderId ||
               element.closest('[data-order-id]')?.dataset.orderId;
    }

    createTrackingButton(container, orderId) {
        const trackBtn = document.createElement('button');
        trackBtn.type = 'button'; // Add type for better accessibility
        trackBtn.className = 'btn btn-outline-primary btn-sm track-order-btn';
        trackBtn.innerHTML = '<i class="fas fa-map-marker-alt me-1"></i>Track Order';
        trackBtn.onclick = (e) => {
            e.stopPropagation();
            this.track(orderId);
        };
        
        const actionContainer = container.querySelector('.order-actions') || 
                              container.querySelector('.card-footer') || 
                              container.querySelector('.d-flex') || 
                              container;
        
        // Add some spacing if it's the direct container
        if (actionContainer === container) {
            trackBtn.classList.add('mt-2');
        }
        
        actionContainer.appendChild(trackBtn);
    }

    showOrderCompletionTracking(orderId) {
        const completionModal = document.getElementById('orderSuccessModal');
        if (completionModal) {
            let trackBtn = completionModal.querySelector('.track-order-completion-btn');
            if (!trackBtn) {
                trackBtn = document.createElement('button');
                trackBtn.type = 'button';
                trackBtn.className = 'btn btn-success mt-3 track-order-completion-btn';
                trackBtn.innerHTML = '<i class="fas fa-map-marker-alt me-2"></i>Track Your Order';
                trackBtn.onclick = () => {
                    const modal = bootstrap.Modal.getInstance(completionModal);
                    if (modal) modal.hide();
                    setTimeout(() => this.track(orderId), 300);
                };
                
                const modalBody = completionModal.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.appendChild(trackBtn);
                }
            }
        }
    }

    track(orderId) {
        try {
            if (!orderId) {
                this.showNotification('Invalid order ID', 'error');
                return;
            }

            const user = this.getCurrentUser();
            if (!user) {
                this.showNotification('Please login to track your order', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html?redirect=tracking';
                }, 2000);
                return;
            }

            const order = this.findUserOrder(orderId, user.id);
            if (!order) {
                this.showNotification('Order not found or you don\'t have permission to view this order', 'error');
                return;
            }

            this.displayTrackingModal(order);
        } catch (error) {
            console.error('Error tracking order:', error);
            this.showNotification('Failed to track order', 'error');
        }
    }

    findUserOrder(orderId, userId) {
        return this.orders.find(order => {
            const orderIdMatch = (order.id === orderId || 
                                order.id?.toString() === orderId.toString());
            const userMatch = order.userId === userId || 
                            order.userId?.toString() === userId.toString();
            return orderIdMatch && userMatch;
        });
    }

    getCurrentUser() {
        // Try auth module first
        if (typeof auth !== 'undefined' && auth.getCurrentUser) {
            const user = auth.getCurrentUser();
            if (user) return user;
        }
        
        // Fallback to localStorage
        try {
            const userData = localStorage.getItem('currentUser');
            return userData ? JSON.parse(userData) : null;
        } catch (e) {
            console.error('Error getting current user:', e);
            return null;
        }
    }

    displayTrackingModal(order) {
        if (!order) {
            this.showNotification('Order data is invalid', 'error');
            return;
        }

        const trackingHtml = this.generateTrackingModalHTML(order);
        
        // Remove existing modal
        this.removeExistingModal('trackingModal');
        
        // Add to DOM
        document.body.insertAdjacentHTML('beforeend', trackingHtml);
        
        // Add styles
        this.addTrackingStyles();
        
        // Initialize modal
        const modalElement = document.getElementById('trackingModal');
        if (!modalElement) {
            this.showNotification('Failed to load tracking interface', 'error');
            return;
        }

        const modal = new bootstrap.Modal(modalElement);
        
        // Add event listeners
        this.setupTrackingModalEvents(modalElement, order.id);
        
        modal.show();
        
        // Start auto-refresh for active orders
        this.startAutoRefresh(order.id, order.status);
        
        // Cleanup on modal close
        modalElement.addEventListener('hidden.bs.modal', () => {
            this.stopAutoRefresh();
            setTimeout(() => {
                if (modalElement.parentElement) {
                    modalElement.remove();
                }
            }, 300);
        });
    }

    generateTrackingModalHTML(order) {
        const statusSteps = [
            { status: 'confirmed', label: 'Order Confirmed', icon: 'fa-check-circle', description: 'Your order has been received and confirmed' },
            { status: 'preparing', label: 'Preparing Food', icon: 'fa-utensils', description: 'The restaurant is preparing your delicious meal' },
            { status: 'out_for_delivery', label: 'Out for Delivery', icon: 'fa-motorcycle', description: 'Your order is on the way to you' },
            { status: 'delivered', label: 'Delivered', icon: 'fa-home', description: 'Your order has been delivered. Enjoy your meal!' }
        ];

        const currentStatusIndex = statusSteps.findIndex(step => step.status === order.status);
        const estimatedTime = this.calculateEstimatedTime(order.status, order.createdAt || order.date);
        const progressPercentage = this.calculateProgressPercentage(order.status);

        // Safely format order items
        const orderItems = order.items || order.orderItems || [];
        const orderTotal = order.finalTotal || order.total || order.amount || 0;
        const orderDate = order.createdAt || order.date || new Date().toISOString();

        return `
            <div class="modal fade" id="trackingModal" tabindex="-1" aria-labelledby="trackingModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="trackingModalLabel">
                                <i class="fas fa-map-marker-alt me-2"></i>Tracking Order #${order.id}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Progress Bar -->
                            <div class="progress mb-4" style="height: 8px;">
                                <div class="progress-bar bg-success" role="progressbar" 
                                     style="width: ${progressPercentage}%" 
                                     aria-valuenow="${progressPercentage}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="100">
                                </div>
                            </div>

                            <!-- Order Summary -->
                            <div class="order-summary-card card border-0 shadow-sm mb-4">
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <h6 class="text-primary mb-3"><i class="fas fa-receipt me-2"></i>Order Details</h6>
                                            <p><strong>Order Date:</strong> ${new Date(orderDate).toLocaleString()}</p>
                                            <p><strong>Customer:</strong> ${order.username || order.customerName || 'Customer'}</p>
                                            <p><strong>Restaurant:</strong> ${order.restaurant || order.restaurantName || 'Multiple Restaurants'}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <h6 class="text-primary mb-3"><i class="fas fa-info-circle me-2"></i>Order Info</h6>
                                            <p><strong>Total Amount:</strong> <span class="text-success fw-bold">₹${orderTotal}</span></p>
                                            <p><strong>Status:</strong> 
                                                <span class="badge ${this.getStatusBadgeClass(order.status)} fs-6">
                                                    ${this.formatStatus(order.status)}
                                                </span>
                                            </p>
                                            ${estimatedTime ? `
                                                <p><strong>Estimated Delivery:</strong> <span class="text-primary">${estimatedTime}</span></p>
                                            ` : ''}
                                        </div>
                                    </div>
                                    ${order.deliveryAddress ? `
                                        <div class="mt-3 p-3 bg-light rounded">
                                            <h6 class="text-primary mb-2"><i class="fas fa-map-marker-alt me-2"></i>Delivery Address</h6>
                                            <p class="mb-0">${order.deliveryAddress}</p>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>

                            <!-- Tracking Timeline -->
                            <div class="tracking-timeline mb-4">
                                <h6 class="text-primary mb-3"><i class="fas fa-road me-2"></i>Order Journey</h6>
                                ${statusSteps.map((step, index) => `
                                    <div class="timeline-step ${index <= currentStatusIndex ? 'completed' : ''} ${index === currentStatusIndex ? 'current' : ''}">
                                        <div class="timeline-icon">
                                            <i class="fas ${step.icon} ${index <= currentStatusIndex ? 'text-white bg-success' : 'text-muted bg-light'}"></i>
                                        </div>
                                        <div class="timeline-content">
                                            <h6 class="${index <= currentStatusIndex ? 'text-success' : 'text-muted'}">${step.label}</h6>
                                            <p class="small text-muted mb-1">${step.description}</p>
                                            ${index === currentStatusIndex && order.status !== 'delivered' && order.status !== 'cancelled' ? `
                                                <small class="text-primary"><i class="fas fa-clock me-1"></i>In progress</small>
                                            ` : ''}
                                            ${index < currentStatusIndex ? `
                                                <small class="text-success"><i class="fas fa-check me-1"></i>Completed</small>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>

                            <!-- Order Items -->
                            <div class="order-items-card card border-0 shadow-sm">
                                <div class="card-header bg-light">
                                    <h6 class="mb-0 text-primary"><i class="fas fa-utensils me-2"></i>Order Items</h6>
                                </div>
                                <div class="card-body p-0">
                                    <div class="list-group list-group-flush">
                                        ${orderItems.length > 0 ? orderItems.map(item => `
                                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                                <div class="d-flex align-items-center">
                                                    ${item.image ? `
                                                        <img src="${item.image}" alt="${item.name}" 
                                                             class="img-thumbnail me-3" 
                                                             style="width: 60px; height: 60px; object-fit: cover;">
                                                    ` : `
                                                        <div class="bg-light rounded me-3 d-flex align-items-center justify-content-center" 
                                                             style="width: 60px; height: 60px;">
                                                            <i class="fas fa-utensils text-muted"></i>
                                                        </div>
                                                    `}
                                                    <div>
                                                        <h6 class="mb-1">${item.name || 'Unknown Item'}</h6>
                                                        <small class="text-muted">Quantity: ${item.quantity || 1}</small>
                                                    </div>
                                                </div>
                                                <div class="text-end">
                                                    <span class="text-success fw-bold">₹${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                                                    <br>
                                                    <small class="text-muted">₹${(item.price || 0).toFixed(2)} each</small>
                                                </div>
                                            </div>
                                        `).join('') : '<div class="list-group-item text-muted text-center">No items found</div>'}
                                    </div>
                                </div>
                            </div>

                            <!-- Delivery Instructions -->
                            ${order.specialInstructions ? `
                                <div class="mt-3 p-3 bg-warning bg-opacity-10 rounded">
                                    <h6 class="text-warning mb-2"><i class="fas fa-sticky-note me-2"></i>Special Instructions</h6>
                                    <p class="mb-0">${order.specialInstructions}</p>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Close
                            </button>
                            <button type="button" class="btn btn-outline-primary" onclick="trackOrder.shareOrder('${order.id}')">
                                <i class="fas fa-share-alt me-1"></i>Share Order
                            </button>
                            ${order.status !== 'delivered' && order.status !== 'cancelled' ? `
                                <button type="button" class="btn btn-primary" onclick="trackOrder.refreshOrderData('${order.id}')">
                                    <i class="fas fa-sync-alt me-1"></i>Refresh Status
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    calculateProgressPercentage(status) {
        const progressMap = {
            'confirmed': 25,
            'preparing': 50,
            'out_for_delivery': 75,
            'delivered': 100,
            'cancelled': 100
        };
        return progressMap[status] || 0;
    }

    calculateEstimatedTime(status, orderDate) {
        try {
            const orderTime = new Date(orderDate);
            const now = new Date();
            const timeDiff = now - orderTime;
            const minutesDiff = Math.floor(timeDiff / (1000 * 60));

            switch(status) {
                case 'confirmed':
                    return `~${Math.max(5, 45 - Math.min(minutesDiff, 15))} minutes remaining`;
                case 'preparing':
                    return `~${Math.max(5, 30 - Math.min(minutesDiff - 15, 15))} minutes remaining`;
                case 'out_for_delivery':
                    return `~${Math.max(2, 15 - Math.min(minutesDiff - 30, 15))} minutes remaining`;
                case 'delivered':
                    return 'Delivered';
                case 'cancelled':
                    return 'Order Cancelled';
                default:
                    return null;
            }
        } catch (error) {
            console.error('Error calculating estimated time:', error);
            return null;
        }
    }

    setupTrackingModalEvents(modalElement, orderId) {
        // Add refresh button handler
        const refreshBtn = modalElement.querySelector('button[onclick*="refreshOrderData"]');
        if (refreshBtn) {
            refreshBtn.onclick = () => this.refreshOrderData(orderId);
        }

        // Add share button handler
        const shareBtn = modalElement.querySelector('button[onclick*="shareOrder"]');
        if (shareBtn) {
            shareBtn.onclick = () => this.shareOrder(orderId);
        }
    }

    startAutoRefresh(orderId, status) {
        if (status !== 'delivered' && status !== 'cancelled') {
            this.stopAutoRefresh(); // Clear any existing interval
            this.refreshInterval = setInterval(() => {
                this.autoRefreshOrder(orderId);
            }, 30000); // Refresh every 30 seconds
        }
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    autoRefreshOrder(orderId) {
        const modal = document.getElementById('trackingModal');
        if (modal && modal.style.display !== 'none') {
            this.refreshOrderData(orderId);
        }
    }

    refreshOrder(orderId) {
        // Alias for backward compatibility
        this.refreshOrderData(orderId);
    }

    refreshOrderData(orderId) {
        try {
            this.orders = this.loadOrders(); // Reload from storage
            const user = this.getCurrentUser();
            const orderIndex = this.orders.findIndex(o => {
                const orderIdMatch = (o.id === orderId || o.id?.toString() === orderId.toString());
                const userMatch = o.userId === user.id || o.userId?.toString() === user.id.toString();
                return orderIdMatch && userMatch;
            });
            
            if (orderIndex !== -1) {
                const updatedOrder = this.simulateOrderProgress(this.orders[orderIndex]);
                
                if (updatedOrder.status !== this.orders[orderIndex].status) {
                    this.orders[orderIndex] = updatedOrder;
                    localStorage.setItem('orders', JSON.stringify(this.orders));
                    
                    // Dispatch event for other components
                    this.dispatchOrderUpdateEvent(orderId, updatedOrder.status);
                    
                    // Refresh the modal
                    this.displayTrackingModal(updatedOrder);
                    
                    this.showNotification(`Order status updated to: ${this.formatStatus(updatedOrder.status)}`, 'success');
                } else {
                    this.showNotification('Order status is current', 'info');
                }
            }
        } catch (error) {
            console.error('Error refreshing order:', error);
            this.showNotification('Failed to refresh order status', 'error');
        }
    }

    simulateOrderProgress(order) {
        const statusFlow = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];
        const currentIndex = statusFlow.indexOf(order.status);
        
        if (currentIndex < statusFlow.length - 1) {
            const orderTime = new Date(order.createdAt || order.date);
            const now = new Date();
            const timeDiff = now - orderTime;
            const minutesDiff = Math.floor(timeDiff / (1000 * 60));
            
            // Progress based on time (every 8 minutes for demo purposes)
            const expectedProgress = Math.min(Math.floor(minutesDiff / 8), statusFlow.length - 1);
            
            if (expectedProgress > currentIndex) {
                return {
                    ...order,
                    status: statusFlow[expectedProgress]
                };
            }
        }
        
        return order;
    }

    refreshActiveTrackingModal() {
        const activeModal = document.getElementById('trackingModal');
        if (activeModal && activeModal.style.display !== 'none') {
            const orderId = activeModal.querySelector('.modal-title')?.textContent.match(/#(\w+)/)?.[1];
            if (orderId) {
                this.refreshOrderData(orderId);
            }
        }
    }

    shareOrder(orderId) {
        try {
            const order = this.orders.find(o => o.id === orderId);
            if (!order) {
                this.showNotification('Order not found', 'error');
                return;
            }

            const shareUrl = `${window.location.origin}${window.location.pathname}?track-order=${orderId}`;
            const shareText = `Track my order #${orderId} from The Social Bite: ${shareUrl}`;
            
            if (navigator.share) {
                navigator.share({
                    title: `Order #${orderId} - The Social Bite`,
                    text: `Track my order from The Social Bite`,
                    url: shareUrl,
                })
                .then(() => this.showNotification('Order shared successfully!', 'success'))
                .catch((error) => {
                    if (error.name !== 'AbortError') {
                        this.fallbackShare(shareText);
                    }
                });
            } else {
                this.fallbackShare(shareText);
            }
        } catch (error) {
            console.error('Error sharing order:', error);
            this.fallbackShare(shareText);
        }
    }

    fallbackShare(shareText) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Order tracking link copied to clipboard!', 'success');
            }).catch(() => {
                this.promptShare(shareText);
            });
        } else {
            this.promptShare(shareText);
        }
    }

    promptShare(shareText) {
        const input = document.createElement('input');
        input.value = shareText;
        document.body.appendChild(input);
        input.select();
        input.setSelectionRange(0, 99999);
        try {
            document.execCommand('copy');
            this.showNotification('Order tracking link copied to clipboard!', 'success');
        } catch (err) {
            this.showNotification('Please copy the link manually: ' + shareText, 'info');
        }
        document.body.removeChild(input);
    }

    removeExistingModal(modalId) {
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            const modalInstance = bootstrap.Modal.getInstance(existingModal);
            if (modalInstance) {
                modalInstance.hide();
            }
            setTimeout(() => {
                if (existingModal.parentElement) {
                    existingModal.remove();
                }
            }, 300);
        }
    }

    dispatchOrderUpdateEvent(orderId, status) {
        const event = new CustomEvent('orderStatusUpdated', {
            detail: { orderId, status }
        });
        document.dispatchEvent(event);
    }

    // Integration with order system
    onOrderCompleted(orderData) {
        const orderId = orderData.id || orderData.orderId;
        if (orderId) {
            const event = new CustomEvent('orderCompleted', {
                detail: { order: orderData }
            });
            document.dispatchEvent(event);
            
            setTimeout(() => {
                this.showOrderCompletionTracking(orderId);
            }, 1000);
        }
    }

    // URL parameter handling
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const trackOrderId = urlParams.get('track-order');
        
        if (trackOrderId) {
            setTimeout(() => {
                this.track(trackOrderId);
            }, 1000);
        }
    }

    addTrackingStyles() {
        if (!document.getElementById('tracking-styles')) {
            const styles = `
                <style id="tracking-styles">
                    .tracking-timeline {
                        position: relative;
                        padding: 20px 0;
                    }
                    
                    .timeline-step {
                        display: flex;
                        align-items: flex-start;
                        margin-bottom: 25px;
                        position: relative;
                    }
                    
                    .timeline-step:not(:last-child):before {
                        content: '';
                        position: absolute;
                        left: 19px;
                        top: 40px;
                        bottom: -25px;
                        width: 2px;
                        background-color: #e9ecef;
                        z-index: 1;
                    }
                    
                    .timeline-step.completed:not(:last-child):before {
                        background-color: #28a745;
                    }
                    
                    .timeline-icon {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-right: 15px;
                        position: relative;
                        z-index: 2;
                        flex-shrink: 0;
                    }
                    
                    .timeline-content {
                        flex: 1;
                    }
                    
                    .timeline-step.current .timeline-content h6 {
                        animation: pulse 2s infinite;
                    }
                    
                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.7; }
                        100% { opacity: 1; }
                    }
                    
                    .order-summary-card {
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    }
                    
                    .track-order-btn {
                        transition: all 0.3s ease;
                    }
                    
                    .track-order-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    }

                    .custom-alert {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        z-index: 9999;
                        min-width: 300px;
                        max-width: 500px;
                        animation: slideInRight 0.3s ease-out;
                        border-radius: 8px;
                        padding: 12px 16px;
                        display: flex;
                        align-items: center;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }

                    .custom-alert.alert-success {
                        background: #d4edda;
                        color: #155724;
                        border: 1px solid #c3e6cb;
                    }

                    .custom-alert.alert-error {
                        background: #f8d7da;
                        color: #721c24;
                        border: 1px solid #f5c6cb;
                    }

                    .custom-alert.alert-info {
                        background: #d1ecf1;
                        color: #0c5460;
                        border: 1px solid #bee5eb;
                    }

                    @keyframes slideInRight {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styles);
        }
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
        const existingAlert = document.querySelector('.custom-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `custom-alert alert-${type}`;
        alertDiv.innerHTML = `
            <div class="alert-content d-flex align-items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                <span class="flex-grow-1">${message}</span>
                <button type="button" class="btn-close btn-close-sm ms-2" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Initialize track order system
const trackOrder = new TrackOrder();

// Handle URL parameters on load
document.addEventListener('DOMContentLoaded', () => {
    trackOrder.handleUrlParameters();
});

// Make globally available
window.trackOrder = trackOrder;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrackOrder;
}