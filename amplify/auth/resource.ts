/**
 * amplify/auth/resource.ts
 *
 * Cognito User Pool configuration.
 *
 * Features:
 *  - Email + password sign-up / sign-in
 *  - "preferred_username" attribute (maps to our "username" concept)
 *  - "Admins" user group for role-based access
 *  - Post-confirmation trigger: auto-add new users to "Users" group
 *  - MFA optional
 */

import { defineAuth, defineFunction } from '@aws-amplify/backend';

// Post-confirmation Lambda: runs after a user confirms their account.
// Adds them to the "Users" Cognito group automatically.
const postConfirmationFn = defineFunction({
  name: 'postConfirmation',
  entry: './post-confirmation.ts',
  resourceGroupName: 'auth',
});

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    preferredUsername: {
      mutable: true,
      required: true,
    },
    'custom:isAdmin': {
      dataType: 'Boolean',
      mutable: true,
    },
  },
  groups: ['Admins', 'Users'],
  triggers: {
    postConfirmation: postConfirmationFn,
  },
  multifactor: {
    mode: 'OPTIONAL',
    totp: true,
  },
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: false,
    requireNumbers: true,
    requireSymbols: false,
  },
  accountRecovery: 'EMAIL_ONLY',
});
