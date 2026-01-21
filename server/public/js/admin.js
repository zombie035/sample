// public/js/admin.js

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all admin functionality
    
    // Initialize modals
    initModals();
    
    // Initialize delete confirmations
    initDeleteConfirmations();
    
    // Initialize form validations
    initFormValidations();
    
    // Initialize filters
    initFilters();
    
    // Initialize real-time updates
    initRealTimeUpdates();
    
    // Initialize charts if on dashboard
    if (document.getElementById('usageChart')) {
        initDashboardCharts();
    }
    
    // Initialize map if on monitor page
    if (document.getElementById('adminMap')) {
        initAdminMap();
    }
});

// Modal Management
function initModals() {
    // Close modals when clicking X or outside
    document.querySelectorAll('.modal-close, .modal').forEach(element => {
        element.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal') || e.target.classList.contains('modal-close')) {
                closeModal(e.target.closest('.modal'));
            }
        });
    });
    
    // Open user modal
    document.querySelectorAll('.open-user-modal').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.dataset.userId;
            openUserModal(userId);
        });
    });
    
    // Open bus modal
    document.querySelectorAll('.open-bus-modal').forEach(button => {
        button.addEventListener('click', function() {
            const busId = this.dataset.busId;
            openBusModal(busId);
        });
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// User Management
function openUserModal(userId) {
    if (userId) {
        // Load user data via AJAX
        fetch(`/admin/api/users/${userId}`)
            .then(response => response.json())
            .then(user => {
                document.getElementById('modalUserName').textContent = user.name;
                document.getElementById('modalUserEmail').textContent = user.email;
                document.getElementById('modalUserRole').textContent = user.role;
                document.getElementById('modalUserPhone').textContent = user.phone || 'N/A';
                document.getElementById('modalUserStudentId').textContent = user.studentId || 'N/A';
                document.getElementById('modalUserCreated').textContent = 
                    new Date(user.createdAt).toLocaleDateString();
                
                // Set edit form values
                document.getElementById('editUserId').value = user._id;
                document.getElementById('editUserName').value = user.name;
                document.getElementById('editUserEmail').value = user.email;
                document.getElementById('editUserRole').value = user.role;
                document.getElementById('editUserPhone').value = user.phone || '';
                document.getElementById('editUserStudentId').value = user.studentId || '';
                
                openModal('userModal');
            })
            .catch(error => {
                console.error('Error loading user:', error);
                alert('Error loading user data');
            });
    } else {
        // Clear form for new user
        document.getElementById('userForm').reset();
        document.getElementById('modalTitle').textContent = 'Add New User';
        openModal('userModal');
    }
}

// Bus Management
function openBusModal(busId) {
    if (busId) {
        // Load bus data via AJAX
        fetch(`/admin/api/buses/${busId}`)
            .then(response => response.json())
            .then(bus => {
                document.getElementById('modalBusNumber').textContent = bus.busNumber;
                document.getElementById('modalBusRoute').textContent = bus.routeName || 'N/A';
                document.getElementById('modalBusDriver').textContent = bus.driverName || 'No driver';
                document.getElementById('modalBusStatus').textContent = bus.status;
                document.getElementById('modalBusCapacity').textContent = bus.capacity;
                document.getElementById('modalBusLocation').textContent = 
                    bus.latitude && bus.longitude ? 
                    `${bus.latitude.toFixed(4)}, ${bus.longitude.toFixed(4)}` : 'N/A';
                document.getElementById('modalBusUpdated').textContent = 
                    new Date(bus.updatedAt).toLocaleString();
                
                // Set edit form values
                document.getElementById('editBusId').value = bus._id;
                document.getElementById('editBusNumber').value = bus.busNumber;
                document.getElementById('editBusRoute').value = bus.routeName || '';
                document.getElementById('editBusCapacity').value = bus.capacity || '';
                document.getElementById('editBusStatus').value = bus.status;
                
                openModal('busModal');
            })
            .catch(error => {
                console.error('Error loading bus:', error);
                alert('Error loading bus data');
            });
    } else {
        // Clear form for new bus
        document.getElementById('busForm').reset();
        document.getElementById('modalTitle').textContent = 'Add New Bus';
        openModal('busModal');
    }
}

// Delete Confirmations
function initDeleteConfirmations() {
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const type = this.dataset.type; // 'user' or 'bus'
            const id = this.dataset.id;
            const name = this.dataset.name;
            
            if (confirm(`Are you sure you want to delete ${type}: ${name}?`)) {
                // Perform deletion via AJAX
                fetch(`/admin/${type}s/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
                        location.reload();
                    } else {
                        alert('Error: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Delete error:', error);
                    alert('Error deleting item');
                });
            }
        });
    });
}

// Form Validations
function initFormValidations() {
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function(e) {
            const password = document.getElementById('userPassword').value;
            const confirmPassword = document.getElementById('userConfirmPassword').value;
            
            if (password && password !== confirmPassword) {
                e.preventDefault();
                alert('Passwords do not match!');
                return false;
            }
            
            if (password && password.length < 6) {
                e.preventDefault();
                alert('Password must be at least 6 characters!');
                return false;
            }
        });
    }
    
    const busForm = document.getElementById('busForm');
    if (busForm) {
        busForm.addEventListener('submit', function(e) {
            const busNumber = document.getElementById('busNumber').value;
            if (!busNumber) {
                e.preventDefault();
                alert('Bus number is required!');
                return false;
            }
        });
    }
}

// Filter Management
function initFilters() {
    // Role filter
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', function() {
            filterUsers();
        });
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterBuses();
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            if (window.location.pathname.includes('/users')) {
                filterUsers();
            } else if (window.location.pathname.includes('/buses')) {
                filterBuses();
            }
        }, 300));
    }
}

function filterUsers() {
    const role = document.getElementById('roleFilter')?.value || 'all';
    const search = document.getElementById('searchInput')?.value || '';
    
    let url = `/admin/users?role=${role}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    
    window.location.href = url;
}

function filterBuses() {
    const status = document.getElementById('statusFilter')?.value || 'all';
    const search = document.getElementById('searchInput')?.value || '';
    
    let url = `/admin/buses?status=${status}`;
    if (search) {
        url += `&search=${encodeURIComponent(search)}`;
    }
    
    window.location.href = url;
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Real-time Updates
function initRealTimeUpdates() {
    const socket = io();
    
    // Listen for bus updates
    socket.on('bus-update', function(busData) {
        console.log('Real-time bus update:', busData);
        
        // Update bus status on dashboard
        updateBusStatus(busData);
        
        // Update map marker if on monitor page
        updateMapMarker(busData);
    });
    
    // Listen for user activities
    socket.on('user-activity', function(activity) {
        console.log('User activity:', activity);
        addActivityLog(activity);
    });
}

function updateBusStatus(busData) {
    // Update bus status in tables/lists
    const busElement = document.querySelector(`[data-bus-id="${busData.busId}"]`);
    if (busElement) {
        const statusElement = busElement.querySelector('.bus-status');
        if (statusElement) {
            statusElement.textContent = busData.status;
            statusElement.className = `bus-status status-${busData.status}`;
        }
    }
}

function updateMapMarker(busData) {
    // This will be implemented in admin-map.js
}

function addActivityLog(activity) {
    const activityList = document.querySelector('.activity-list');
    if (activityList) {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-details">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
            </div>
            <div class="activity-time">
                Just now
            </div>
        `;
        
        // Add to top of list
        activityList.insertBefore(activityItem, activityList.firstChild);
        
        // Limit list to 10 items
        if (activityList.children.length > 10) {
            activityList.removeChild(activityList.lastChild);
        }
    }
}

// Dashboard Charts
function initDashboardCharts() {
    const ctx = document.getElementById('usageChart').getContext('2d');
    
    // Fetch real data from API
    fetch('/admin/api/analytics/usage')
        .then(response => response.json())
        .then(data => {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Active Users',
                        data: data.activeUsers || [65, 59, 80, 81, 56, 55, 40],
                        backgroundColor: 'rgba(52, 152, 219, 0.2)',
                        borderColor: 'rgba(52, 152, 219, 1)',
                        borderWidth: 2,
                        tension: 0.4
                    }, {
                        label: 'Bus Updates',
                        data: data.busUpdates || [28, 48, 40, 19, 86, 27, 90],
                        backgroundColor: 'rgba(46, 204, 113, 0.2)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 2,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Weekly Activity'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                drawBorder: false
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error loading chart data:', error);
        });
}

// Export functionality
function exportData(type, format) {
    let url = `/admin/api/export/${type}`;
    if (format) {
        url += `?format=${format}`;
    }
    
    window.open(url, '_blank');
}

// Bulk operations
function handleBulkOperation(operation) {
    const checkboxes = document.querySelectorAll('.bulk-select:checked');
    if (checkboxes.length === 0) {
        alert('Please select items to perform bulk operation');
        return;
    }
    
    const ids = Array.from(checkboxes).map(cb => cb.value);
    
    if (operation === 'delete') {
        if (!confirm(`Are you sure you want to delete ${ids.length} items?`)) {
            return;
        }
    }
    
    fetch(`/admin/${operation}/bulk`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`${data.message}. ${ids.length} items processed.`);
            location.reload();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Bulk operation error:', error);
        alert('Error performing bulk operation');
    });
}

// Select all checkboxes
function selectAll(checkbox) {
    document.querySelectorAll('.bulk-select').forEach(cb => {
        cb.checked = checkbox.checked;
    });
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/logout';
    }
}