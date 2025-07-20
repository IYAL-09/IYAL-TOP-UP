// api/airtime.js
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import path from "path";

dotenv.config();

const serviceAccount = JSON.parse(
  readFileSync(path.join(process.cwd(), "firebase-admin.json"), "utf8")
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { uid, network, phone, amount } = req.body;

  if (!uid || !network || !phone || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();
    const balance = parseFloat(userData.balance || 0);
    const profit = 10; // Your fixed profit
    const totalCost = parseFloat(amount) + profit;

    if (balance < totalCost) {
      return res.status(400).json({ status: "error", message: "Insufficient balance" });
    }

    // MOCK vendor API (replace with your real vendor call)
    const fakeVendorResponse = {
      success: true,
      message: "Airtime sent successfully",
      vendor_id: "TX12345678"
    };

    // Deduct from balance
    await userRef.update({
      balance: balance - totalCost,
    });

    // Log transaction
    await db.collection("transactions").add({
      uid,
      type: "airtime",
      network,
      phone,
      amount,
      vendor_response: fakeVendorResponse,
      status: fakeVendorResponse.success ? "success" : "failed",
      createdAt: new Date().toISOString(),
    });

    res.status(200).json({
      status: "success",
      message: fakeVendorResponse.message,
    });

  } catch (err) {
    console.error("Airtime error:", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong. Try again.",
    });
  }
}
