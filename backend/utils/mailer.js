const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'harshsahu10072006@gmail.com',
        pass: process.env.EMAIL_PASS || 'your_app_password'
    }
});

const sendApprovalMail = async (email, name, phone, password) => {
    const mailOptions = {
        from: '"FixNow Network" <harshsahu10072006@gmail.com>',
        to: email,
        subject: '🎉 FixNow Partner Application APPROVED!',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border: 12px solid #FACC15; padding: 50px; border-radius: 30px; background: #fff;">
                <h1 style="color: #000; text-transform: uppercase; font-style: italic; font-size: 32px; border-bottom: 4px solid #000; padding-bottom: 20px;">Welcome to the Pro Dashboard, ${name}!</h1>
                <p style="font-size: 18px; color: #333; line-height: 1.6;">Congratulations! Your application has been <b>APPROVED</b>. You are now a certified FixNow Partner.</p>
                
                <div style="background: #000; color: #fff; padding: 40px; border-radius: 20px; margin: 30px 0; border: 4px solid #FACC15;">
                    <h2 style="color: #FACC15; margin-top: 0; text-transform: uppercase; font-style: italic;">Your Login Credentials</h2>
                    <p style="font-size: 16px; margin: 10px 0;"><b>Phone ID:</b> ${phone}</p>
                    <p style="font-size: 16px; margin: 10px 0;"><b>Secure Password:</b> <span style="font-size: 24px; color: #FACC15; font-family: monospace; letter-spacing: 4px;">${password}</span></p>
                </div>

                <p style="color: #666; font-size: 14px;">Please use these credentials to log in to the <b>FixNow Partner App</b>. We recommend changing your password after your first login.</p>
                
                <div style="margin-top: 40px; text-align: center;">
                    <a href="http://localhost:5173/partner" style="background: #FACC15; color: #000; padding: 20px 40px; border-radius: 15px; text-decoration: none; font-weight: 1000; text-transform: uppercase; border: 3px solid #000; box-shadow: 6px 6px 0 0 #000;">Open Partner Dashboard</a>
                </div>

                <hr style="border: 1px solid #eee; margin-top: 50px;">
                <p style="font-weight: bold; text-align: center; color: #999;">FixNow Technologies - Empowering Local Hustle</p>
            </div>
        `
    };
    try {
        console.log(`📨 Mailer: Sending approval email to ${email}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Approval Email sent! Response: ${info.response}`);
    } catch (err) {
        console.error("❌ Mailer Error Details:", {
            message: err.message,
            code: err.code,
            command: err.command
        });
    }
};

const sendWelcomeMail = async (email, name) => {
    const mailOptions = {
        from: '"FixNow Network" <harshsahu10072006@gmail.com>',
        to: email,
        subject: '🚀 FixNow Partner Application Received!',
        html: `
            <div style="font-family: Arial, sans-serif; border: 10px solid #FACC15; padding: 40px; border-radius: 20px;">
                <h1 style="color: #000; text-transform: uppercase; font-style: italic;">Welcome to the Clan, ${name}!</h1>
                <p style="font-size: 18px; color: #333;">We have successfully received your <b>Partner Application</b> for the FixNow Network.</p>
                <div style="background: #000; color: #FACC15; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold; font-size: 20px;">STATUS: UNDER REVIEW 🔍</p>
                </div>
                <p style="color: #666;">Our verification team is currently reviewing your Aadhaar and Selfie documents. This usually takes 2-4 hours during business days.</p>
                <p style="font-size: 14px; color: #999;">If this wasn't you, please ignore this email or contact support.</p>
                <hr style="border: 1px solid #eee;">
                <p style="font-weight: bold; text-align: center;">FixNow Technologies - Redefining Local Services</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent successfully to ${email}`);
    } catch (err) {
        console.error("📧 Email Error:", err.message);
    }
};

module.exports = { sendApprovalMail, sendWelcomeMail, transporter };

