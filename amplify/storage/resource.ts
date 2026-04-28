import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'mybasecampAttachments',
  access: (allow) => ({
    'attachments/{entity_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.guest.to(['read'])
    ]
  })
});
