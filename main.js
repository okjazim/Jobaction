// ============================================
// API CONFIGURATION
// ============================================

// Base URL for your Flask backend API
// Change this to match your Flask server URL
const API_BASE_URL = 'http://localhost:5000/api';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Shows an error message in the specified error container
 * @param {string} errorElementId - ID of the error message element
 * @param {string} message - Error message to display
 */
function showError(errorElementId, message) {
  const errorElement = document.getElementById(errorElementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
    // Hide error after 5 seconds
    setTimeout(() => {
      errorElement.classList.remove('show');
    }, 5000);
  }
}

/**
 * Hides an error message
 * @param {string} errorElementId - ID of the error message element
 */
function hideError(errorElementId) {
  const errorElement = document.getElementById(errorElementId);
  if (errorElement) {
    errorElement.classList.remove('show');
    errorElement.textContent = '';
  }
}

/**
 * Stores authentication token and user data in localStorage
 * @param {string} token - JWT token from Supabase
 * @param {object} userData - Full user data object from Supabase
 */
function saveAuthToken(token, userData) {
  localStorage.setItem('authToken', token);
  if (userData) {
    localStorage.setItem('authUser', JSON.stringify(userData));
  }
}

/**
 * Gets authentication token from localStorage
 * @returns {string|null} - JWT token or null if not found
 */
function getAuthToken() {
  return localStorage.getItem('authToken');
}

/**
 * Removes authentication token from localStorage (logout)
 */
function clearAuthToken() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
}

// ============================================
// TAB SWITCHING FUNCTIONALITY
// ============================================

/**
 * Switches between Login and Signup tabs
 */
function setupTabSwitching() {
  // Get references to tab buttons
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  
  // Get references to forms
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  // When Login tab is clicked
  loginTab.addEventListener('click', () => {
    // Remove 'active' class from both tabs
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    
    // Show login form, hide signup form
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    
    // Clear any error messages
    hideError('loginError');
    hideError('signupError');
  });

  // When Signup tab is clicked
  signupTab.addEventListener('click', () => {
    // Remove 'active' class from both tabs
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    
    // Show signup form, hide login form
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
    
    // Clear any error messages
    hideError('loginError');
    hideError('signupError');
  });
}

// ============================================
// LOGIN FUNCTIONALITY
// ============================================

/**
 * Handles login form submission
 * @param {Event} event - Form submit event
 */
async function handleLogin(event) {
  // Prevent default form submission (page reload)
  event.preventDefault();
  
  // Hide any previous error messages
  hideError('loginError');
  
  // Get form input values
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  // Basic validation
  if (!email || !password) {
    showError('loginError', 'Please fill in all fields');
    return;
  }
  
  try {
    // Make API call to Flask backend
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    
    // Parse JSON response
    const data = await response.json();
    
    // Check if request was successful (status 200-299)
    if (response.ok) {
      // Login successful!
      // Supabase returns: { user: {...}, session: { access_token: "...", ... } }
      if (data.session && data.session.access_token) {
        // Save the token and user data for future API calls
        saveAuthToken(data.session.access_token, data);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
      } else {
        showError('loginError', 'Login successful but no token received');
      }
    } else {
      // Login failed - show error message
      showError('loginError', data.error || 'Login failed. Please try again.');
    }
  } catch (error) {
    // Network error or other exception
    console.error('Login error:', error);
    showError('loginError', 'Network error. Make sure your Flask server is running.');
  }
}

// ============================================
// SIGNUP FUNCTIONALITY
// ============================================

/**
 * Handles signup form submission
 * @param {Event} event - Form submit event
 */
async function handleSignup(event) {
  // Prevent default form submission (page reload)
  event.preventDefault();
  
  // Hide any previous error messages
  hideError('signupError');
  
  // Get form input values
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  
  // Basic validation
  if (!email || !password) {
    showError('signupError', 'Please fill in all fields');
    return;
  }
  
  if (password.length < 6) {
    showError('signupError', 'Password must be at least 6 characters');
    return;
  }
  
  try {
    // Make API call to Flask backend
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    
    // Parse JSON response
    const data = await response.json();
    
    // Check if request was successful (status 200-299)
    if (response.ok) {
      // Signup successful!
      // Supabase returns user data
      showError('signupError', 'Account created! Please login.');
      
      // Switch to login tab after 2 seconds
      setTimeout(() => {
        document.getElementById('loginTab').click();
        document.getElementById('loginEmail').value = email;
      }, 2000);
    } else {
      // Signup failed - show error message
      showError('signupError', data.error || 'Signup failed. Please try again.');
    }
  } catch (error) {
    // Network error or other exception
    console.error('Signup error:', error);
    showError('signupError', 'Network error. Make sure your Flask server is running.');
  }
}

