import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_TTL || '15m',
  });
  const refreshToken = jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_TTL || '7d',
  });
  return { accessToken, refreshToken };
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user initially without workspace
    const user = new User({
      name,
      email,
      passwordHash,
    });

    // Create personal workspace for user
    const workspace = new Workspace({
      name: `${name}'s Workspace`,
      owner: user._id,
    });
    await workspace.save();

    user.workspace = workspace._id;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);
    setRefreshTokenCookie(res, refreshToken);

    return res.status(201).json({
      success: true,
      data: {
        token: accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspace: user.workspace,
          timezone: user.timezone,
          signature: user.signature,
          followUpDays: user.followUpDays,
        },
      },
      message: 'Account created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    setRefreshTokenCookie(res, refreshToken);

    return res.json({
      success: true,
      data: {
        token: accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspace: user.workspace,
          timezone: user.timezone,
          signature: user.signature,
          followUpDays: user.followUpDays,
        },
      },
      message: 'Logged in successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token missing' });
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    setRefreshTokenCookie(res, newRefreshToken);

    return res.json({
      success: true,
      data: {
        token: accessToken,
      },
      message: 'Token refreshed',
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.json({ success: true, message: 'Logged out successfully' });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  console.log(`[Dev Password Reset] Password reset link requested for: ${email}`);
  return res.json({
    success: true,
    message: 'If an account exists with that email, a password reset link has been sent.',
  });
};

export const resetPassword = async (req, res) => {
  return res.json({
    success: true,
    message: 'Password has been reset successfully.',
  });
};

export const getMe = async (req, res) => {
  return res.json({
    success: true,
    data: req.user,
  });
};

export const updateMe = async (req, res, next) => {
  try {
    const { name, timezone, signature, followUpDays, password } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (timezone) user.timezone = timezone;
    if (signature !== undefined) user.signature = signature;
    if (followUpDays) user.followUpDays = followUpDays;
    if (password) {
      const salt = await bcrypt.genSalt(12);
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    await user.save();

    return res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspace: user.workspace,
        timezone: user.timezone,
        signature: user.signature,
        followUpDays: user.followUpDays,
      },
      message: 'Profile updated',
    });
  } catch (error) {
    next(error);
  }
};
