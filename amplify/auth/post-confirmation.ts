/**
 * amplify/auth/post-confirmation.ts
 *
 * Cognito Post-Confirmation trigger.
 * Fires after a new user confirms their email.
 *
 * Actions:
 *  1. Add the user to the "Users" Cognito group
 *  2. This lets us check group membership to determine role
 */

import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type { PostConfirmationTriggerHandler } from 'aws-lambda';

const client = new CognitoIdentityProviderClient({});

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const { userPoolId, userName } = event;

  try {
    await client.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: userName,
        GroupName: 'Users',
      })
    );
    console.log(`✅ Added ${userName} to Users group`);
  } catch (err) {
    // Non-fatal: log but don't block sign-up
    console.error('❌ postConfirmation error:', err);
  }

  return event;
};
