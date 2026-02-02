import nodemailer from "nodemailer";


console.log("📧 Email service booting...");
console.log("📧 ENV CHECK:", {
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS_EXISTS: !!process.env.EMAIL_PASS,
});

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT), // 👈 MUST be number
  secure: false, // true only for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function sendEmail(to, subject, message) {
  return transporter.sendMail({
    from: `"Company Name" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: message,
  });
}
