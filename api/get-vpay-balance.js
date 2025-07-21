const admin = require("firebase-admin");
const fetch = require("node-fetch");
require("dotenv").config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  try {
    const { uid } = req.query;

    if (!uid) return res.status(400).json({ error: "Missing uid" });

    // Get user's VPay account number from Firestore
    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) return res.status(404).json({ error: "User not found" });

    const accountNumber = doc.data().account_number;

    if (!accountNumber) {
      return res.status(400).json({ error: "No account number linked" });
    }

    const response = await fetch("https://vpayapi.com/api/balance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.VPAY_API_KEY,
        "secret-key": process.env.VPAY_SECRET_KEY
      },
      body: JSON.stringify({ account_number: accountNumber }),
    });

    const data = await response.json();

    if (data.status !== true) {
      return res.status(400).json({ error: "Could not fetch balance" });
    }

    return res.json({ balance: data.balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
