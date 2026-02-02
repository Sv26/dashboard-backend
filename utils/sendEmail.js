import * as brevo from "@getbrevo/brevo";

const apiInstance = new brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY,
);

export default async function sendEmail(to, subject, message) {
  try {
    await apiInstance.sendTransacEmail({
      sender: {
        name: "Dashboard",
        email: "shubhamsv2602@gmail.com",
      },
      to: [{ email: to }],
      subject,
      textContent: message,
    });

    console.log("📨 MAIL SENT via Brevo");
    return true;
  } catch (err) {
    console.error("❌ BREVO ERROR:", err?.response?.text || err.message);
    return false; // never crash server
  }
}
