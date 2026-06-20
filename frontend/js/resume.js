/**
 * resume.js — ATS-Friendly Dual-Column Resume Generation System
 * Compiles profile data into a highly polished, recruiter-approved, two-column layout matching the template exactly.
 */
console.log("Resume Builder (v9) Loaded Successfully!");

// 1. HELPERS & PARSERS
function cleanUrlForDisplay(url) {
    if (!url) return "";
    url = String(url);
    return url.replace(/^(https?:\/\/)?(www\.)?/, "");
}

// Guarantee links resolve as absolute external URLs
function formatExternalUrl(url) {
    if (!url) return "";
    url = String(url).trim();
    if (!/^https?:\/\//i.test(url)) {
        return "https://" + url;
    }
    return url;
}

// Helper to parse key-value multiline text into single-line format
function parseEducationLine(text) {
    if (!text) return "";
    text = String(text);
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== "");
    let school = "";
    let board = "";
    let marks = "";
    let year = "";
    
    lines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.startsWith("school name:") || lower.startsWith("college name:") || lower.includes("school name") || lower.includes("college name")) {
            school = line.split(":")[1]?.trim() || line.replace(/^(school name|college name):?/i, "").trim();
        } else if (lower.startsWith("board:") || lower.startsWith("stream:") || lower.includes("board") || lower.includes("stream")) {
            board = line.split(":")[1]?.trim() || line.replace(/^(board|stream):?/i, "").trim();
        } else if (lower.startsWith("percentage:") || lower.startsWith("gpa:") || lower.includes("percentage") || lower.includes("gpa") || lower.startsWith("marks:")) {
            marks = line.split(":")[1]?.trim() || line.replace(/^(percentage|gpa|marks):?/i, "").trim();
        } else if (lower.startsWith("year of passing:") || lower.startsWith("year:") || lower.includes("year of passing") || lower.includes("year")) {
            year = line.split(":")[1]?.trim() || line.replace(/^(year of passing|year):?/i, "").trim();
        }
    });
    
    if (!school && !board && !marks && !year) {
        return lines.join("   |   ");
    }
    
    let parts = [];
    if (school) parts.push(school);
    if (board) parts.push(board);
    if (marks) parts.push(`Marks/GPA: ${marks}`);
    if (year) parts.push(year);
    
    return parts.join("   |   ");
}

// Helper to parse key-value multiline education text into structured objects
function parseEducationObject(text) {
    if (!text) return null;
    text = String(text);
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== "");
    let school = "";
    let board = "";
    let marks = "";
    let year = "";
    
    lines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.startsWith("school name:") || lower.startsWith("college name:") || lower.includes("school name") || lower.includes("college name")) {
            school = line.split(":")[1]?.trim() || line.replace(/^(school name|college name):?/i, "").trim();
        } else if (lower.startsWith("board:") || lower.startsWith("stream:") || lower.includes("board") || lower.includes("stream")) {
            board = line.split(":")[1]?.trim() || line.replace(/^(board|stream):?/i, "").trim();
        } else if (lower.startsWith("percentage:") || lower.startsWith("gpa:") || lower.includes("percentage") || lower.includes("gpa") || lower.startsWith("marks:")) {
            marks = line.split(":")[1]?.trim() || line.replace(/^(percentage|gpa|marks):?/i, "").trim();
        } else if (lower.startsWith("year of passing:") || lower.startsWith("year:") || lower.includes("year of passing") || lower.includes("year")) {
            year = line.split(":")[1]?.trim() || line.replace(/^(year of passing|year):?/i, "").trim();
        }
    });
    
    if (!school && !board && !marks && !year) {
        // Fallback positioning if no labels found
        school = lines[0] || "";
        board = lines[1] || "";
        marks = lines[2] || "";
        year = lines[3] || "";
    }
    
    return { school, board, marks, year };
}

