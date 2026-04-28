# ⛺ MyBaseCamp — AWS Amplify Gen 2

> Part 1 of MyBaseCamp, fully migrated from a self-hosted Node.js/Express/MongoDB stack
> to a serverless AWS-native architecture using **Amplify Gen 2**.

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Runtime |
| npm | 9+ | Package manager |
| AWS CLI | v2 | AWS credentials |
| AWS account | — | Deploy resources |

### 1. Configure AWS credentials

```bash
aws configure
# Enter your Access Key ID, Secret, region (e.g. us-east-1), output format (json)
```

Or use a named profile:
```bash
aws configure --profile mybasecamp
export AWS_PROFILE=mybasecamp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the Amplify sandbox

The sandbox deploys all AWS resources (Cognito, AppSync, DynamoDB, Lambda) to your AWS account
and watches `amplify/` for changes with hot-reload.

```bash
npx ampx sandbox
```

This will:
- Create a Cognito User Pool with "Admins" and "Users" groups
- Deploy an AppSync GraphQL API backed by DynamoDB
- Deploy the `adminResolver` Lambda with Cognito permissions
- Deploy the `postConfirmation` Cognito trigger Lambda
- Generate `amplify_outputs.json` in the project root

### 4. Start the frontend

```bash
npm run dev
```

Open http://localhost:5173

> ⚠️ The frontend reads from `amplify_outputs.json`. This file must exist before `npm run dev` works.
> Run `npx ampx sandbox` first.

---


## 🔐 Auth Flow: Cognito vs Express Sessions

### Registration (new in Gen 2)
```
User fills form
  → signUp(email, password, { preferred_username })
    → Cognito sends verification email
      → User enters 6-digit OTP on /confirm-email
        → confirmSignUp(email, code)
          → signIn(email, password)  [auto]
            → postConfirmation Lambda fires → adds user to "Users" group
              → createUserProfile() → DynamoDB record created
```

### Sign In
```
User enters email + password
  → signIn()
    → Cognito validates credentials
      → Returns: AccessToken (15min) + IdToken + RefreshToken (7 days)
        → Tokens stored in localStorage (default) or memory
          → fetchAuthSession() reads JWT, extracts cognito:groups claim
            → isAdmin = groups.includes('Admins')
```

### Session Restore (on page load)
```
App mounts → getCurrentUser()
  → Reads tokens from storage
    → If AccessToken expired → auto-refresh using RefreshToken
      → Returns user identity without any server call
```

---

## 🗄️ Data Models (DynamoDB via AppSync)

### UserProfile
```graphql
type UserProfile @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["Admins"] },
  { allow: private, operations: [read] }
]) {
  id: ID!
  username: String!
  email: String!
  avatar: String
  bio: String
  ownedProjects: [Project] @hasMany(indexName: "byOwner", fields: ["id"])
}
```

### Project
```graphql
type Project @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["Admins"] },
  { allow: private, operations: [read] }
]) {
  id: ID!
  name: String!
  description: String
  color: String
  emoji: String
  status: ProjectStatus
  ownerProfileId: ID! @index(name: "byOwner")
  owner: UserProfile @belongsTo(fields: ["ownerProfileId"])
  memberIds: [String]
}
```

---

## 🧰 Key AWS Services Used

| Service | Role |
|---------|------|
| **Amazon Cognito** | User Pool (auth), JWT tokens, user groups (Admins/Users) |
| **AWS AppSync** | GraphQL API, real-time subscriptions ready |
| **Amazon DynamoDB** | NoSQL database for UserProfile + Project models |
| **AWS Lambda** | `adminResolver` (group management) + `postConfirmation` (trigger) |
| **AWS IAM** | Fine-grained permissions between services |
| **AWS Amplify Hosting** | (optional) Deploy frontend via `amplify:deploy` script |

---

## 🚢 CI/CD Deployment

### Connect to Amplify Hosting

1. Push this repo to GitHub/GitLab/CodeCommit
2. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
3. Click **New App → Host Web App**
4. Connect your repository
5. Amplify auto-detects Gen 2 and runs `npx ampx pipeline-deploy` + `npm run build`

### Branch-based environments

```
main branch    → production environment
dev branch     → staging environment  (automatic via Amplify)
feature/*      → per-PR sandbox (optional)
```

---

## 💡 Tips

**Making the first user an admin:**
```bash
# After signing up, use the AWS Console or CLI:
aws cognito-idp admin-add-user-to-group \
  --user-pool-id <YOUR_POOL_ID> \
  --username <USER_EMAIL> \
  --group-name Admins
```

**Viewing logs:**
```bash
# AppSync logs → CloudWatch
# Lambda logs:
aws logs tail /aws/lambda/adminResolver --follow
aws logs tail /aws/lambda/postConfirmation --follow
```

**Resetting the sandbox:**
```bash
npx ampx sandbox delete
npx ampx sandbox
```