// ============================================
// DASHBOARD FUNCTIONALITY
// ============================================

/**
 * Checks if user is authenticated, redirects to login if not
 */
function checkAuth() {
  if (!getAuthToken()) {
    window.location.href = 'home.html';
    return false;
  }
  return true;
}

/**
 * Loads user information and displays it
 */
async function loadUserInfo() {
  const userEmailSpan = document.getElementById('userEmail');
  if (userEmailSpan) {
    // For now, we'll get email from localStorage or token
    // In a real app, you'd decode the JWT or make an API call
    const userData = localStorage.getItem('authUser');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.user && user.user.email) {
          userEmailSpan.textContent = user.user.email;
        }
      } catch (e) {
        userEmailSpan.textContent = 'User';
      }
    }
  }
}

/**
 * Handles job posting form submission
 */
async function handlePostJob(event) {
  event.preventDefault();
  hideError('jobFormError');
  
  const title = document.getElementById('jobTitle').value.trim();
  const company = document.getElementById('jobCompany').value.trim();
  const location = document.getElementById('jobLocation').value.trim();
  const description = document.getElementById('jobDescription').value.trim();
  const salary = document.getElementById('jobSalary').value.trim();
  
  if (!title || !company || !location || !description) {
    showError('jobFormError', 'Please fill in all required fields');
    return;
  }
  
  const jobData = {
    title,
    company,
    location,
    description
  };
  
  if (salary) {
    jobData.salary = salary;
  }
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(jobData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Success! Reset form and reload jobs
      document.getElementById('postJobForm').reset();
      document.getElementById('postJobForm').style.display = 'none';
      loadPostedJobs();
      alert('Job posted successfully!');
    } else {
      showError('jobFormError', data.error || 'Failed to post job');
    }
  } catch (error) {
    console.error('Post job error:', error);
    showError('jobFormError', 'Network error. Please try again.');
  }
}

/**
 * Loads and displays posted jobs
 */
async function loadPostedJobs() {
  const container = document.getElementById('postedJobsContainer');
  if (!container) return;
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const jobs = await response.json();
    
    if (response.ok && Array.isArray(jobs) && jobs.length > 0) {
      container.innerHTML = jobs.map(job => `
        <div class="job-card">
          <h4>${escapeHtml(job.title)}</h4>
          <p class="company">${escapeHtml(job.company)}</p>
          <p class="location"><i class="fa fa-map-marker"></i> ${escapeHtml(job.location)}</p>
          ${job.salary ? `<p class="salary"><i class="fa fa-money"></i> ${escapeHtml(job.salary)}</p>` : ''}
          <p class="description">${escapeHtml(job.description)}</p>
          <div class="job-actions">
            <button class="btn btn-primary btn-small" onclick="viewJob(${job.id})">View</button>
            <button class="btn btn-danger btn-small" onclick="deleteJob(${job.id})">Delete</button>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="empty-state">No jobs posted yet. Post your first job above!</p>';
    }
  } catch (error) {
    console.error('Load jobs error:', error);
    container.innerHTML = '<p class="empty-state">Error loading jobs. Please refresh the page.</p>';
  }
}

/**
 * Loads and displays saved jobs
 */
async function loadSavedJobs() {
  const container = document.getElementById('savedJobsContainer');
  if (!container) return;

  try {
    const savedJobs = await getSavedJobs();

    if (savedJobs.length > 0) {
      container.innerHTML = savedJobs.map(saved => {
        const job = saved.jobs;
        return `
          <div class="job-card">
            <h4>${escapeHtml(job?.title || 'Untitled role')}</h4>
            <p class="company">${escapeHtml(job?.company || 'Unknown company')}</p>
            <div class="job-meta">
              <span><i class="fa fa-map-marker"></i> ${escapeHtml(job?.location || 'Location not provided')}</span>
              ${job?.salary ? `<span><i class="fa fa-money"></i> ${escapeHtml(job.salary)}</span>` : ''}
            </div>
            <p class="description">${escapeHtml(job?.description || '')}</p>
            <div class="job-actions-row">
              <button class="btn btn-primary btn-small" onclick="applyToJob(${job?.id})">Apply</button>
              <button class="btn btn-danger btn-small" onclick="saveJob(${job?.id})">Unsave</button>
            </div>
          </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '<p class="empty-state">No saved jobs yet. Browse jobs and save your favorites!</p>';
    }
  } catch (error) {
    console.error('Load saved jobs error:', error);
    container.innerHTML = '<p class="empty-state">Error loading saved jobs. Please refresh.</p>';
  }
}

