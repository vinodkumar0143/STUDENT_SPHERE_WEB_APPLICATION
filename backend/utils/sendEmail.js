const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    let transporter;

    // If you haven't put real Mailtrap credentials in .env, we will auto-generate a test account!
    if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_mailtrap_user_here') {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    } else {
        // Automatically create a completely free, temporary testing account
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log("⚠️ Using Auto-Generated Ethereal Email for Testing. No Mailtrap needed!");
    }

    // Define the email options
    const mailOptions = {
        from: `Student Sphere <${process.env.EMAIL_FROM || 'noreply@studentsphere.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    // Actually send the email
    const info = await transporter.sendMail(mailOptions);
    
    // THIS IS THE MAGIC: It prints a clickable link in your terminal to view the fake email!
    if (transporter.options.host === 'smtp.ethereal.email') {
        console.log('📧 TEST EMAIL SENT! Preview it here: %s', nodemailer.getTestMessageUrl(info));
    }
};

module.exports = sendEmail;
