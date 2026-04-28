/**
 * src/lib/amplifyClient.js
 *
 * Centralised data-access layer using AWS Amplify Gen 2 clients.
 *
 * Replaces: axios + Express REST API
 * Now uses:
 *  - @aws-amplify/auth  → Cognito (sign-up, sign-in, sign-out, sessions)
 *  - @aws-amplify/api   → AppSync GraphQL (projects, user profiles)
 *
 * The `generateClient()` call returns a typed GraphQL client that
 * understands your schema from amplify/data/resource.ts.
 */

import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  getCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
  updateUserAttributes,
  deleteUser,
} from 'aws-amplify/auth';

import { generateClient } from 'aws-amplify/api';

// Typed GraphQL client — intellisense works with your schema
const client = generateClient();

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * Register a new user with Cognito.
 * After sign-up, Cognito sends a confirmation email.
 */
export const register = async (username, email, password) => {
  return signUp({
    username: email, // Cognito uses email as the login identifier
    password,
    options: {
      userAttributes: {
        email,
        preferred_username: username,
      },
      autoSignIn: true, // Attempt auto sign-in after confirmation
    },
  });
};

/**
 * Confirm email with the OTP code Cognito sends.
 */
export const confirmEmail = async (email, code) => {
  return confirmSignUp({ username: email, confirmationCode: code });
};

/**
 * Sign in with email + password.
 * Returns the Cognito session — groups are in the JWT.
 */
export const login = async (email, password) => {
  return signIn({ username: email, password });
};

/**
 * Sign out the current user and clear local tokens.
 */
export const logout = async () => {
  return signOut({ global: true });
};

/**
 * Get the current authenticated Cognito user identity.
 */
export const getAuthUser = async () => {
  const user = await getCurrentUser();
  const attrs = await fetchUserAttributes();
  const session = await fetchAuthSession();

  // Extract groups from the JWT access token
  const groups =
    session.tokens?.accessToken?.payload?.['cognito:groups'] ?? [];

  return {
    id: user.userId,
    username: attrs.preferred_username || attrs.email,
    email: attrs.email,
    emailVerified: attrs.email_verified === 'true',
    isAdmin: groups.includes('Admins'),
    groups,
  };
};

/**
 * Delete the currently signed-in user's Cognito account.
 */
export const deleteCurrentUser = async () => {
  return deleteUser();
};

// ─── UserProfile (AppSync) ────────────────────────────────────────────────────

/**
 * Create or update a UserProfile in DynamoDB via AppSync.
 * Called after successful sign-up confirmation.
 */
export const createUserProfile = async (userId, username, email) => {
  return client.models.UserProfile.create({
    id: userId,
    username,
    email,
  });
};

export const getUserProfile = async (userId) => {
  return client.models.UserProfile.get({ id: userId });
};

export const updateUserProfile = async (userId, updates) => {
  return client.models.UserProfile.update({ id: userId, ...updates });
};

// ─── Projects (AppSync) ───────────────────────────────────────────────────────

/**
 * Fetch all projects owned by the current user.
 * AppSync auth rules ensure only owned/member projects are returned.
 */
export const listMyProjects = async () => {
  const result = await client.models.Project.list();
  return result.data ?? [];
};

/**
 * Get a single project by ID with relations.
 * In Gen 2, nested hasMany relations in selectionSet return as { items: [] }.
 * We flatten them here for easier consumption in the UI.
 */
export const getProjectById = async (id) => {
  const result = await client.models.Project.get(
    { id },
    {
      selectionSet: [
        'id', 'name', 'description', 'color', 'emoji', 'status', 'ownerProfileId', 'memberIds', 'createdAt', 'updatedAt',
        'attachments.*',
        'attachments.ownerProfile.username',
        'threads.*',
      ]
    }
  );
  
  if (result.data) {
    return {
      ...result.data,
      attachments: result.data.attachments?.items ?? [],
      threads: result.data.threads?.items ?? [],
    };
  }
  return result.data;
};

// ─── Attachments (AppSync) ───────────────────────────────────────────────────