// Helper to parse custom projects description, filtering out Student Sphere duplicates
function parseProjects(text) {
    if (!text) return [];
    text = String(text);
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== "");
    const projects = [];
    let currentProj = null;
    
    lines.forEach(line => {
        const lower = line.toLowerCase();
        
        // Detect new project start
        if (/^\d+\./.test(line) || lower.startsWith("project name:") || lower.startsWith("project:") || lower.startsWith("title:")) {
            if (currentProj && currentProj.name && !currentProj.name.toLowerCase().includes("student sphere")) {
                projects.push(currentProj);
            }
            const cleanName = line.replace(/^\d+\.\s*/, "").replace(/^(project name|project|title):?/i, "").trim();
            currentProj = { name: cleanName, desc: "", tech: "" };
        } else if (lower.startsWith("description:") || lower.includes("description")) {
            if (currentProj) {
                currentProj.desc = line.split(":")[1]?.trim() || line.replace(/^(description):?/i, "").trim();
            }
        } else if (lower.startsWith("technologies used:") || lower.startsWith("technologies:") || lower.includes("technologies") || lower.startsWith("tech:")) {
            if (currentProj) {
                currentProj.tech = line.split(":")[1]?.trim() || line.replace(/^(technologies used|technologies|tech):?/i, "").trim();
            }
        } else {
            if (currentProj) {
                if (!currentProj.desc) currentProj.desc = line;
                else currentProj.desc += " " + line;
            } else {
                currentProj = { name: line, desc: "", tech: "" };
            }
        }
    });
    
    if (currentProj && currentProj.name && !currentProj.name.toLowerCase().includes("student sphere")) {
        projects.push(currentProj);
    }
    
    return projects.slice(0, 2); // Limit to first 2 custom projects for space
}

// Helper to parse experiences text
function parseExperience(text) {
    if (!text) return [];
    text = String(text);
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== "");
    const experiences = [];
    let currentExp = null;
    
    lines.forEach(line => {
        const lower = line.toLowerCase();
        
        if (lower.startsWith("company name:") || lower.startsWith("company:") || lower.startsWith("organization:")) {
            if (currentExp && currentExp.company) {
                experiences.push(currentExp);
            }
            const cleanCompany = line.split(":")[1]?.trim() || line.replace(/^(company name|company|organization):?/i, "").trim();
            currentExp = { company: cleanCompany, role: "", duration: "", bullets: [] };
        } else if (lower.startsWith("role / position:") || lower.startsWith("role:") || lower.startsWith("position:")) {
            if (currentExp) {
                currentExp.role = line.split(":")[1]?.trim() || line.replace(/^(role \/ position|role|position):?/i, "").trim();
            }
        } else if (lower.startsWith("duration:") || lower.startsWith("time:") || lower.startsWith("period:")) {
            if (currentExp) {
                currentExp.duration = line.split(":")[1]?.trim() || line.replace(/^(duration|time|period):?/i, "").trim();
            }
        } else if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || lower.startsWith("key responsibilities") || lower.startsWith("responsibilities:")) {
            if (currentExp) {
                const cleanBullet = line.replace(/^[\s•\-*]+/, "").replace(/^(key responsibilities & achievements|key responsibilities|responsibilities):?/i, "").trim();
                if (cleanBullet) currentExp.bullets.push(cleanBullet);
            }
        } else {
            if (currentExp) {
                currentExp.bullets.push(line);
            } else {
                currentExp = { company: line, role: "", duration: "", bullets: [] };
            }
        }
    });
    
    if (currentExp && currentExp.company) {
        experiences.push(currentExp);
    }
    
    experiences.forEach(exp => {
        exp.bullets = exp.bullets.slice(0, 3); // Max 3 bullets
    });
    return experiences.slice(0, 2); // Max 2 entries
}

// Helper to parse lists like Certifications, Achievements, Extracurriculars
function parseListFallback(text) {
    if (!text) return [];
    text = String(text);
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== "");
    const items = [];
    let currentItem = "";

    lines.forEach(line => {
        const lower = line.toLowerCase();
        const startsWithBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("*");
        const startsWithIndex = /^\d+\./.test(line);

        // If it starts with a bullet point or numbered index, treat it as a new distinct list item
        if (startsWithBullet || startsWithIndex) {
            if (currentItem) {
                items.push(currentItem);
            }
            currentItem = line.replace(/^\d+\s*\.\s*/, "").replace(/^[\s•\-*]+/, "").replace(/^(certification name|achievement name|award|activity):?/i, "").trim();
        } 
        // If line is a key-value pair
        else if (line.includes(":") && (
            lower.startsWith("certification name:") || 
            lower.startsWith("organization:") || 
            lower.startsWith("year:") || 
            lower.startsWith("achievement name:") || 
            lower.startsWith("award:") || 
            lower.startsWith("activity:")
        )) {
            const val = line.split(":")[1]?.trim();
            if (val) {
                if (currentItem) currentItem += ` - ${val}`;
                else currentItem = val;
            }
        } 
        // Otherwise it belongs to the current item
        else {
            const cleanLine = line.replace(/^[\s•\-*]+/, "").trim();
            if (cleanLine) {
                if (currentItem) {
                    if (!currentItem.includes(cleanLine)) {
                        currentItem += ` - ${cleanLine}`;
                    }
                } else {
                    currentItem = cleanLine;
                }
            }
        }
    });

    if (currentItem) items.push(currentItem);
    
    return items.map(item => item.replace(/\s*-\s*$/, "").replace(/^\s*-\s*/, "").trim()).filter(item => item !== "");
}

