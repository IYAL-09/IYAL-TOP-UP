const { db } = require("./firebaseAdmin");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const payload = req.body;

  try {
    const { customerEmail, amountPaid, paymentReference } = payload;

    if (!customerEmail || !amountPaid) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userSnap = await db.collection("users")
      .where("email", "==", customerEmail)
      .limit(1)
      .get();

    if (userSnap.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userDoc = userSnap.docs[0];
    const userRef = userDoc.ref;
    const userData = userDoc.data();

    const newBalance = (userData.walletBalance || 0) + Number(amountPaid);
    await userRef.update({ walletBalance: newBalance });

    const profit = Number(amountPaid) * 0.05;
    const adminRef = db.collection("admin").doc("wallet");
    const adminSnap = await adminRef.get();
    const current = adminSnap.exists ? adminSnap.data().balance : 0;

    await adminRef.set({ balance: current + profit }, { merge: true });

    return res.status(200).json({ success: true, message: "Wallet updated." });

  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

