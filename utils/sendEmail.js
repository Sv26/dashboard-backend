import nodemailer from "nodemailer";

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
