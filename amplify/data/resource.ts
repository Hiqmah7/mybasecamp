import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // ─── UserProfile ──────────────────────────────────────────────────────────
  UserProfile: a
    .model({
      username: a.string().required(),
      email: a.string().required(),
      avatar: a.string(),
      bio: a.string(),
      // Relationships
      ownedProjects: a.hasMany('Project', 'ownerProfileId'),
      attachments: a.hasMany('Attachment', 'ownerProfileId'),
      messages: a.hasMany('Message', 'senderProfileId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Admins'),
      allow.authenticated().to(['read']),
    ]),

  // ─── Attachment ───────────────────────────────────────────────────────────
  Attachment: a
    .model({
      name: a.string().required(),
      format: a.string().required(),
      storagePath: a.string().required(),
      projectId: a.id().required(),
      project: a.belongsTo('Project', 'projectId'),
      ownerProfileId: a.id(),
      ownerProfile: a.belongsTo('UserProfile', 'ownerProfileId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Admins'),
      allow.authenticated().to(['read']),
    ]),

  // ─── Thread ───────────────────────────────────────────────────────────────
  Thread: a
    .model({
      title: a.string().required(),
      projectId: a.id().required(),
      project: a.belongsTo('Project', 'projectId'),
      messages: a.hasMany('Message', 'threadId'),
    })
    .authorization((allow) => [
      allow.owner(), // Only project owner (creator) can create/edit/delete
      allow.group('Admins'),
      allow.authenticated().to(['read']),
    ]),

  // ─── Message ──────────────────────────────────────────────────────────────
  Message: a
    .model({
      content: a.string().required(),
      threadId: a.id().required(),
      thread: a.belongsTo('Thread', 'threadId'),
      senderProfileId: a.id(),
      senderProfile: a.belongsTo('UserProfile', 'senderProfileId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.group('Admins'),
      allow.authenticated().to(['read']),
    ]),

  // ─── Project ──────────────────────────────────────────────────────────────
  Project: a
    .model({
      name: a.string().required(),
      description: a.string(),
      color: a.string().default('#1a7f5a'),
      emoji: a.string().default('📋'),
      status: a.enum(['active', 'archived', 'completed']),
      // Owner relationship - renamed from 'owner' to 'ownerProfile' to avoid conflict
      ownerProfileId: a.id().required(),
      ownerProfile: a.belongsTo('UserProfile', 'ownerProfileId'),
      // Members stored as array of Cognito user IDs (sub)
      memberIds: a.string().array(),
      // New relationships
      attachments: a.hasMany('Attachment', 'projectId'),
      threads: a.hasMany('Thread', 'projectId'),
    })
    .authorization((allow) => [
      // Implicitly uses a field named 'owner' (string) for auth
      allow.owner(),
      allow.group('Admins'),
      allow.authenticated().to(['read']),
    ]),

  // ─── Custom Mutations ─────────────────────────────────────────────────────
  AdminOperation: a
    .mutation()
    .arguments({
      action: a.enum(['SET_ADMIN', 'REMOVE_ADMIN', 'DELETE_USER', 'LIST_USERS']),
      targetUserId: a.string(),
    })
    .returns(
      a.customType({
        success: a.boolean().required(),
        message: a.string(),
        users: a.json(),
      })
    )
    .handler(a.handler.function('adminResolver'))
    .authorization((allow) => [allow.group('Admins')]),
});

export type Schema = typeof schema;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
  logging: {
    retention: '1 week',
    excludeVerboseContent: false,
    fieldLogLevel: 'info',
  },
});