/**
 * Loads and displays applications
 */
async function loadApplications() {
  const container = document.getElementById('applicationsContainer');
  if (!container) return;

  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/applications`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const applications = await response.json();

    if (response.ok && Array.isArray(applications) && applications.length > 0) {
      container.innerHTML = applications.map(app => `
        <div class="application-card">
          <h4>${escapeHtml(app.jobs?.title || 'Unknown Job')}</h4>
          <p class="company">${escapeHtml(app.jobs?.company || 'Unknown Company')}</p>
          <p class="location"><i class="fa fa-map-marker"></i> ${escapeHtml(app.jobs?.location || 'Location not provided')}</p>
          ${app.jobs?.salary ? `<p class="salary"><i class="fa fa-money"></i> ${escapeHtml(app.jobs.salary)}</p>` : ''}
          <p class="status">Status: <span class="status-${app.status}">${app.status}</span></p>
          <p class="applied-date">Applied: ${new Date(app.applied_at).toLocaleDateString()}</p>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p class="empty-state">No applications yet. Start applying to jobs!</p>';
    }
  } catch (error) {
    console.error('Load applications error:', error);
    container.innerHTML = '<p class="empty-state">Error loading applications. Please refresh.</p>';
  }
}

// ============================================
// JOBS PAGE FUNCTIONALITY
// ============================================

/**
 * Fetches jobs from the API and applies client-side filters
 * @param {string} keyword
 * @param {string} location
 */
async function loadJobs(keyword = '', location = '') {
  const listContainer = document.getElementById('jobsList');
  const jobsCount = document.getElementById('jobsCount');
  if (!listContainer) return;

  try {
    const response = await fetch(`${API_BASE_URL}/jobs`);
    const jobs = await response.json();

    const filtered = Array.isArray(jobs)
      ? jobs.filter(job => {
          const matchesKeyword = keyword
            ? [job.title, job.company, job.description].some(field =>
                (field || '').toLowerCase().includes(keyword.toLowerCase()))
            : true;
          const matchesLocation = location
            ? (job.location || '').toLowerCase().includes(location.toLowerCase())
            : true;
          return matchesKeyword && matchesLocation;
        })
      : [];

    if (jobsCount) {
      jobsCount.textContent = `${filtered.length} job${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = '<p class="empty-state">No jobs found. Try a different search.</p>';
      return;
    }

    listContainer.innerHTML = filtered.map(job => `
      <div class="job-card">
        <h4>${escapeHtml(job.title || 'Untitled role')}</h4>
        <p class="company">${escapeHtml(job.company || 'Unknown company')}</p>
        <div class="job-meta">
          <span><i class="fa fa-map-marker"></i> ${escapeHtml(job.location || 'Location not provided')}</span>
          ${job.salary ? `<span><i class="fa fa-money"></i> ${escapeHtml(job.salary)}</span>` : ''}
        </div>
        <p class="description">${escapeHtml(job.description || '')}</p>
        <div class="job-actions-row">
          <button class="btn btn-primary btn-small" onclick="applyToJob(${job.id})">Apply</button>
          <button class="btn btn-ghost btn-small" onclick="saveJob(${job.id})">Save</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Load jobs error:', error);
    listContainer.innerHTML = '<p class="empty-state">Error loading jobs. Please refresh.</p>';
    if (jobsCount) jobsCount.textContent = '0 jobs';
  }
}

/**
 * Handles search form submit on jobs page
 */
function handleJobSearch(event) {
  event.preventDefault();
  const keywordInput = document.getElementById('searchKeyword');
  const locationInput = document.getElementById('searchLocation');
  const keyword = keywordInput ? keywordInput.value.trim() : '';
  const location = locationInput ? locationInput.value.trim() : '';
  loadJobs(keyword, location);
}

// Apply to a job
async function applyToJob(jobId) {
  const token = getAuthToken();
  if (!token) {
    alert('You need to be logged in to apply for jobs.');
    window.location.href = 'home.html';
    return;
  }

  if (!confirm('Are you sure you want to apply for this job?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        job_id: jobId
      })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Application submitted successfully!');
      // Refresh the jobs page to update the UI
      if (window.location.pathname.includes('jobs.html')) {
        loadJobs();
      }
    } else {
      alert(data.error || 'Failed to apply for job. Please try again.');
    }
  } catch (error) {
    console.error('Apply job error:', error);
    alert('Network error. Please try again.');
  }
}

