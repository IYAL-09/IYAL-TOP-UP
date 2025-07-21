import { writeFileSync } from 'fs';
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json'; // Make sure this is ignored in .gitignore

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { account_number, transaction_status, amount, reference, narration, customer_uid } = req.body;

    if (!customer_uid || !transaction_status || !amount) {
      return res.status(400).json({ message: 'Invalid webhook data' });
    }

    // ✅ Only credit wallet if transaction is successful
    if (transaction_status.toLowerCase() === 'success') {
      const userRef = db.collection('users').doc(customer_uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userData = userDoc.data();
      const currentBalance = parseFloat(userData.balance || 0);
      const newBalance = currentBalance + parseFloat(amount);

      // 💰 Update user balance
      await userRef.update({ balance: newBalance });

      // 🧾 Log transaction in subcollection
      await userRef.collection('transactions').add({
        type: 'funding',
        amount: parseFloat(amount),
        reference,
        narration,
        status: transaction_status,
        createdAt: new Date().toISOString(),
      });

      return res.status(200).json({ message: 'Wallet credited successfully' });
    } else {
      return res.status(200).json({ message: 'Transaction ignored (not successful)' });
    }
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
}