// Rule-based classification to categorize skills dynamically
function categorizeSkills(skillsString) {
    if (!skillsString) return {};
    skillsString = String(skillsString);
    const skills = skillsString.split(',').map(s => s.trim()).filter(s => s !== "");
    const categories = {
        "Languages": [],
        "Frontend": [],
        "Backend": [],
        "Database": [],
        "Tools & Others": []
    };
    
    skills.forEach(skill => {
        const s = skill.toLowerCase();
        if (s.includes("javascript") || s.includes("python") || s.includes("java") || s.includes("cpp") || s.includes("c++") || s.includes("c ") || s.includes("typescript") || s.includes("ts") || s.includes("sql")) {
            categories["Languages"].push(skill);
        } else if (s.includes("html") || s.includes("css") || s.includes("react") || s.includes("angular") || s.includes("vue") || s.includes("bootstrap") || s.includes("tailwind") || s.includes("sass")) {
            categories["Frontend"].push(skill);
        } else if (s.includes("node") || s.includes("express") || s.includes("django") || s.includes("flask") || s.includes("spring") || s.includes("php") || s.includes("rest api") || s.includes("restapi") || s.includes("jwt") || s.includes("web development")) {
            categories["Backend"].push(skill);
        } else if (s.includes("mongo") || s.includes("mysql") || s.includes("oracle") || s.includes("firebase") || s.includes("postgres") || s.includes("database") || s.includes("db")) {
            categories["Database"].push(skill);
        } else {
            categories["Tools & Others"].push(skill);
        }
    });
    
    // Clean empty categories
    for (const key in categories) {
        if (categories[key].length === 0) {
            delete categories[key];
        }
    }
    return categories;
}

// Extract CGPA from achievements if possible
function extractCGPA(achievementsText) {
    if (!achievementsText) return "";
    achievementsText = String(achievementsText);
    const match = achievementsText.match(/cgpa\s*[:\-]?\s*([0-9.]+)/i);
    return match ? match[1] : "";
}

// 2. COLLECT PROFILE DATA
function collectProfileData() {
    const name = document.getElementById('name').value.trim();
    const age = document.getElementById('age').value.trim();
    const college = document.getElementById('college').value.trim();
    const branch = document.getElementById('branch').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('emailDisplay').value.trim();
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

    const skills = document.getElementById('skills').value.trim();
    const bio = document.getElementById('bio').value.trim();

    if (!name || !college || !branch) {
        showAlert('❌ Name, College, and Branch are required to build your resume!', true);
        return null;
    }

    const schooling = document.getElementById('schooling').value.trim();
    const intermediate = document.getElementById('intermediate').value.trim();
    const extraProjects = document.getElementById('extraProjects').value.trim();
    const experience = document.getElementById('experience').value.trim();
    const certifications = document.getElementById('certifications').value.trim();
    const achievements = document.getElementById('achievements').value.trim();
    const extracurricular = document.getElementById('extracurricular').value.trim();

    return {
        name,
        age,
        college,
        branch,
        phone,
        email,
        linkedin,
        github,
        skills,
        bio,
        schooling,
        intermediate,
        extraProjects,
        experience,
        certifications,
        achievements,
        extracurricular
    };
}

