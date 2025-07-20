// /api/create-vpay-account.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email } = req.body;

  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  try {
    // Replace with your actual vendor URL and keys
    const response = await fetch("https://api.vpay.africa/api/v1/virtual-account/create", {
      method: "POST",
    
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.VPAY_PUBLIC_KEY,   // ✅ Corrected
        "x-secret-key": process.env.VPAY_SECRET_KEY,
      },
      
      body: JSON.stringify({
        customer_name: name,
        customer_email: email,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.data?.account_number) {
      return res.status(500).json({ error: "Failed to create virtual account", details: data });
    }

    const account = {
      accountName: data.data.account_name,
      accountNumber: data.data.account_number,
      bankName: data.data.bank_name || "VFD/VPay",
    };

    return res.status(200).json(account);

  } catch (err) {
    console.error("VPAY error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
