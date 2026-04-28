/**
 * src/contexts/AuthContext.jsx
 *
 * Global authentication state powered by Amazon Cognito.
 *
 * Replaces: express-session + connect-mongo
 * Now uses: Amplify Auth (Cognito tokens stored in localStorage/memory)
 *
 * Key differences from the original:
 *  - isAdmin comes from Cognito group membership (JWT claim)
 *  - After sign-up, user must confirm email (confirmSignUp step)
 *  - Sessions persist via Cognito refresh tokens (no server session needed)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getAuthUser,
  login,
  logout,
  register,
  confirmEmail,
  deleteCurrentUser,
  createUserProfile,
} from '../lib/amplifyClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from Cognito tokens on mount
  const restoreSession = useCallback(async () => {
    try {
      const u = await getAuthUser();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  /**
   * Sign in with email + password.
   * Cognito returns tokens — no server round-trip needed.
   */
  const signIn = async (email, password) => {
    await login(email, password);
    const u = await getAuthUser();
    setUser(u);
    return u;
  };

  /**
   * Register a new user.
   * Returns { isSignUpComplete, nextStep } from Cognito.
   * If nextStep.signUpStep === 'CONFIRM_SIGN_UP', show OTP input.
   */
  const signUp = async (username, email, password) => {
    const result = await register(username, email, password);
    return { ...result, pendingEmail: email, pendingUsername: username };
  };

  /**
   * Confirm the OTP code sent to the user's email.
   * After confirmation, sign them in automatically.
   */
  const confirmAndSignIn = async (email, code, password, username) => {
    await confirmEmail(email, code);

    // Auto sign-in after confirmation
    await login(email, password);
    const u = await getAuthUser();

    // Create the DynamoDB UserProfile linked to their Cognito ID
    try {
      await createUserProfile(u.id, username || u.username, u.email);
    } catch (err) {
      // Profile may already exist if this is a re-confirmation
      console.warn('Profile creation skipped:', err.message);
    }

    setUser(u);
    return u;
  };

  /**
   * Sign out and clear Cognito tokens globally.
   */
  const signOut = async () => {
    await logout();
    setUser(null);
  };

  /**
   * Delete the current user's account from Cognito.
   * Amplify's deleteUser() revokes all tokens.
   */
  const deleteAccount = async () => {
    await deleteCurrentUser();
    setUser(null);
  };

  /**
   * Refresh the user object (e.g. after admin role change).
   */
  const refreshUser = async () => {
    try {
      const u = await getAuthUser();
      setUser(u);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      confirmAndSignIn,
      signOut,
      deleteAccount,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
