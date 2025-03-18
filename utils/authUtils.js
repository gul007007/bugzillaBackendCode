
const User = require("../models/user");

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15; // in minutes

// Check if account is locked
const isWithinLockoutPeriod = (user) => {
  return user.lockUntil && new Date() < user.lockUntil;
};

// Increment failed attempts and lock if necessary
const incrementFailedAttempts = async (user) => {
  user.failedLoginAttempts += 1;
  if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION * 60 * 1000);
  }
  await user.save();
};

// Reset failed attempts on success
const resetFailedAttempts = async (user) => {
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();
};

module.exports = {
  isWithinLockoutPeriod,
  incrementFailedAttempts,
  resetFailedAttempts,
};