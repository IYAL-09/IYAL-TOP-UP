import admin from "firebase-admin";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!admin.apps.length) {
  initializeApp({
    credential: applicationDefault(),
  });
}
const db = getFirestore();

export default async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  const { uid, network, plan, phone } = req.body;
  if (!uid || !network || !plan || !phone) {
    return res.status(400).json({ status: "error", message: "Missing fields" });
  }

  try {
    // 1. Get user document
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    const userData = userDoc.data();
    const balance = userData.balance || 0;

    // 2. Get price from Firestore (dataPrices/{network_plan})
    const priceDoc = await db.collection("dataPrices").doc(`${network}_${plan}`).get();
    if (!priceDoc.exists) {
      return res.status(404).json({ status: "error", message: "Plan not found" });
    }

    const price = priceDoc.data().price;
    if (balance < price) {
      return res.status(400).json({ status: "error", message: "Insufficient balance" });
    }

    // 3. [PLACEHOLDER] Vendor API Call goes here
    // Simulate success (replace with real API call)
    const vendorSuccess = true;

    if (vendorSuccess) {
      // 4. Deduct balance
      await db.collection("users").doc(uid).update({
        balance: balance - price
      });

      // 5. Log transaction
      await db.collection("transactions").add({
        uid,
        type: "data",
        network,
        plan,
        phone,
        amount: price,
        status: "success",
        timestamp: new Date()
      });

      return res.status(200).json({ status: "success", message: "Data purchase successful" });
    } else {
      return res.status(500).json({ status: "error", message: "Vendor API failed" });
    }

  } catch (err) {
    console.error("Data error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};
