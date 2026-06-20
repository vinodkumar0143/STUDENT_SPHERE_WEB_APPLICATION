document.addEventListener('DOMContentLoaded', () => {
    // Select deeply integrated UI Elements
    const addNoteForm = document.getElementById('add-note-form');
    const notesGrid = document.getElementById('notes-grid');
    const notesAlert = document.getElementById('notes-alert');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Select Filters
    const filterSubject = document.getElementById('filter-subject');
    const filterSemester = document.getElementById('filter-semester');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    // 1. ADVANCED AUTH PROTECTION (MANDATORY)
    const checkAuth = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            // Immediate security bounce for unauthenticated users
            globalThis.location.href = 'login.html'; 
            return null;
        }
        return token;
    };

    const token = checkAuth();
    if (!token) return; // Prevent any further execution without a valid token

    // Helper: Safely output dynamic user feedback
    const showMessage = (msg, isError = false) => {
        notesAlert.textContent = msg;
        notesAlert.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
        notesAlert.classList.remove('hidden');
        setTimeout(() => notesAlert.classList.add('hidden'), 4000);
    };

    // 2. ADD NOTE ARCHITECTURE
    const addNote = async (e) => {
        e.preventDefault(); // Stop standard form refresh

        // Extract input fields cleanly
        const title = document.getElementById('title').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const semester = document.getElementById('semester').value;
        const pdfFile = document.getElementById('pdfFile').files[0];

        // Format purely utilizing FormData API overriding strictly explicit JSON enabling binary integration purely natively
        const formData = new FormData();
        formData.append('title', title);
        formData.append('subject', subject);
        formData.append('semester', semester);
        if (pdfFile) {
            formData.append('pdfFile', pdfFile);
        }

        try {
            // Initiate authenticated POST operation mapped specifically to the backend
            const response = await fetch('http://localhost:5000/api/notes', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}` // JWT Secure Transmission (Browser handles Content-Type boundaries natively)
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Note successfully added!');
                addNoteForm.reset(); // Purge inputs after success
                fetchNotes(); // Auto-refresh notes to cleanly reflect newest addition
            } else {
                showMessage(data.message || 'Error occurred while saving note.', true);
            }
        } catch (error) {
            console.error('Add note Error: ', error);
            showMessage('Server connection failed.', true);
        }
    };

    // 3. FETCH ISOLATED NOTES
    const fetchNotes = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/notes', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                // Token may be compromised or expired, terminate session securely
                localStorage.removeItem('token');
                globalThis.location.href = 'login.html';
                return;
            }

            const notes = await response.json();
            
            if (response.ok) {
                renderNotes(notes);
            } else {
                showMessage(notes.message || 'Failed to fetch notes.', true);
            }
        } catch (error) {
            console.error('Fetch Check: ', error);
            showMessage('Failed to connect to server.', true);
        }
    };

    // 4. FILTER NOTES FUNCTIONALITY
    const filterNotes = async () => {
        const subject = filterSubject.value.trim();
        const semester = filterSemester.value;

        // Formulate URL Params automatically matching backend query structure
        const queryParams = new URLSearchParams();
        if (subject) queryParams.append('subject', subject);
        if (semester) queryParams.append('semester', semester);

        try {
            const response = await fetch(`http://localhost:5000/api/notes/filter?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const filteredNotes = await response.json();
            
            if (response.ok) {
                renderNotes(filteredNotes);
                if (filteredNotes.length === 0) showMessage('No notes matched your exact filters.', true);
            } else {
                showMessage('Failed to properly filter notes.', true);
            }
        } catch (error) {
            console.error(error);
            showMessage('Filtering failed due to server error.', true);
        }
    };

    // 5.5 DELETE NOTE FUNCTIONALITY
    const deleteNoteEvent = async (noteId, cardElement) => {
        try {
            const response = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                showMessage('Note successfully removed.');
                // Optimize: Remove element functionally without duplicate duplicate API fetch
                if (cardElement) {
                    cardElement.remove();
                } else {
                    fetchNotes(); // Fallback
                }
                
                if (notesGrid.children.length === 0) {
                    notesGrid.innerHTML = `<div class="empty-state">No notes found! Build your repository by adding one on the left.</div>`;
                }
            } else {
                showMessage('Failed to cleanly delete note.', true);
            }
        } catch (error) {
            console.error(error);
            showMessage('Deletion encountered server error.', true);
        }
    };

    // 5. RENDER DYNAMIC CARD UI
    const renderNotes = (notesArray) => {
        // Purge old DOM contents to prevent duplication overlaps
        notesGrid.innerHTML = '';
        
        if (notesArray.length === 0) {
            notesGrid.innerHTML = `<div class="empty-state">No notes found! Build your repository by adding one on the left.</div>`;
            return;
        }

        // Auto-generate heavily aesthetic HTML architecture for each note node isolated from MongoDB
        const currentUserId = localStorage.getItem('userId');

        notesArray.forEach(note => {
            const card = document.createElement('div');
            card.className = 'note-card';
            
            // Handle populated userId object or plain ID string robustly
            const uploaderId = note.userId && typeof note.userId === 'object' ? note.userId._id : note.userId;
            const uploaderName = note.userId && typeof note.userId === 'object' && note.userId.name ? note.userId.name : 'Student';

            card.innerHTML = `
                <div class="note-badge">Semester ${note.semester}</div>
                <h3>${note.title}</h3>
                <p class="note-subject">📖 ${note.subject}</p>
                <div class="note-footer">
                    <div class="note-meta-details">
                        <span class="note-date">${new Date(note.createdAt).toLocaleDateString()}</span>
                        <span class="note-uploader">By ${uploaderName}</span>
                    </div>
                    <div class="note-actions">
                        ${note.pdfLink ? `
                            <a href="${note.pdfLink}" target="_blank" class="btn btn-mini btn-view">View</a>
                            <button type="button" onclick="downloadPdf('${note.pdfLink}')" class="btn btn-mini btn-download">Download</button>
                        ` : '<span class="no-pdf">No PDF Attached</span>'}
                        ${uploaderId === currentUserId ? `
                            <button class="btn btn-mini btn-danger delete-btn" data-id="${note._id}">Delete</button>
                        ` : ''}
                    </div>
                </div>
            `;
            notesGrid.appendChild(card);
        });

        // Bind delete listeners safely after mapping DOM HTML
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteId = e.target.dataset.id;
                const cardElement = e.target.closest('.note-card');
                if(confirm('Are you sure you want to delete this note? This action is permanent.')) {
                    deleteNoteEvent(noteId, cardElement);
                }
            });
        });
    };

    // Session Management Binding
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            globalThis.location.href = 'login.html';
        });
    }

    // Connect standard listeners mapped functionally to API endpoints 
    addNoteForm.addEventListener('submit', addNote);
    applyFiltersBtn.addEventListener('click', filterNotes);
    clearFiltersBtn.addEventListener('click', () => {
        filterSubject.value = '';
        filterSemester.value = '';
        fetchNotes(); // Null filters trigger completely reset database payload 
    });

    // Boot Command: Immediately populate Notes Grid without user intervention upon authentication 
    fetchNotes();
});

// GLOBAL HELPER: Dynamically buffer cross-origin physical files directly locally bypassing explicit download locks.
globalThis.downloadPdf = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was completely malformed');
        
        const blob = await response.blob();
        const blobUrl = globalThis.URL.createObjectURL(blob);
        
        // Dynamically invoke an invisible native HTML tag executing secure native downloads manually
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = 'StudentSphere_Note.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove(); // Safely clear DOM elements 
        globalThis.URL.revokeObjectURL(blobUrl); // Safely release system memory
    } catch (error) {
        console.error('Download execution failed securely:', error);
        alert('File transfer interrupted. The connection may be unstable.');
    }
};
