import { Request, Response } from 'express';
import { User } from '../../models/User.ts';
import { Batch } from '../../models/Batch.ts';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'pes-secret';
const OTP_STORE = new Map<string, string>();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const createMailTransporter = () => {
  const mailUser = process.env.MAIL_SENDER;
  const mailPassword = process.env.MAIL_PASSWORD;

  if (!mailUser || !mailPassword) {
    throw new Error('MAIL_SENDER and MAIL_PASSWORD must be configured');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: mailUser,
      pass: mailPassword,
    }
  });
};

export const sendOtpEmail = async (req: Request, res: Response): Promise<void> => {
  const normalizedEmail = req.body?.email?.trim().toLowerCase();

  if (!normalizedEmail) {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(409).json({ message: 'Email is already registered' });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  OTP_STORE.set(normalizedEmail, otp);

  try {
    const transporter = createMailTransporter();
    const mailSender = process.env.MAIL_SENDER!;

    await transporter.sendMail({
      from: `"OTP Verification" <${mailSender}>`,
      to: normalizedEmail,
      subject: 'Your OTP Code',
      html: `<h3>Your OTP is <span style="color:blue">${otp}</span></h3>`
    });

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const email = req.body?.email?.trim().toLowerCase();
  const { otp } = req.body;
  const savedOtp = OTP_STORE.get(email);

  if (String(otp) === String(savedOtp)) {
    OTP_STORE.delete(email);
    res.status(200).json({ verified: true });
  } else {
    res.status(400).json({ verified: false, message: 'Invalid OTP' });
  }
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, password, role } = req.body;
    const email = req.body?.email?.trim().toLowerCase();

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      role: newUser.role,
      isTA: false,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.trim().toLowerCase() });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isTA = await Batch.exists({ ta: user._id });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: 'Login successful',
      token,
      role: user.role,
      isTA: Boolean(isTA),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const email = req.body?.email?.trim().toLowerCase();

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '15m' });
    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

    const transporter = createMailTransporter();
    const mailSender = process.env.MAIL_SENDER!;

    await transporter.sendMail({
      from: `"Password Reset" <${mailSender}>`,
      to: email,
      subject: 'Reset your password',
      html: `
        <h3>Hello, ${user.name || 'User'}</h3>
        <p>You requested to reset your password.</p>
        <p><a href="${resetLink}" target="_blank">Click here to reset it</a></p>
        <p>This link is valid for 15 minutes only.</p>
      `,
    });

    res.status(200).json({ message: 'Password reset link sent to email.' });
  } catch (err) {
    console.error('Error in forgotPassword:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(400).json({ message: 'Invalid token or user not found' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset token error:', err);
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
};
