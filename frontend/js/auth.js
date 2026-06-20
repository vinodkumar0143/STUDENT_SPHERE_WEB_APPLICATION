// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // --- AUTHENTICATION PROTECTION & SESSION HANDLING ---
    const checkAuth = () => {
        // If we are precisely on the protected dashboard page
        if (document.body.classList.contains('dashboard-page')) {
            const token = localStorage.getItem('token');
            const userEmail = localStorage.getItem('userEmail');

            // 1. Kick out unauthorized users instantly
            if (!token) {
                globalThis.location.href = 'login.html';
                return;
            }

            // 2. Safely populate user information dynamically
            const userName = localStorage.getItem('userName');
            const welcomeMessage = document.getElementById('welcome-message');
            
            const displayWelcome = (name) => {
                if (welcomeMessage && name) {
                    welcomeMessage.textContent = `Welcome, ${name}`;
                }
            };

            if (userName) {
                displayWelcome(userName);
            } else if (userEmail) {
                displayWelcome(userEmail);
            }

            // Sync user name from backend
            fetch('http://localhost:5000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Failed to fetch user');
            })
            .then(data => {
                if (data.name) {
                    localStorage.setItem('userName', data.name);
                    displayWelcome(data.name);
                }
                if (data._id) {
                    localStorage.setItem('userId', data._id);
                }
            })
            .catch(err => console.error('Error syncing username:', err));

            // 3. Attach standard Logout tracking
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userId');
                    globalThis.location.href = 'login.html';
                });
            }
        }
    };

    // Run auth check immediately upon loading
    checkAuth();

    // Select elements
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const alertMessage = document.getElementById('alert-message');
    const togglePassword = document.getElementById('toggle-password');

    // Toggle Password Visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            // Toggle the eye icon appearance (optional, but requested for user feedback)
            togglePassword.style.opacity = type === 'password' ? '1' : '0.5';
        });
    }

    // Display messages securely in the UI with dynamic animations
    const showMessage = (message, isError = false) => {
        // Remove classes to reset the animation state
        alertMessage.className = 'alert hidden';
        // eslint-disable-next-line no-unused-expressions
        alertMessage.offsetWidth; // Force DOM reflow to restart CSS animations instantly
        
        // Inject rich innerHTML for premium aesthetic
        alertMessage.innerHTML = `<strong>${isError ? '⚠️ Error:' : '✨ Success:'}</strong> <span style="opacity: 0.95">${message}</span>`;
        
        // Apply final classes
        alertMessage.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
    };

    // REGISTER FUNCTIONALITY
    const registerUser = async (e) => {
        e.preventDefault();
        
        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!name || !email || !password) {
            showMessage('Please enter Name, Email, and Password to register', true);
            return;
        }

        if (password.length < 8) {
            showMessage('Password must be 8 characters or above', true);
            return;
        }

        try {
            // Send POST request to backend API
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Success
                showMessage('User registered successfully!', false);
                passwordInput.value = ''; // clear password for safety
            } else {
                // Backend error (e.g. duplicate email)
                showMessage(data.message || 'Registration failed', true);
            }
        } catch (error) {
            console.error('Registration error:', error);
            // Network or server error
            showMessage('Server connection failed. Ensure backend is running.', true);
        }
    };

    // LOGIN FUNCTIONALITY
    const loginUser = async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            showMessage('Please enter both email and password', true);
            return;
        }

        try {
            // Send POST request to backend API
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Success: Securely store token, email and username in localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('userEmail', data.email);
                if(data.name) localStorage.setItem('userName', data.name);
                if(data.id) localStorage.setItem('userId', data.id);

                showMessage('Login successful! Redirecting...', false);

                // Redirect to dashboard page
                setTimeout(() => {
                    globalThis.location.href = 'dashboard.html';
                }, 1000);
            } else {
                // Backend error (e.g. invalid credentials)
                showMessage(data.message || 'Login failed', true);
            }
        } catch (error) {
            console.error('Login error:', error);
            // Network or server error
            showMessage('Server connection failed. Ensure backend is running.', true);
        }
    };

    // FORGOT PASSWORD FUNCTIONALITY
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();

        if (!email) {
            showMessage('Please enter your email address', true);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (response.ok) {
                // If there's a preview link from the backend (for testing purposes), show it beautifully
                let successHtml = 'Recovery link generated successfully!';
                if (data.previewLink) {
                    successHtml += `<br><br><a href="${data.previewLink}" style="color: #6366f1; text-decoration: underline; font-weight: bold;">[ CLICK HERE TO RESET TEST PASSWORD ]</a>`;
                } else {
                    successHtml += ' Please check your email inbox.';
                }
                
                showMessage(successHtml, false);
                emailInput.value = '';
            } else {
                showMessage(data.message || 'Recovery failed', true);
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            showMessage('Server connection failed.', true);
        }
    };

    // RESET PASSWORD FUNCTIONALITY
    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        const newPassword = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!newPassword || !confirmPassword) {
            showMessage('Please fill in all fields', true);
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('Passwords do not match!', true);
            return;
        }

        if (newPassword.length < 8) {
            showMessage('Password must be at least 8 characters long', true);
            return;
        }

        // Extract token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (!token) {
            showMessage('Invalid or missing reset token', true);
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword }),
            });

            const data = await response.json();
            if (response.ok) {
                showMessage('Password updated! Redirecting to login...', false);
                setTimeout(() => {
                    globalThis.location.href = 'login.html';
                }, 2000);
            } else {
                showMessage(data.message || 'Reset failed', true);
            }
        } catch (error) {
            console.error('Reset error:', error);
            showMessage('Server connection failed.', true);
        }
    };

    // Attach event listeners safely to prevent null errors on different pages
    if (registerBtn) registerBtn.addEventListener('click', registerUser);
    if (loginBtn) loginBtn.addEventListener('click', loginUser);

    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) forgotForm.addEventListener('submit', handleForgotPassword);

    const resetForm = document.getElementById('reset-form');
    if (resetForm) resetForm.addEventListener('submit', handleResetPassword);
});
