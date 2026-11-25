import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebase.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUsers = await db.collection('users').where('email', '==', email).limit(1).get();
    if (!existingUsers.empty) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRef = db.collection('users').doc();
    const uid = userRef.id;

    const userData = {
      uid,
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    await userRef.set(userData);

    const token = jwt.sign({ uid, email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userWithoutPassword } = userData;

    return res.status(201).json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snapshot.empty) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const uid = userData.uid || userDoc.id;
    const token = jwt.sign({ uid, email: userData.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userWithoutPassword } = userData;
    userWithoutPassword.uid = uid;

    return res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error during login' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    let userDoc = await db.collection('users').doc(req.user.uid).get();
    let userData = null;

    if (userDoc.exists) {
      userData = userDoc.data();
    } else {
      const snapshot = await db.collection('users').where('uid', '==', req.user.uid).limit(1).get();
      if (!snapshot.empty) {
        userDoc = snapshot.docs[0];
        userData = userDoc.data();
      }
    }

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = userData;
    userWithoutPassword.uid = userData.uid || userDoc.id;

    return res.json({ user: userWithoutPassword });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching user' });
  }
});

export default router;