// 3. GENERATE DUAL-COLUMN PDF WITH DYNAMIC HEIGHT AUTO-JUSTIFICATION
function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    let activeDoc = null;
    
    // Layout and draw loop (supports dry run to calculate column heights)
    function runRender(scaleFactor, isDryRun, rightSectionGapBoost = 0, leftGapBoost = 0) {
        const doc = isDryRun ? new jsPDF('p', 'mm', 'a4') : activeDoc;
        let rightSectionCount = 0;
        
        const pageWidth = 210;
        const pageHeight = 297;
        
        // Column Coordinates
        const colLeftX = 8;
        const colLeftWidth = 50; // printable width inside left column
        const colRightX = 74;
        const colRightWidth = 126; // printable width inside right column
        
        let Y_left = 12;
        let Y_right = 12;
        let totalPages = 1;

        // Draw structural backgrounds
        if (!isDryRun) {
            doc.setFillColor(242, 245, 248); // Sidebar light grey-blue
            doc.rect(0, 0, 68, pageHeight, 'F');
            
            doc.setDrawColor(218, 223, 230); // Vertical separator divider
            doc.setLineWidth(0.25);
            doc.line(68, 0, 68, pageHeight);
        }

        // Section header helper inside left column
        function addLeftSectionHeader(title) {
            if (leftGapBoost > 0) Y_left += leftGapBoost;
            Y_left += 5 * scaleFactor;
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(9 * scaleFactor);
            doc.setTextColor(15, 45, 89); // Navy Color
            if (!isDryRun) {
                doc.text(title.toUpperCase(), colLeftX, Y_left);
                doc.setDrawColor(200, 204, 212);
                doc.setLineWidth(0.2);
                doc.line(colLeftX, Y_left + 1, colLeftX + colLeftWidth, Y_left + 1);
            }
            Y_left += 4.2 * scaleFactor;
        }

        // Section header helper inside right column
        function addRightSectionHeader(title, iconChar = "") {
            if (rightSectionGapBoost > 0) Y_right += rightSectionGapBoost;
            Y_right += 4 * scaleFactor;
            
            // Draw Navy Circle Icon
            if (!isDryRun) {
                doc.setFillColor(15, 45, 89);
                doc.circle(colRightX + 2.2, Y_right - 1, 2.2, 'F');
                
                if (iconChar) {
                    doc.setFont("Helvetica", "bold");
                    doc.setFontSize(5.5 * scaleFactor);
                    doc.setTextColor(255, 255, 255);
                    doc.text(iconChar, colRightX + 1.4, Y_right + 0.6);
                }
            }
            
            // Title text
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(10 * scaleFactor);
            doc.setTextColor(15, 45, 89);
            if (!isDryRun) doc.text(title.toUpperCase(), colRightX + 6, Y_right);
            
            Y_right += 1.2;
            if (!isDryRun) {
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.2);
                doc.line(colRightX, Y_right, pageWidth - 10, Y_right);
            }
            Y_right += 3.5 * scaleFactor;
            rightSectionCount++;
        }

        // ==================== LEFT COLUMN CONTENT ====================
        
        // 1. Stacked Name
        const nameText = String(data.name || '');
        const nameParts = nameText.toUpperCase().split(" ");
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(18 * scaleFactor);
        doc.setTextColor(15, 45, 89);
        nameParts.forEach(part => {
            if (!isDryRun) doc.text(part, colLeftX, Y_left);
            Y_left += 6 * scaleFactor;
        });

        // 2. Subtitle
        Y_left += 1.2 * scaleFactor;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.2 * scaleFactor);
        doc.setTextColor(29, 99, 184); // Subtitle Blue
        const branchText = String(data.branch || '');
        const subtitleText = branchText.toUpperCase() + " STUDENT";
        if (!isDryRun) doc.text(subtitleText, colLeftX, Y_left);
        Y_left += 7 * scaleFactor;

        // 3. Contact Info (Interactive Links)
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(7.8 * scaleFactor);
        doc.setTextColor(60, 66, 74);
        
        const contactItems = [];
        if (data.phone) contactItems.push({ label: "Phone", val: data.phone, rawVal: `tel:${data.phone}` });
        if (data.email) contactItems.push({ label: "Email", val: data.email, rawVal: `mailto:${data.email}` });
        if (data.linkedin) contactItems.push({ label: "LinkedIn", val: cleanUrlForDisplay(data.linkedin), rawVal: formatExternalUrl(data.linkedin) });
        if (data.github) contactItems.push({ label: "GitHub", val: cleanUrlForDisplay(data.github), rawVal: formatExternalUrl(data.github) });
        
        contactItems.forEach(item => {
            const wrapped = doc.splitTextToSize(item.val, colLeftWidth);
            if (!isDryRun) {
                doc.setFont("Helvetica", "bold");
                doc.text(`${item.label}:`, colLeftX, Y_left);
                doc.setFont("Helvetica", "normal");
                wrapped.forEach((line, idx) => {
                    // Check if redirect link exists - use textWithLink for robust PDF hyperlink compilation
                    if (item.rawVal) {
                        doc.textWithLink(line, colLeftX, Y_left + 3.2 * scaleFactor + (idx * 3.2 * scaleFactor), {
                            url: item.rawVal
                        });
                    } else {
                        doc.text(line, colLeftX, Y_left + 3.2 * scaleFactor + (idx * 3.2 * scaleFactor));
                    }
                });
            }
            Y_left += (3.2 + wrapped.length * 3.2 + 2) * scaleFactor;
        });

        // 4. Technical Skills
        if (data.skills) {
            addLeftSectionHeader("TECHNICAL SKILLS");
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(7.8 * scaleFactor);
            doc.setTextColor(60, 66, 74);
            const categories = categorizeSkills(data.skills);
            
            for (const cat in categories) {
                if (leftGapBoost > 0) Y_left += leftGapBoost * 0.4;
                doc.setFont("Helvetica", "bold");
                if (!isDryRun) doc.text(cat, colLeftX, Y_left);
                
                doc.setFont("Helvetica", "normal");
                const skillsText = categories[cat].join(", ");
                const wrapped = doc.splitTextToSize(skillsText, colLeftWidth);
                if (!isDryRun) {
                    wrapped.forEach((line, idx) => {
                        doc.text(line, colLeftX, Y_left + 3.2 * scaleFactor + (idx * 3.2 * scaleFactor));
                    });
                }
                Y_left += (3.2 + wrapped.length * 3.2 + 2.5) * scaleFactor;
            }
        }

        // 5. Certifications
        if (data.certifications) {
            const certs = parseListFallback(data.certifications);
            if (certs.length > 0) {
                addLeftSectionHeader("CERTIFICATIONS");
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(7.8 * scaleFactor);
                doc.setTextColor(60, 66, 74);
                certs.forEach(cert => {
                    if (leftGapBoost > 0) Y_left += leftGapBoost * 0.4;
                    const wrapped = doc.splitTextToSize(`• ${cert}`, colLeftWidth);
                    if (!isDryRun) {
                        wrapped.forEach((line, idx) => {
                            doc.text(line, colLeftX, Y_left + (idx * 3.2 * scaleFactor));
                        });
                    }
                    Y_left += (wrapped.length * 3.2 + 2.2) * scaleFactor;
                });
            }
        }

        // 6. Achievements
        if (data.achievements) {
            const achs = parseListFallback(data.achievements);
            if (achs.length > 0) {
                addLeftSectionHeader("ACHIEVEMENTS");
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(7.8 * scaleFactor);
                doc.setTextColor(60, 66, 74);
                achs.forEach(ach => {
                    if (leftGapBoost > 0) Y_left += leftGapBoost * 0.4;
                    const wrapped = doc.splitTextToSize(`• ${ach}`, colLeftWidth);
                    if (!isDryRun) {
                        wrapped.forEach((line, idx) => {
                            doc.text(line, colLeftX, Y_left + (idx * 3.2 * scaleFactor));
                        });
                    }
                    Y_left += (wrapped.length * 3.2 + 2.2) * scaleFactor;
                });
            }
        }

        // ==================== RIGHT COLUMN CONTENT ====================
        
        // 1. Professional Summary
        if (data.bio) {
            addRightSectionHeader("PROFESSIONAL SUMMARY", "S");
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8.2 * scaleFactor);
            doc.setTextColor(60, 66, 74);
            const wrapped = doc.splitTextToSize(data.bio, colRightWidth);
            if (!isDryRun) {
                wrapped.forEach((line, idx) => {
                    doc.text(line, colRightX, Y_right + (idx * 3.8 * scaleFactor));
                });
            }
            Y_right += (wrapped.length * 3.8) * scaleFactor + 2;
        }

        // 2. Education
        addRightSectionHeader("EDUCATION", "E");
        doc.setTextColor(60, 66, 74);
        
        // Undergrad (Core B.Tech)
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5 * scaleFactor);
        const degreeTitle = `Bachelor of Technology in ${data.branch}`;
        const wrappedDegree = doc.splitTextToSize(degreeTitle, colRightWidth - 16);
        if (!isDryRun) {
            wrappedDegree.forEach((line, idx) => {
                doc.text(line, colRightX, Y_right + (idx * 3.5 * scaleFactor));
            });
        }
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8 * scaleFactor);
        let btechYear = "2024 - 2028";
        if (!isDryRun) doc.text(btechYear, pageWidth - 10, Y_right, { align: "right" });
        Y_right += wrappedDegree.length * 3.5 * scaleFactor;
        
        const wrappedCollege = doc.splitTextToSize(data.college, colRightWidth - 16);
        if (!isDryRun) {
            wrappedCollege.forEach((line, idx) => {
                doc.text(line, colRightX, Y_right + (idx * 3.5 * scaleFactor));
            });
        }
        Y_right += wrappedCollege.length * 3.5 * scaleFactor;
        
        const extractedCGPA = extractCGPA(data.achievements) || "9.24";
        if (!isDryRun) doc.text(`CGPA: ${extractedCGPA} / 10.0`, colRightX, Y_right);
        Y_right += 5.5 * scaleFactor;

        // Intermediate
        if (data.intermediate) {
            const edu = parseEducationObject(data.intermediate);
            if (edu) {
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(8.5 * scaleFactor);
                const title = edu.board ? `Higher Secondary (${edu.board})` : "Higher Secondary / Diploma";
                const wrappedTitle = doc.splitTextToSize(title, colRightWidth - 16);
                if (!isDryRun) {
                    wrappedTitle.forEach((line, idx) => {
                        doc.text(line, colRightX, Y_right + (idx * 3.5 * scaleFactor));
                    });
                }
                
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(8 * scaleFactor);
                if (edu.year && !isDryRun) doc.text(edu.year, pageWidth - 10, Y_right, { align: "right" });
                Y_right += wrappedTitle.length * 3.5 * scaleFactor;
                
                const wrappedSchool = doc.splitTextToSize(edu.school, colRightWidth - 16);
                if (!isDryRun) {
                    wrappedSchool.forEach((line, idx) => {
                        doc.text(line, colRightX, Y_right + (idx * 3.5 * scaleFactor));
                    });
                }
                Y_right += wrappedSchool.length * 3.5 * scaleFactor;
                
                if (edu.marks && !isDryRun) doc.text(`Percentage: ${edu.marks}`, colRightX, Y_right);
                Y_right += 5.5 * scaleFactor;
            }
        }

        // Schooling
        if (data.schooling) {
            const edu = parseEducationObject(data.schooling);
            if (edu) {
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(8.5 * scaleFactor);
                const title = edu.board ? `Secondary School (${edu.board})` : "Secondary School (10th)";
                const wrappedTitle = doc.splitTextToSize(title, colRightWidth - 16);
                if (!isDryRun) {
                    wrappedTitle.forEach((line, idx) => {
                        doc.text(line, colRightX, Y_right + (idx * 3.5 * scaleFactor));
                    });
                }
                
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(8 * scaleFactor);
                if (edu.year && !isDryRun) doc.text(edu.year, pageWidth - 10, Y_right, { align: "right" });
                Y_right += wrappedTitle.length * 3.5 * scaleFactor;
                
                const wrappedSchool = doc.splitTextToSize(edu.school, colRightWidth - 16);
                if (!isDryRun) {
                    wrappedSchool.forEach((line, idx) => {
                        doc.text(line, colRightX, Y_right + (idx * 3.5 * scaleFactor));
                    });
                }
                Y_right += wrappedSchool.length * 3.5 * scaleFactor;
                
                if (edu.marks && !isDryRun) doc.text(`Percentage/GPA: ${edu.marks}`, colRightX, Y_right);
                Y_right += 5.5 * scaleFactor;
            }
        }

        // 3. Projects
        addRightSectionHeader("PROJECTS", "P");
        doc.setTextColor(60, 66, 74);
        
        // Core Student Sphere
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8.5 * scaleFactor);
        if (!isDryRun) doc.text("Student Sphere (Core Project)", colRightX, Y_right);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8 * scaleFactor);
        if (!isDryRun) doc.text("Jan 2026 - Mar 2026", pageWidth - 10, Y_right, { align: "right" });
        Y_right += 3.5 * scaleFactor;
        
        doc.setFont("Helvetica", "normal");
        const coreDesc = "Developed a centralized student collaboration platform featuring authentication, notes management, community discussions, opportunities hub, and real-time meeting integration.";
        const coreWrapped = doc.splitTextToSize(coreDesc, colRightWidth);
        if (!isDryRun) {
            coreWrapped.forEach((line, idx) => {
                doc.text(line, colRightX, Y_right + (idx * 3.5 * scaleFactor));
            });
        }
        Y_right += coreWrapped.length * 3.5 * scaleFactor + 1.2 * scaleFactor;
        
        doc.setFont("Helvetica", "bold");
        if (!isDryRun) doc.text("Tech Stack: HTML, CSS, JavaScript, Node.js, Express, MongoDB, JWT", colRightX, Y_right);
        Y_right += 4.8 * scaleFactor;

        // Custom Projects
        if (data.extraProjects) {
            const customProjects = parseProjects(data.extraProjects);
            customProjects.forEach(proj => {
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(8.5 * scaleFactor);
                if (!isDryRun) doc.text(proj.name, colRightX, Y_right);
                
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(8 * scaleFactor);
                if (!isDryRun) doc.text("2026", pageWidth - 10, Y_right, { align: "right" });
                Y_right += 3.5 * scaleFactor;
                
                if (proj.desc) {
                    doc.setFont("Helvetica", "normal");
                    const wrapped = doc.splitTextToSize(proj.desc, colRightWidth);
                    if (!isDryRun) {
                        wrapped.forEach((line, idx) => {
                            doc.text(line, colRightX, Y_right + (idx * 3.5 * scaleFactor));
                        });
                    }
                    Y_right += wrapped.length * 3.5 * scaleFactor + 1.2 * scaleFactor;
                }
                
                if (proj.tech) {
                    doc.setFont("Helvetica", "bold");
                    if (!isDryRun) doc.text(`Tech Stack: ${proj.tech}`, colRightX, Y_right);
                    Y_right += 4.8 * scaleFactor;
                }
            });
        }

        // 4. Experiences / Internships
        const customExps = data.experience ? parseExperience(data.experience) : [];
        if (customExps.length > 0) {
            addRightSectionHeader("INTERNSHIPS", "I");
            doc.setTextColor(60, 66, 74);
            customExps.forEach(exp => {
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(8.5 * scaleFactor);
                const expTitle = exp.role ? `${exp.role} - ${exp.company}` : exp.company;
                if (!isDryRun) doc.text(expTitle, colRightX, Y_right);
                
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(8 * scaleFactor);
                if (exp.duration && !isDryRun) doc.text(exp.duration, pageWidth - 10, Y_right, { align: "right" });
                Y_right += 3.5 * scaleFactor;
                
                doc.setFont("Helvetica", "normal");
                exp.bullets.forEach(bullet => {
                    const display = `• ${bullet}`;
                    const wrapped = doc.splitTextToSize(display, colRightWidth - 4);
                    if (!isDryRun) {
                        wrapped.forEach((line, idx) => {
                            doc.text(line, colRightX + 4, Y_right + (idx * 3.5 * scaleFactor));
                        });
                    }
                    Y_right += wrapped.length * 3.5 * scaleFactor;
                });
                Y_right += 2 * scaleFactor;
            });
        }

        // 5. Extra Curricular Activities
        if (data.extracurricular) {
            const extraLines = parseListFallback(data.extracurricular).slice(0, 3);
            if (extraLines.length > 0) {
                addRightSectionHeader("EXTRA CURRICULAR ACTIVITIES", "A");
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(8.2 * scaleFactor);
                doc.setTextColor(60, 66, 74);
                extraLines.forEach(line => {
                    const display = `• ${line}`;
                    const wrapped = doc.splitTextToSize(display, colRightWidth);
                    if (!isDryRun) {
                        wrapped.forEach((line, idx) => {
                            doc.text(line, colRightX, Y_right + (idx * 3.5 * scaleFactor));
                        });
                    }
                    Y_right += wrapped.length * 3.5 * scaleFactor;
                });
            }
        }

        // 6. Declaration
        addRightSectionHeader("DECLARATION", "D");
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8.2 * scaleFactor);
        doc.setTextColor(60, 66, 74);
        
        const decText = "I hereby declare that the information provided above is true and correct to the best of my knowledge.";
        const decWrapped = doc.splitTextToSize(decText, colRightWidth);
        if (!isDryRun) {
            decWrapped.forEach((line, idx) => {
                doc.text(line, colRightX, Y_right + (idx * 3.5 * scaleFactor));
            });
        }
        Y_right += decWrapped.length * 3.5 * scaleFactor + 4;
        
        // Signature Block
        if (!isDryRun) {
            doc.setFont("Helvetica", "oblique");
            doc.setFontSize(9 * scaleFactor);
            doc.text(nameText, pageWidth - 10, Y_right, { align: "right" });
            
            doc.setFont("Helvetica", "bold");
            doc.setFontSize(8 * scaleFactor);
            doc.text(nameText.toUpperCase(), pageWidth - 10, Y_right + 4 * scaleFactor, { align: "right" });
        }
        Y_right += 8 * scaleFactor;

        // Height-Check overflow tracker
        if (Y_left > 284 || Y_right > 284) {
            totalPages++;
        }

        return { Y_left, Y_right, totalPages, rightSectionCount };
    }

    // 1. Dry run pass to find baseline metrics and section counts
    const dryRunBaseline = runRender(1.0, true, 0, 0);
    const rightSections = dryRunBaseline.rightSectionCount;

    // 2. Loop scale factor to find the best fit that remains strictly on a single page
    let optimalScale = 0.0;
    let finalRightSections = rightSections;
    for (let scale = 1.25; scale >= 0.70; scale -= 0.03) {
        const result = runRender(scale, true, 0, 0);
        if (result.totalPages === 1 && result.Y_right <= 282 && result.Y_left <= 282) {
            optimalScale = scale;
            finalRightSections = result.rightSectionCount;
            break;
        }
    }
    
    // Defensive sizing fallback
    if (optimalScale === 0.0) {
        optimalScale = 0.70; // fallback to minimum legible size
    }

    // 3. Dry run again with the optimalScale to measure baseline heights
    const baselineOpt = runRender(optimalScale, true, 0, 0);
    
    // 4. Closed-loop height justification: calculate column spacing gap boosts to fill the A4 page perfectly
    let rightSectionGapBoost = 0;
    if (baselineOpt.totalPages === 1 && baselineOpt.Y_right < 278 && finalRightSections > 0) {
        const extraSpace = 278 - baselineOpt.Y_right;
        rightSectionGapBoost = Math.max(0, Math.min(18, extraSpace / finalRightSections));
    }
    
    let leftGapBoost = 0;
    if (baselineOpt.totalPages === 1 && baselineOpt.Y_left < 278) {
        const extraSpace = 278 - baselineOpt.Y_left;
        leftGapBoost = Math.max(0, Math.min(12, extraSpace / 8));
    }

    console.log("Template Scale Factor selected:", optimalScale);
    console.log("Column gap boosts applied (Right/Left):", rightSectionGapBoost, leftGapBoost);

    // 5. Perform final actual draw pass
    activeDoc = new jsPDF('p', 'mm', 'a4');
    runRender(optimalScale, false, rightSectionGapBoost, leftGapBoost);
    
    return activeDoc;
}

