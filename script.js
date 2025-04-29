// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
    
    // Load saved data
    loadData();
    
    // Set up event listeners
    setupCheckboxes();
});

// Tab functionality
function openTab(evt, tabName) {
    // Get all tab content and hide them
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Get all tab buttons and deactivate them
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show the current tab and mark button as active
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
}

// Checkbox tracking
function setupCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateProgress();
            saveData();
        });
    });
}

// Update progress bar
function updateProgress() {
    const checkboxes = document.querySelectorAll('#routine-list input[type="checkbox"]');
    const total = checkboxes.length;
    let completed = 0;
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) completed++;
    });
    
    const percentage = Math.round((completed / total) * 100);
    document.getElementById('routine-progress').style.width = `${percentage}%`;
    document.getElementById('progress-text').textContent = `${percentage}% Complete`;
}

// Assignment tracking
let assignments = [];

function addAssignment() {
    const name = document.getElementById('assignment-name').value;
    const className = document.getElementById('assignment-class').value;
    const dueDate = document.getElementById('assignment-due').value;
    
    if (name && className && dueDate) {
        const assignment = {
            id: Date.now(),
            name,
            className,
            dueDate,
            priority: 'medium',
            completed: false
        };
        
        assignments.push(assignment);
        renderAssignments();
        saveData();
        
        // Clear form
        document.getElementById('assignment-name').value = '';
    }
}

function renderAssignments() {
    const tbody = document.getElementById('assignments-list');
    tbody.innerHTML = '';
    
    assignments.forEach(assignment => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${assignment.className}</td>
            <td>${assignment.name}</td>
            <td>${new Date(assignment.dueDate).toLocaleDateString()}</td>
            <td>
                <select onchange="updatePriority(${assignment.id}, this.value)">
                    <option value="low" ${assignment.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${assignment.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${assignment.priority === 'high' ? 'selected' : ''}>High</option>
                </select>
            </td>
            <td>
                <button onclick="completeAssignment(${assignment.id})">Complete</button>
                <button onclick="deleteAssignment(${assignment.id})">Delete</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Add more functions for other features...

// Data persistence
function saveData() {
    const data = {
        assignments,
        // Add other data to save...
    };
    localStorage.setItem('glowup-dashboard', JSON.stringify(data));
}

function loadData() {
    const savedData = localStorage.getItem('glowup-dashboard');
    if (savedData) {
        const data = JSON.parse(savedData);
        assignments = data.assignments || [];
        renderAssignments();
        // Load other data...
    }
}

// Initialize with some sample data if empty
if (assignments.length === 0) {
    assignments = [
        {
            id: 1,
            name: 'Math Problem Set',
            className: 'IB Math',
            dueDate: '2023-11-15',
            priority: 'high',
            completed: false
        },
        {
            id: 2,
            name: 'History Essay',
            className: 'IB History',
            dueDate: '2023-11-20',
            priority: 'medium',
            completed: false
        }
    ];
    renderAssignments();
}