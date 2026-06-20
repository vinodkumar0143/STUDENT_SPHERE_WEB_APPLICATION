/**
 * Opportunities Hub - Interactive Systems
 * Handles the dynamic display of internship platforms.
 */

document.addEventListener('DOMContentLoaded', () => {
    initOpportunities();
});

function initOpportunities() {
    // 1. Internship Triggers
    const exploreInternsBtn = document.getElementById('exploreInternshipsBtn');
    if (exploreInternsBtn) {
        exploreInternsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showInternshipPlatforms();
        });
    }

    // 2. Workshop Triggers
    const exploreWorkshopsBtn = document.getElementById('exploreWorkshopsBtn');
    if (exploreWorkshopsBtn) {
        exploreWorkshopsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showWorkshopPlatforms();
        });
    }

    // 3. Hackathon Triggers
    const exploreHackathonsBtn = document.getElementById('exploreHackathonsBtn');
    if (exploreHackathonsBtn) {
        exploreHackathonsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showHackathonPlatforms();
        });
    }
}

/**
 * Displays the hackathon platforms section.
 */
function showHackathonPlatforms() {
    const hackSection = document.getElementById('hackathonPlatforms');
    const mainOpportunities = document.getElementById('mainOpportunities');

    if (hackSection && mainOpportunities) {
        mainOpportunities.style.display = 'none';
        hackSection.style.display = 'block';
        hackSection.classList.add('fade-in');

        const backBtn = document.getElementById('backToHubBtnHack');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                hideHackathonPlatforms();
            });
        }

        // Bind clicks for hackathon platforms
        hackSection.querySelectorAll('.platform-card').forEach(card => {
            card.onclick = () => {
                const url = card.dataset.url;
                if (url) openPlatform(url);
            };
        });
    }
}

function hideHackathonPlatforms() {
    const hackSection = document.getElementById('hackathonPlatforms');
    const mainOpportunities = document.getElementById('mainOpportunities');

    if (hackSection && mainOpportunities) {
        hackSection.style.display = 'none';
        mainOpportunities.style.display = 'block';
        mainOpportunities.classList.add('fade-in');
    }
}

/**
 * Displays the workshop platforms section.
 */
function showWorkshopPlatforms() {
    const workshopSection = document.getElementById('workshopPlatforms');
    const mainOpportunities = document.getElementById('mainOpportunities');

    if (workshopSection && mainOpportunities) {
        mainOpportunities.style.display = 'none';
        workshopSection.style.display = 'block';
        workshopSection.classList.add('fade-in');

        const backBtn = document.getElementById('backToHubBtnWorkshop');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                hideWorkshopPlatforms();
            });
        }

        // Bind clicks for workshop platforms
         workshopSection.querySelectorAll('.platform-card').forEach(card => {
            card.onclick = () => {
                const url = card.dataset.url;
                if (url) openPlatform(url);
            };
        });
    }
}

function hideWorkshopPlatforms() {
    const workshopSection = document.getElementById('workshopPlatforms');
    const mainOpportunities = document.getElementById('mainOpportunities');

    if (workshopSection && mainOpportunities) {
        workshopSection.style.display = 'none';
        mainOpportunities.style.display = 'block';
        mainOpportunities.classList.add('fade-in');
    }
}

/**
 * Displays the internship platforms section and scrolls to it.
 */
function showInternshipPlatforms() {
    const platformsSection = document.getElementById('internshipPlatforms');
    const mainOpportunities = document.getElementById('mainOpportunities');

    if (platformsSection && mainOpportunities) {
        // Hide main content with a smooth transition
        mainOpportunities.style.display = 'none';
        
        // Show platforms section
        platformsSection.style.display = 'block';
        platformsSection.classList.add('fade-in');

        // Back button listener
        const backBtn = document.getElementById('backToHubBtn');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                hideInternshipPlatforms();
            });
        }

        // Initialize platform cards
        const platformCards = document.querySelectorAll('.platform-card');
        platformCards.forEach(card => {
            card.addEventListener('click', () => {
                const url = card.dataset.url;
                if (url) {
                    openPlatform(url);
                }
            });
        });
    }
}

/**
 * Returns to the main opportunities view.
 */
function hideInternshipPlatforms() {
    const platformsSection = document.getElementById('internshipPlatforms');
    const mainOpportunities = document.getElementById('mainOpportunities');

    if (platformsSection && mainOpportunities) {
        platformsSection.style.display = 'none';
        mainOpportunities.style.display = 'block';
        mainOpportunities.classList.add('fade-in');
    }
}

/**
 * Opens the specified URL in a new tab.
 * @param {string} url - The URL to open.
 */
function openPlatform(url) {
    if (url) {
        window.open(url, '_blank');
    }
}
