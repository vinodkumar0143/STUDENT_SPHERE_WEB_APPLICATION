// Profile Functionality Scripts

// 1. AUTH PROTECTION
const token = localStorage.getItem('token');
const API_BASE_URL = 'https://student-sphere-backend-46o4.onrender.com/api/profile';

function checkAuth() {
    if (!token) {
        globalThis.location.href = 'login.html';
    }
}
checkAuth();

// DOM Elements
const profileForm = document.getElementById('profileForm');
const alertContainer = document.getElementById('alertContainer');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const logoutBtn = document.getElementById('logoutBtn');

function showAlert(message, isError = false) {
    alertContainer.textContent = message;
    alertContainer.classList.remove('hidden');
    alertContainer.style.backgroundColor = isError ? '#fdecea' : '#e8f5e9';
    alertContainer.style.color = isError ? '#c62828' : '#2e7d32';
    alertContainer.style.border = `1px solid ${isError ? '#f44336' : '#4caf50'}`;
    alertContainer.style.padding = '1rem';
    alertContainer.style.borderRadius = '8px';
    alertContainer.style.fontWeight = '600';

    if (isError) {
        clearTimeout(globalThis._alertTimer);
        globalThis._alertTimer = setTimeout(() => alertContainer.classList.add('hidden'), 6000);
    }
}

// 2. LOAD PROFILE - Auto fill all fields from DB on page load
async function loadProfile() {
    if (!token) return;

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            globalThis.location.href = 'login.html';
            return;
        }

        const profileData = await response.json();

        if (response.ok && profileData?._id) {
            document.getElementById('name').value = profileData.name || '';
            document.getElementById('age').value = profileData.age || '';
            document.getElementById('college').value = profileData.college || '';
            document.getElementById('branch').value = profileData.branch || '';
            document.getElementById('phone').value = profileData.phone || '';
            document.getElementById('linkedin').value = profileData.linkedin || '';
            document.getElementById('github').value = profileData.github || '';
            document.getElementById('bio').value = profileData.bio || '';

            // Show email from the linked User account
            if (profileData.userId?.email) {
                document.getElementById('emailDisplay').value = profileData.userId.email;
            }

            // Show saved profile image
            if (profileData.profileImage) {
                document.getElementById('imagePreview').src = profileData.profileImage;
            }

            // Convert skills array back to comma-separated string for the input
            if (profileData.skills && Array.isArray(profileData.skills)) {
                document.getElementById('skills').value = profileData.skills.join(', ');
            }

            // Load additional resume details from localStorage
            const userId = profileData.userId?._id || localStorage.getItem('userId');
            if (userId) {
                const extraDataString = localStorage.getItem(`profile_extra_${userId}`);
                if (extraDataString) {
                    try {
                        const extraData = JSON.parse(extraDataString);
                        document.getElementById('schooling').value = extraData.schooling || '';
                        document.getElementById('intermediate').value = extraData.intermediate || '';
                        document.getElementById('extraProjects').value = extraData.extraProjects || '';
                        document.getElementById('experience').value = extraData.experience || '';
                        document.getElementById('certifications').value = extraData.certifications || '';
                        document.getElementById('achievements').value = extraData.achievements || '';
                        document.getElementById('extracurricular').value = extraData.extracurricular || '';
                    } catch (e) {
                        console.error('Error parsing extra resume details:', e);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Load profile error:', error);
    }
}

// 3. SAVE PROFILE - with guaranteed auto-refresh on success
async function saveProfile(e) {
    e.preventDefault();

    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = 'Saving...';

    let linkedin = document.getElementById('linkedin').value.trim();
    let github = document.getElementById('github').value.trim();

    if (linkedin && !/^https?:\/\//i.test(linkedin)) {
        linkedin = 'https://' + linkedin;
        document.getElementById('linkedin').value = linkedin;
    }
    if (github && !/^https?:\/\//i.test(github)) {
        github = 'https://' + github;
        document.getElementById('github').value = github;
    }

    const formData = new FormData();
    formData.append('name', document.getElementById('name').value.trim());
    formData.append('age', document.getElementById('age').value.trim());
    formData.append('college', document.getElementById('college').value.trim());
    formData.append('branch', document.getElementById('branch').value.trim());
    formData.append('phone', document.getElementById('phone').value.trim());
    formData.append('linkedin', linkedin);
    formData.append('github', github);
    formData.append('bio', document.getElementById('bio').value.trim());
    formData.append('skills', document.getElementById('skills').value.trim());

    // Attach image file if user chose one
    const fileInput = document.getElementById('profileImage');
    if (fileInput && fileInput.files.length > 0) {
        formData.append('profileImage', fileInput.files[0]);
    }

    // Email is intentionally NOT sent — it belongs to the User model, not Profile

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // DO NOT manually set Content-Type — browser sets multipart/form-data boundary automatically
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // SUCCESS — show green message
            showAlert('✅ Profile updated! Changes are live on the server.');
            
            // Save additional optional resume details to localStorage
            const userId = data.profile?.userId || localStorage.getItem('userId');
            if (userId) {
                const extraData = {
                    schooling: document.getElementById('schooling').value.trim(),
                    intermediate: document.getElementById('intermediate').value.trim(),
                    extraProjects: document.getElementById('extraProjects').value.trim(),
                    experience: document.getElementById('experience').value.trim(),
                    certifications: document.getElementById('certifications').value.trim(),
                    achievements: document.getElementById('achievements').value.trim(),
                    extracurricular: document.getElementById('extracurricular').value.trim()
                };
                localStorage.setItem(`profile_extra_${userId}`, JSON.stringify(extraData));
            }

            // Restore button
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'Updated! ✅';
            setTimeout(() => {
                saveProfileBtn.textContent = 'Save & Update Profile';
            }, 3000);
        } else {
            // Show exact backend error so we can debug
            const errMsg = data.debug || data.message || `Server error (${response.status})`;
            showAlert('❌ ' + errMsg, true);
            saveProfileBtn.disabled = false;
            saveProfileBtn.textContent = 'Save & Update Profile';
        }
    } catch (err) {
        console.error('Profile save error:', err);
        showAlert('❌ Cannot reach server. Ensure the backend is running.', true);
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = 'Save & Update Profile';
    }
}

// Live local image preview before upload
const profileImageInput = document.getElementById('profileImage');
const imagePreview = document.getElementById('imagePreview');
if (profileImageInput && imagePreview) {
    profileImageInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => { imagePreview.src = e.target.result; };
            reader.readAsDataURL(file);
        }
    });
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        globalThis.location.href = 'login.html';
    });
}

// Attach form submit handler
if (profileForm) {
    profileForm.addEventListener('submit', saveProfile);
}

// Load profile data immediately when DOM is ready
document.addEventListener('DOMContentLoaded', loadProfile);

// 4. URL INPUT AUTO-FORMAT ON BLUR
function autoFormatUrlInput(e) {
    let val = e.target.value.trim();
    if (val && !/^https?:\/\//i.test(val)) {
        e.target.value = 'https://' + val;
    }
}
const linkedinEl = document.getElementById('linkedin');
const githubEl = document.getElementById('github');
if (linkedinEl) linkedinEl.addEventListener('blur', autoFormatUrlInput);
if (githubEl) githubEl.addEventListener('blur', autoFormatUrlInput);


