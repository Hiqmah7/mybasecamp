/**
 * amplify/backend.ts
 *
 * AWS Amplify Gen 2 — MyBaseCamp backend definition.
 * This single file orchestrates:
 *   - Cognito User Pool (Auth)
 *   - AppSync GraphQL API (Data)
 *   - Lambda resolvers for admin operations
 *
 * Deploy:  npx ampx sandbox          (local dev)
 *          npx ampx pipeline-deploy   (CI/CD)
 */

import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource.ts';
import { data } from './data/resource.ts';
import { storage } from './storage/resource.ts';
import { adminResolver } from './functions/adminResolver/resource.ts';

const backend = defineBackend({
  auth,
  data,
  storage,
  adminResolver,
});

/**
 * Grant the adminResolver Lambda access to Cognito so it can
 * call adminAddUserToGroup / adminRemoveUserFromGroup.
 */
backend.adminResolver.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'cognito-idp:AdminAddUserToGroup',
      'cognito-idp:AdminRemoveUserFromGroup',
      'cognito-idp:ListUsersInGroup',
      'cognito-idp:AdminGetUser',
      'cognito-idp:AdminDeleteUser',
      'cognito-idp:ListUsers',
    ],
    resources: [backend.auth.resources.userPool.userPoolArn],
  })
);

// Expose the User Pool ID to the Lambda via environment variable
backend.adminResolver.resources.lambda.addEnvironment(
  'USER_POOL_ID',
  backend.auth.resources.userPool.userPoolId
);

export default backend;