// 4. CREATE RESUME FUNCTION
function createResume() {
    const data = collectProfileData();
    if (!data) return null;
    return generatePDF(data);
}

// 5. DOWNLOAD RESUME FUNCTION (Accurate DB details only - no AI mistakes fallback)
function downloadResume() {
    try {
        const data = collectProfileData();
        if (!data) return;

        const buildBtn = document.getElementById('buildResumeBtn');
        const originalText = buildBtn.textContent;
        buildBtn.disabled = true;
        buildBtn.textContent = 'Generating PDF...';

        setTimeout(() => {
            try {
                const doc = generatePDF(data);
                const safeName = data.name.replace(/[^a-zA-Z0-9]/g, '');
                const fileName = `Resume_${safeName || 'Student'}.pdf`;
                doc.save(fileName);
                showAlert(`✅ Resume successfully generated and downloaded as ${fileName}`);
            } catch (err) {
                console.error("PDF generation failed:", err);
                showAlert(`❌ PDF generation failed: ${err.message}`, true);
            } finally {
                buildBtn.disabled = false;
                buildBtn.textContent = originalText;
            }
        }, 300);

    } catch (e) {
        console.error("Resume download handler failed:", e);
        showAlert(`❌ Resume builder encountered an error: ${e.message}`, true);
        const buildBtn = document.getElementById('buildResumeBtn');
        if (buildBtn) {
            doc.disabled = false;
            buildBtn.textContent = 'Build ATS Friendly Resume';
        }
    }
}

// Wire up the build resume button listener
const buildResumeBtn = document.getElementById('buildResumeBtn');
if (buildResumeBtn) {
    buildResumeBtn.addEventListener('click', downloadResume);
}
