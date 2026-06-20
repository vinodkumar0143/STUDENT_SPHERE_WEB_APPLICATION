// Community functionality scripts

// 1. AUTH PROTECTION
const token = localStorage.getItem('token');
const API_BASE_URL = 'http://localhost:5000/api/posts';

function checkAuth() {
    if (!token) {
        globalThis.location.href = 'login.html';
    }
}

checkAuth();

// Decode JWT to know who the current logged-in user is
function getUserIdFromToken() {
    if (!token) return null;
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        return decoded.userId;
    } catch (e) {
        console.error('JWT decode error:', e);
        return null;
    }
}
const currentUserId = getUserIdFromToken();

// Global states
let allPosts = [];

// DOM Elements
const createPostForm = document.getElementById('createPostForm');
const postsContainer = document.getElementById('postsContainer');
const alertContainer = document.getElementById('alertContainer');
const postBtn = document.getElementById('postBtn');
const searchInput = document.getElementById('searchInput');

// Logout logic
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        globalThis.location.href = 'login.html';
    });
}

// Helper: Show UI messages
function showAlert(message, isError = false) {
    alertContainer.textContent = message;
    alertContainer.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
    alertContainer.classList.remove('hidden');
    
    setTimeout(() => {
        alertContainer.classList.add('hidden');
    }, 4000);
}

// Helper: Generate a consistent color from a string
function getColorForName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.codePointAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}

// 2. CREATE POST FORM LOGIC
async function createPost(e) {
    e.preventDefault();
    
    postBtn.disabled = true;
    postBtn.textContent = 'Posting...';

    const title = document.getElementById('postTitle').value;
    const description = document.getElementById('postDescription').value;

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Discussion post created successfully!');
            createPostForm.reset();
            fetchPosts(); 
        } else {
            showAlert(data.message || 'Failed to create post. Try again.', true);
        }
    } catch (error) {
        console.error('Create Post Error:', error);
        showAlert('Network error occurred while creating the post.', true);
    } finally {
        postBtn.disabled = false;
        postBtn.textContent = 'Post Discussion';
    }
}

// 3. FETCH ALL POSTS
async function fetchPosts() {
    try {
        postsContainer.innerHTML = '<p style="text-align: center; color: #64748b;">Loading amazing discussions...</p>';
        
        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            globalThis.location.href = 'login.html';
            return;
        }

        allPosts = await response.json();
        
        if (response.ok) {
            if (searchInput?.value) {
                filterPosts(searchInput.value);
            } else {
                renderPosts(allPosts);
            }
        } else {
            showAlert('Failed to fetch posts from the server', true);
            postsContainer.innerHTML = '<div class="empty-state">Unable to load posts right now.</div>';
        }
    } catch (error) {
        console.error('Fetch Posts Error:', error);
        showAlert('Network error occurred while fetching posts.', true);
        postsContainer.innerHTML = '<div class="empty-state">Network disconnected. Please check your connection.</div>';
    }
}

// Search / Filter Logic
function filterPosts(query) {
    if (!query) {
        renderPosts(allPosts);
        return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = allPosts.filter(post => 
        post.title.toLowerCase().includes(lowerQuery) || 
        post.description.toLowerCase().includes(lowerQuery)
    );
    renderPosts(filtered);
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => filterPosts(e.target.value));
}

// 4. DELETE POST API LOGIC
async function deletePost(postId, btnElement) {
    if(!confirm("Are you sure you want to delete this entire discussion?")) return;

    btnElement.disabled = true;
    btnElement.textContent = 'Deleting...';

    try {
        const response = await fetch(`${API_BASE_URL}/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Post deleted successfully!');
            // Optimize: Update local state instead of duplicate API call
            allPosts = allPosts.filter(p => p._id !== postId);
            renderPosts(allPosts); 
        } else {
            showAlert(data.message || 'Failed to delete post', true);
            btnElement.disabled = false;
            btnElement.textContent = 'Delete Post';
        }
    } catch (error) {
        console.error('Delete Post Error:', error);
        showAlert('Network error while deleting post.', true);
        btnElement.disabled = false;
        btnElement.textContent = 'Delete Post';
    }
}

// 5. LIKE POST API LOGIC
async function likePost(postId, btnElement) {
    try {
        const response = await fetch(`${API_BASE_URL}/${postId}/like`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const likesArray = await response.json();
            // Optimize: Update local state instead of duplicate API call
            const postIndex = allPosts.findIndex(p => p._id === postId);
            if(postIndex !== -1) {
                allPosts[postIndex].likes = likesArray;
            }
            
            const isLiked = likesArray.includes(currentUserId);
            btnElement.className = `btn-like ${isLiked ? 'liked' : ''}`;
            btnElement.innerHTML = `${isLiked ? '❤️' : '🤍'} ${likesArray.length}`;
        } else {
            const data = await response.json();
            showAlert(data.message || 'Failed to like post', true);
        }
    } catch (error) {
        console.error('Like Err:', error);
        showAlert('Network error while liking post.', true);
    }
}

// 6. REPLY SYSTEM API LOGIC
async function addReply(postId, replyText, btnElement) {
    if (!replyText?.trim()) {
        showAlert('Reply text cannot be empty!', true);
        return;
    }

    const originalText = btnElement.textContent;
    btnElement.disabled = true;
    btnElement.textContent = 'Replying...';

    try {
        const response = await fetch(`${API_BASE_URL}/${postId}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text: replyText.trim() })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Reply added successfully!');
            fetchPosts(); 
        } else {
            showAlert(data.message || 'Failed to add reply', true);
        }
    } catch (error) {
        console.error('Add Reply Error:', error);
        showAlert('Network error while adding reply.', true);
    } finally {
        btnElement.disabled = false;
        btnElement.textContent = originalText;
    }
}

