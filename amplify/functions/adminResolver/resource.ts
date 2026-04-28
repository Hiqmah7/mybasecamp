/**
 * amplify/functions/adminResolver/resource.ts
 *
 * Lambda function definition for admin operations.
 * Handles Cognito group management (set/remove admin)
 * and admin-level user listing/deletion.
 *
 * Replaces: Express routes /api/users/:id/set-admin, /remove-admin, DELETE
 */

import { defineFunction } from '@aws-amplify/backend';

export const adminResolver = defineFunction({
  name: 'adminResolver',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 256,
  environment: {
    // USER_POOL_ID is injected by backend.ts after the pool is created
    USER_POOL_ID: '',
  },
  resourceGroupName: 'data',
});
