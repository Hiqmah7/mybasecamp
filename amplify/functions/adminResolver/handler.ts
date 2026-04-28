/**
 * amplify/functions/adminResolver/handler.ts
 *
 * AppSync Lambda resolver for admin mutations.
 *
 * Supported actions:
 *  - SET_ADMIN       → AdminAddUserToGroup("Admins")
 *  - REMOVE_ADMIN    → AdminRemoveUserFromGroup("Admins")
 *  - DELETE_USER     → AdminDeleteUser
 *  - LIST_USERS      → ListUsers (all Cognito users)
 *
 * Called via GraphQL:
 *   mutation { adminOperation(action: SET_ADMIN, targetUserId: "uuid") { success message } }
 */

import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminDeleteUserCommand,
  ListUsersCommand,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type { AppSyncResolverHandler } from 'aws-lambda';

const client = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.USER_POOL_ID!;

type Action = 'SET_ADMIN' | 'REMOVE_ADMIN' | 'DELETE_USER' | 'LIST_USERS';

interface Args {
  action: Action;
  targetUserId?: string;
}

interface Result {
  success: boolean;
  message?: string;
  users?: unknown;
}

export const handler: AppSyncResolverHandler<Args, Result> = async (event) => {
  const { action, targetUserId } = event.arguments;

  try {
    switch (action) {
      // ── Grant admin role ──────────────────────────────────────────────────
      case 'SET_ADMIN': {
        if (!targetUserId) throw new Error('targetUserId required');

        // Add to Admins group
        await client.send(new AdminAddUserToGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: targetUserId,
          GroupName: 'Admins',
        }));

        return { success: true, message: 'User promoted to admin.' };
      }

      // ── Remove admin role ─────────────────────────────────────────────────
      case 'REMOVE_ADMIN': {
        if (!targetUserId) throw new Error('targetUserId required');

        await client.send(new AdminRemoveUserFromGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: targetUserId,
          GroupName: 'Admins',
        }));

        return { success: true, message: 'Admin privileges removed.' };
      }

      // ── Delete user ───────────────────────────────────────────────────────
      case 'DELETE_USER': {
        if (!targetUserId) throw new Error('targetUserId required');

        await client.send(new AdminDeleteUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: targetUserId,
        }));

        return { success: true, message: 'User deleted from user pool.' };
      }

      // ── List all users ────────────────────────────────────────────────────
      case 'LIST_USERS': {
        const res = await client.send(new ListUsersCommand({
          UserPoolId: USER_POOL_ID,
          Limit: 60,
        }));

        const users = (res.Users ?? []).map((u) => ({
          id: u.Username,
          status: u.UserStatus,
          enabled: u.Enabled,
          createdAt: u.UserCreateDate?.toISOString(),
          email: u.Attributes?.find(a => a.Name === 'email')?.Value,
          username: u.Attributes?.find(a => a.Name === 'preferred_username')?.Value,
          emailVerified: u.Attributes?.find(a => a.Name === 'email_verified')?.Value === 'true',
        }));

        return { success: true, users: JSON.stringify(users) };
      }

      default:
        return { success: false, message: `Unknown action: ${action}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ adminResolver [${action}]:`, err);
    return { success: false, message };
  }
};