// 7. DELETE REPLY API LOGIC
async function deleteReply(postId, replyId, btnElement) {
    if(!confirm("Are you sure you want to delete your reply?")) return;

    const originalText = btnElement.innerHTML;
    btnElement.disabled = true;
    btnElement.innerHTML = 'Deleting...';

    try {
        const response = await fetch(`${API_BASE_URL}/${postId}/reply/${replyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Reply deleted successfully!');
            fetchPosts(); 
        } else {
            showAlert(data.message || 'Failed to delete reply', true);
        }
    } catch (error) {
        console.error('Delete Reply Error:', error);
        showAlert('Network error while deleting reply.', true);
    } finally {
        btnElement.disabled = false;
        btnElement.innerHTML = originalText;
    }
}

// 8. DYNAMIC RENDERING OF POSTS & REPLIES
function renderPosts(postsToRender) {
    if (!postsToRender || postsToRender.length === 0) {
        postsContainer.innerHTML = '<div class="empty-state">No discussions found.</div>';
        return;
    }

    postsContainer.innerHTML = ''; 

    postsToRender.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post-card';

        const dateObj = new Date(post.createdAt);
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const creatorName = post.userId?.name || 'Unknown User';
        const initial = creatorName.charAt(0).toUpperCase();
        const avatarColor = getColorForName(creatorName);

        let deletePostBtnHtml = `<button class="btn-delete-main" onclick="handleDeletePost('${post._id}', this)">Delete Post</button>`;

        const likesArray = post.likes || [];
        const isLikedByMe = likesArray.includes(currentUserId);
        const heartIcon = isLikedByMe ? '❤️' : '🤍';
        const likeBtnHtml = `<button class="btn-like ${isLikedByMe ? 'liked' : ''}" onclick="handleLikePost('${post._id}', this)">${heartIcon} ${likesArray.length}</button>`;

        let repliesHtml = '';
        if (post.replies && post.replies.length > 0) {
            repliesHtml = '<div class="replies-list">';
            post.replies.forEach(reply => {
                const rDateObj = new Date(reply.createdAt);
                const rDateStr = rDateObj.toLocaleDateString() + ' ' + rDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                const replierName = reply.userId?.name || 'Unknown User';
                const rInitial = replierName.charAt(0).toUpperCase();
                const rAvatarColor = getColorForName(replierName);

                let deleteBtnHtml = `<button class="btn-delete-reply" onclick="handleDeleteReply('${post._id}', '${reply._id}', this)" title="Delete this reply">Delete</button>`;

                repliesHtml += `
                    <div class="reply-item">
                        <div class="reply-header">
                            <div class="avatar-small" style="background-color: ${rAvatarColor}">${rInitial}</div>
                            <span class="reply-name">${replierName}</span>
                            <span class="reply-date">${rDateStr}</span>
                            ${deleteBtnHtml}
                        </div>
                        <p class="reply-text">${reply.text}</p>
                    </div>
                `;
            });
            repliesHtml += '</div>';
        }

        postElement.innerHTML = `
            <div class="post-header-top">
                <div class="post-author-info">
                    <div class="avatar" style="background-color: ${avatarColor}">${initial}</div>
                    <div class="post-meta-text">
                        <span class="post-creator">${creatorName}</span>
                        <span class="post-date">${dateStr}</span>
                    </div>
                </div>
                ${deletePostBtnHtml}
            </div>
            <div class="post-body">
                <h3>${post.title}</h3>
                <p>${post.description}</p>
            </div>
            <div class="post-actions-bar">
                ${likeBtnHtml}
            </div>
            <div class="post-replies-section">
                ${post.replies && post.replies.length > 0 ? '<h4>Replies</h4>' : ''}
                ${repliesHtml}
                <div class="add-reply-box">
                    <input type="text" placeholder="Write a reply..." id="reply-input-${post._id}" class="reply-input">
                    <button class="btn btn-secondary btn-small" onclick="handleAddReply('${post._id}')" id="reply-btn-${post._id}">Reply</button>
                </div>
            </div>
        `;

        postsContainer.appendChild(postElement);
    });
}

// Global handlers mapping for dynamic injected HTML
globalThis.handleAddReply = function(postId) {
    const replyInput = document.getElementById(`reply-input-${postId}`);
    const replyBtn = document.getElementById(`reply-btn-${postId}`);
    addReply(postId, replyInput.value, replyBtn);
}

globalThis.handleDeleteReply = function(postId, replyId, btnElement) {
    deleteReply(postId, replyId, btnElement);
}

globalThis.handleDeletePost = function(postId, btnElement) {
    deletePost(postId, btnElement);
}

globalThis.handleLikePost = function(postId, btnElement) {
    likePost(postId, btnElement);
}

// Attach Event Listeners
if (createPostForm) {
    createPostForm.addEventListener('submit', createPost);
}

// Fetch posts on initial load
document.addEventListener('DOMContentLoaded', fetchPosts);
