const Profile = require('../models/Profile');

// @desc    Create or update user profile
// @route   POST /api/profile
// @access  Private
const createOrUpdateProfile = async (req, res) => {
    try {
        const { name, college, branch, skills, bio, phone, linkedin, github, age, schooling, intermediate, extraProjects, experience, certifications, achievements, extracurricular } = req.body;

        if (!name || !college || !branch) {
            return res.status(400).json({ message: 'Name, college, and branch are required fields.' });
        }

        // Fix: Parsing string skills due to multipart/form-data payload requirements
        let parsedSkills = [];
        if (skills) {
            if (typeof skills === 'string') {
                parsedSkills = skills.split(',').map(s => s.trim()).filter(s => s !== '');
            } else if (Array.isArray(skills)) {
                parsedSkills = skills;
            }
        }

        // Object containing profile fields mapping
        const profileFields = {
            userId: req.user.id, // mapped securely from JWT token payload 
            name,
            college,
            branch,
            bio: bio || '',
            skills: parsedSkills,
            phone: phone || '',
            linkedin: linkedin || '',
            github: github || '',
            age: age ? parseInt(age) : null,
            schooling: schooling || '',
            intermediate: intermediate || '',
            extraProjects: extraProjects || '',
            experience: experience || '',
            certifications: certifications || '',
            achievements: achievements || '',
            extracurricular: extracurricular || ''
        };
        
        // Dynamic file resolving overriding original if user actively uploaded this session
        if (req.file) {
            let protocol = req.protocol;
            if (req.headers['x-forwarded-proto']) {
                protocol = req.headers['x-forwarded-proto'];
            }
            // Serve securely from local API hosted uploads directory 
            profileFields.profileImage = `${protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }

        // Check if a profile already exists strictly tied to this specific user ID
        let profile = await Profile.findOne({ userId: req.user.id });

        if (profile) {
            // Update existing Profile Logic
            profile = await Profile.findOneAndUpdate(
                { userId: req.user.id },
                { $set: profileFields },
                { returnDocument: 'after' } // Returns the newly updated document
            );
            return res.json({ message: 'Profile updated successfully', profile });
        }

        // Create New Profile Logic
        profile = new Profile(profileFields);
        await profile.save();
        
        res.status(201).json({ message: 'Profile created successfully', profile });

    } catch (error) {
        console.error('Profile Update/Create Error:', error);
        res.status(500).json({ message: 'Server Error handling profile', debug: error.message, stack: error.stack });
    }
};

// @desc    Get current user's profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        // Find profile strictly using uniquely authenticated userId from Token
        const profile = await Profile.findOne({ userId: req.user.id }).populate('userId', 'email name');

        if (!profile) {
            return res.status(404).json({ message: 'There is no profile for this user' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ message: 'Server Error fetching profile' });
    }
};

module.exports = {
    createOrUpdateProfile,
    getProfile
};