// Save or unsave a job
async function saveJob(jobId) {
  const token = getAuthToken();
  if (!token) {
    alert('You need to be logged in to save jobs.');
    window.location.href = 'home.html';
    return;
  }

  try {
    // First check if job is already saved
    const savedJobs = await getSavedJobs();
    const isSaved = savedJobs.some(saved => saved.job_id === jobId);

    if (isSaved) {
      // Unsave the job
      const response = await fetch(`${API_BASE_URL}/saved-jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Job removed from saved jobs.');
      } else {
        alert('Failed to unsave job.');
      }
    } else {
      // Save the job
      const response = await fetch(`${API_BASE_URL}/saved-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          job_id: jobId
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Job saved successfully!');
      } else {
        alert(data.error || 'Failed to save job.');
      }
    }

    // Refresh the jobs page to update the UI
    if (window.location.pathname.includes('jobs.html')) {
      loadJobs();
    }
  } catch (error) {
    console.error('Save job error:', error);
    alert('Network error. Please try again.');
  }
}

// Helper function to get saved jobs
async function getSavedJobs() {
  const token = getAuthToken();
  if (!token) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/saved-jobs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Get saved jobs error:', error);
    return [];
  }
}

// Delete job used on dashboard
async function deleteJob(id) {
  const token = getAuthToken();
  if (!token) {
    alert('You need to be logged in to delete jobs.');
    return;
  }

  if (!confirm('Delete this job?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      // Refresh dashboard jobs if present
      loadPostedJobs();
      alert('Job deleted.');
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to delete job.');
    }
  } catch (error) {
    console.error('Delete job error:', error);
    alert('Network error deleting job.');
  }
}

/**
 * Utility function to escape HTML (prevent XSS)
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Handles logout
 */
function handleLogout() {
  clearAuthToken();
  window.location.href = 'home.html';
}

/**
 * Initializes dashboard page
 */
function initDashboard() {
  // Check authentication first
  if (!checkAuth()) return;
  
  // Load user info
  loadUserInfo();
  
  // Set up job posting form
  const toggleJobFormBtn = document.getElementById('toggleJobForm');
  const postJobForm = document.getElementById('postJobForm');
  const cancelJobFormBtn = document.getElementById('cancelJobForm');
  
  if (toggleJobFormBtn && postJobForm) {
    toggleJobFormBtn.addEventListener('click', () => {
      postJobForm.style.display = postJobForm.style.display === 'none' ? 'block' : 'none';
    });
  }
  
  if (cancelJobFormBtn && postJobForm) {
    cancelJobFormBtn.addEventListener('click', () => {
      postJobForm.style.display = 'none';
      postJobForm.reset();
      hideError('jobFormError');
    });
  }
  
  // Set up job form submission
  const postJobFormElement = document.getElementById('postJobForm');
  if (postJobFormElement) {
    postJobFormElement.addEventListener('submit', handlePostJob);
  }
  
  // Set up logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Load dashboard data
  loadPostedJobs();
  loadSavedJobs();
  loadApplications();
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initializes all event listeners when page loads
 */
function init() {
  // Check which page we're on
  const currentPage = window.location.pathname.split('/').pop() || 'home.html';
  
  if (currentPage === 'dashboard.html') {
    // Initialize dashboard
    initDashboard();
  } else if (currentPage === 'jobs.html') {
    // Jobs listing page
    const searchForm = document.getElementById('jobSearchForm');
    if (searchForm) {
      searchForm.addEventListener('submit', handleJobSearch);
    }
    loadJobs();
  } else {
    // Initialize home page (login/signup)
    setupTabSwitching();
    
    // Attach form submit handlers
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
      signupForm.addEventListener('submit', handleSignup);
    }
    
    // Check if user is already logged in
    if (getAuthToken()) {
      // Redirect to dashboard if already logged in
      window.location.href = 'dashboard.html';
    }
  }
}

// Run initialization when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);