export const listAttachmentsByProject = async (projectId) => {
  const result = await client.models.Attachment.list({
    filter: { projectId: { eq: projectId } },
    selectionSet: ['id', 'name', 'format', 'storagePath', 'ownerProfileId', 'ownerProfile.username']
  });
  return result.data;
};

export const createAttachment = async (data) => {
  const result = await client.models.Attachment.create(data);
  return result.data;
};

export const deleteAttachment = async (id) => {
  const result = await client.models.Attachment.delete({ id });
  return result.data;
};

// ─── Threads (AppSync) ───────────────────────────────────────────────────────

export const listThreadsByProject = async (projectId) => {
  const result = await client.models.Thread.list({
    filter: { projectId: { eq: projectId } }
  });
  return result.data;
};

/**
 * Get thread by ID. We fetch project info for permission checks.
 * Removed invalid 'messages.*' selection.
 */
export const getThreadById = async (id) => {
  const result = await client.models.Thread.get(
    { id },
    {
      selectionSet: [
        'id', 'title', 'projectId', 'owner', 'createdAt',
        'project.ownerProfileId', 'project.memberIds'
      ]
    }
  );
  return result.data;
};

export const createThread = async (data) => {
  const result = await client.models.Thread.create(data);
  return result.data;
};

export const updateThread = async (id, title) => {
  const result = await client.models.Thread.update({ id, title });
  return result.data;
};

export const deleteThread = async (id) => {
  const result = await client.models.Thread.delete({ id });
  return result.data;
};

// ─── Messages (AppSync) ──────────────────────────────────────────────────────

export const listMessagesByThread = async (threadId) => {
  const result = await client.models.Message.list({
    filter: { threadId: { eq: threadId } },
    selectionSet: ['id', 'content', 'owner', 'createdAt', 'senderProfile.username', 'senderProfile.avatar']
  });
  // Sort by createdAt ascending locally for now if not using a specific index
  return (result.data ?? []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

export const createMessage = async (data) => {
  const result = await client.models.Message.create(data);
  return result.data;
};

export const updateMessage = async (id, content) => {
  const result = await client.models.Message.update({ id, content });
  return result.data;
};

export const deleteMessage = async (id) => {
  const result = await client.models.Message.delete({ id });
  return result.data;
};

export const subscribeToMessagesByThread = (threadId, onData) => {
  return client.models.Message.onCreate({
    filter: { threadId: { eq: threadId } }
  }).subscribe({
    next: (data) => onData(data),
    error: (error) => console.warn(error)
  });
};

/**
 * Create a new project.
 */
export const createProject = async ({ name, description, color, emoji, ownerProfileId }) => {
  const result = await client.models.Project.create({
    name,
    description: description || '',
    color: color || '#1a7f5a',
    emoji: emoji || '📋',
    status: 'active',
    ownerProfileId,
    memberIds: [],
  });
  return result.data;
};

/**
 * Update an existing project.
 */
export const updateProject = async (id, updates) => {
  const result = await client.models.Project.update({ id, ...updates });
  return result.data;
};

/**
 * Delete a project by ID.
 */
export const deleteProject = async (id) => {
  const result = await client.models.Project.delete({ id });
  return result.data;
};

// ─── Admin Operations (Lambda via AppSync mutation) ───────────────────────────

/**
 * Call the adminResolver Lambda via AppSync.
 * Only works if the current user is in the "Admins" Cognito group.
 */
const adminOperation = async (action, targetUserId) => {
  const result = await client.graphql({
    query: `
      mutation AdminOp($action: AdminOperationAction!, $targetUserId: String) {
        adminOperation(action: $action, targetUserId: $targetUserId) {
          success
          message
          users
        }
      }
    `,
    variables: { action, targetUserId },
  });
  return result.data?.adminOperation;
};

export const listAllUsers = () => adminOperation('LIST_USERS', undefined);
export const setUserAdmin = (userId) => adminOperation('SET_ADMIN', userId);
export const removeUserAdmin = (userId) => adminOperation('REMOVE_ADMIN', userId);
export const adminDeleteUser = (userId) => adminOperation('DELETE_USER', userId);
