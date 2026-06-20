const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Chat with Sphere Bot (Gemini-powered)
 * @route   POST /api/ai/chat
 */
router.post('/chat', asyncHandler(async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    // Check for API Key
    if (!process.env.GEMINI_API_KEY) {
        return res.json({ 
            reply: "Sphere Bot is high-intelligence, but my Gemini API Key is missing! Please add GEMINI_API_KEY to your .env file." 
        });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            You are "Sphere Bot", an elite, helpful, and highly-intelligent AI academic companion for the "Student Sphere" platform.
            Answer precisely like ChatGPT and Gemini.
            You can solve math, write code, explain concepts, and give career advice.
            Maintain a supportive and sophisticated tone. 
            Keep your answers concise but complete.
            
            User Question: ${message}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ reply: text });

    } catch (error) {
        console.error("AI Error:", error);
        
        if (error.message.includes("429")) {
            return res.status(200).json({ 
                reply: "⚠️ **API Quota Exceeded:** The code works perfectly, but your Google Gemini API Key has run out of free credits or requires Billing to be enabled in Google AI Studio. Please use a different Google account to generate a new key, or enable billing!" 
            });
        }

        res.status(500).json({ reply: "My neural circuits are slightly tangled. Error: " + error.message });
    }
}));

/**
 * @desc    Refine and condense resume details for a single-page ATS-friendly PDF
 * @route   POST /api/ai/refine-resume
 */
router.post('/refine-resume', asyncHandler(async (req, res) => {
    const {
        name, age, college, branch, phone, email, linkedin, github,
        skills, bio, schooling, intermediate, extraProjects, experience,
        certifications, achievements, extracurricular
    } = req.body;

    if (!name || !college || !branch) {
        return res.status(400).json({ error: "Name, College, and Branch are required." });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.json({ fallback: true, message: "Gemini API Key is missing. Falling back to client-side." });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
You are a world-class professional resume builder and ATS optimization expert.
Your job is to take raw student details and refine/summarize them into a highly concise, professional, ATS-friendly format that will PERFECTLY fit on a single A4 page.

Rules:
1. Simplify and summarize verbose details. Keep only important details but mention all required fields.
2. Shorten the "bio" (Professional Summary) to a maximum of 2-3 sentences.
3. Clean the list of "skills" (comma-separated, proper capitalization).
4. Combine "schooling" into a single line like: "School Name | Board | Marks: XX% | Year: YYYY" (extract these from the raw input and format it concisely).
5. Combine "intermediate" into a single line like: "College Name | Stream | Marks: XX% | Year: YYYY" (extract these from the raw input and format it concisely).
6. Undergraduate details: just return college name and branch concisely.
7. For "extraProjects", rewrite it as a concise list of projects (maximum 2). Each project should have:
   - "Project Name: [Name]"
   - "Description: [1-2 sentences summarizing value/impact]"
   - "Technologies Used: [list]"
   Ensure it does not duplicate the core "Student Sphere" project.
8. For "experience", rewrite it concisely: Position, Company, Duration, followed by 2-3 short, impactful bullet points.
9. For "certifications", "achievements", and "extracurricular", convert them into concise lists (max 3 items each), with each item formatted as a simple bullet point (e.g. "• [Item]").
10. Ensure the total content generated is extremely clean, professional, and fits comfortably on a single page. Do not invent details; only rewrite and clean up the provided details.

Here are the user details:
- Name: ${name}
- Age: ${age || 'Not provided'}
- College: ${college}
- Branch: ${branch}
- Phone: ${phone || 'Not provided'}
- Email: ${email || 'Not provided'}
- LinkedIn: ${linkedin || 'Not provided'}
- GitHub: ${github || 'Not provided'}
- Bio (Professional Summary): ${bio || 'Not provided'}
- Technical Skills: ${skills || 'Not provided'}
- Schooling Details: ${schooling || 'Not provided'}
- Intermediate/Diploma Details: ${intermediate || 'Not provided'}
- Additional Projects: ${extraProjects || 'Not provided'}
- Experiences/Internships: ${experience || 'Not provided'}
- Certifications: ${certifications || 'Not provided'}
- Achievements & Awards: ${achievements || 'Not provided'}
- Extra Curricular Activities: ${extracurricular || 'Not provided'}

Return a JSON object with the following fields:
{
  "name": "concise name",
  "phone": "concise phone",
  "email": "concise email",
  "linkedin": "concise linkedin URL",
  "github": "concise github URL",
  "bio": "short professional summary (2-3 sentences max)",
  "skills": "clean list of skills separated by commas",
  "schooling": "formatted single-line schooling",
  "intermediate": "formatted single-line intermediate",
  "college": "concise college name",
  "branch": "concise branch name",
  "extraProjects": "formatted concise projects text with project name, description and technologies, no duplication of Student Sphere",
  "experience": "formatted concise experience text with bullet points",
  "certifications": "concise certifications text",
  "achievements": "concise achievements text",
  "extracurricular": "concise extracurricular text"
}
`;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const response = await result.response;
        const text = response.text();
        const refinedData = JSON.parse(text);

        res.status(200).json({ success: true, data: refinedData });

    } catch (error) {
        console.error("AI Resume Refinement Error:", error);
        res.status(200).json({ 
            fallback: true, 
            message: "Failed to connect to AI server. Using client-side fallback." 
        });
    }
}));

module.exports = router;

