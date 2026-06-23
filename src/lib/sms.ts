const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_BASE_URL = "https://api.termii.com/api";

export async function sendSMS(phoneNumber: string, message: string) {
  if (!TERMII_API_KEY) {
    console.error("TERMII_API_KEY is not configured");
    return null;
  }
  try {
    const res = await fetch(`${TERMII_BASE_URL}/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TERMII_API_KEY,
        to: phoneNumber,
        from: "SSV Shop",
        sms: message,
        type: "plain",
        channel: "generic",
      }),
    });
    return await res.json();
  } catch (error) {
    console.error("SMS send failed:", error);
    return null;
  }
}
