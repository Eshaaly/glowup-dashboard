// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const { jsPDF } = window.jspdf;

// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const globalSearch = document.getElementById('globalSearch');
const contentSections = document.querySelectorAll('.content-section');
const navLinks = document.querySelectorAll('.nav-menu a');
const currentSectionTitle = document.getElementById('currentSection');

// App State
let currentUser = null;
let habits = [];
let assignments = [];

// Initialize the application
function initApp() {
    setupTheme();
    setupClock();
    setupNavigation();
    setupFirebaseAuth();
    loadDashboardContent();
}

// Theme Management
function setupTheme() {
    // Load saved theme or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.dataset.theme = savedTheme;
    
    // Update toggle icon
    themeToggle.innerHTML = savedTheme === 'dark' 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
    
    // Toggle theme on click
    themeToggle.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    
    themeToggle.innerHTML = newTheme === 'dark' 
        ? '<i class="fas fa-sun"></i>' 
        : '<i class="fas fa-moon"></i>';
}

// Clock Functionality
function setupClock() {
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        document.querySelector('#clockWidget span').textContent = timeString;
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

// Navigation System
function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Show corresponding section
            const section = link.dataset.section;
            currentSectionTitle.textContent = link.textContent;
            
            contentSections.forEach(sec => sec.classList.remove('active'));
            document.getElementById(`${section}-section`).classList.add('active');
            
            // Load section content if needed
            if (section === 'school') loadSchoolContent();
            else if (section === 'habits') loadHabitsContent();
        });
    });
}

// Firebase Authentication
function setupFirebaseAuth() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadUserData(user.uid);
        } else {
            auth.signInAnonymously()
                .then(() => console.log("Signed in anonymously"))
                .catch(error => console.error("Anonymous auth failed:", error));
        }
    });
}

// Data Loading
function loadUserData(userId) {
    // Load habits
    db.collection('users').doc(userId).collection('habits')
        .onSnapshot(snapshot => {
            habits = [];
            snapshot.forEach(doc => {
                habits.push({ id: doc.id, ...doc.data() });
            });
            updateHabitsUI();
        });
    
    // Load assignments
    db.collection('users').doc(userId).collection('assignments')
        .orderBy('dueDate').onSnapshot(snapshot => {
            assignments = [];
            snapshot.forEach(doc => {
                assignments.push({ id: doc.id, ...doc.data() });
            });
            updateAssignmentsUI();
        });
}

// Dashboard Content
function loadDashboardContent() {
    const dashboardSection = document.getElementById('dashboard-section');
    
    // Create dashboard grid
    dashboardSection.innerHTML = `
        <div class="dashboard-grid">
            <div class="card calendar-card">
                <h2><i class="far fa-calendar-alt"></i> Master Calendar</h2>
                <div id="calendar"></div>
            </div>
            
            <div class="card routine-card">
                <h2><i class="fas fa-tasks"></i> Daily Routine</h2>
                <div id="routine-list"></div>
            </div>
            
            <div class="card habits-card">
                <h2><i class="fas fa-check-circle"></i> Habit Tracker</h2>
                <div id="habits-list"></div>
            </div>
            
            <div class="card school-preview-card">
                <h2><i class="fas fa-graduation-cap"></i> School Preview</h2>
                <div id="assignments-preview"></div>
            </div>
        </div>
    `;
    
    // Initialize calendar
    initCalendar();
    loadRoutine();
    updateHabitsUI();
    updateAssignmentsUI();
}

// School Hub Content
function loadSchoolContent() {
    const schoolSection = document.getElementById('school-section');
    
    schoolSection.innerHTML = `
        <div class="school-tabs">
            <button class="school-tab active" data-tab="assignments">Assignments</button>
            <button class="school-tab" data-tab="classes">Classes</button>
            <button class="school-tab" data-tab="test-prep">Test Prep</button>
        </div>
        
        <div class="school-content active" id="school-assignments">
            <div class="assignment-controls">
                <button id="add-assignment"><i class="fas fa-plus"></i> Add Assignment</button>
                <button id="export-assignments"><i class="fas fa-file-pdf"></i> Export to PDF</button>
            </div>
            <table id="assignments-table">
                <thead>
                    <tr>
                        <th>Class</th>
                        <th>Assignment</th>
                        <th>Due Date</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
        
        <div class="school-content" id="school-classes">
            <!-- Classes content will be loaded here -->
        </div>
        
        <div class="school-content" id="school-test-prep">
            <!-- Test prep content will be loaded here -->
        </div>
    `;
    
    // Set up school tab navigation
    document.querySelectorAll('.school-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('.school-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show corresponding content
            document.querySelectorAll('.school-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`school-${tabId}`).classList.add('active');
        });
    });
    
    // Set up PDF export
    document.getElementById('export-assignments').addEventListener('click', exportAssignmentsToPDF);
}

// PDF Export Functionality
function exportAssignmentsToPDF() {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('School Assignments Report', 105, 20, { align: 'center' });
    
    // Date
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });
    
    // Table headers
    doc.setFontSize(14);
    doc.text('Class', 20, 50);
    doc.text('Assignment', 60, 50);
    doc.text('Due Date', 120, 50);
    doc.text('Status', 160, 50);
    
    // Assignment data
    let y = 60;
    assignments.forEach(assignment => {
        doc.setFontSize(12);
        doc.text(assignment.class || '', 20, y);
        doc.text(assignment.name || '', 60, y);
        doc.text(assignment.dueDate ? new Date(assignment.dueDate.seconds * 1000).toLocaleDateString() : '', 120, y);
        doc.text(assignment.status || '', 160, y);
        y += 10;
    });
    
    // Save the PDF
    doc.save('assignments-report.pdf');
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);