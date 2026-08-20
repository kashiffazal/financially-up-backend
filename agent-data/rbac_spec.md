Financially Up ERP

Secure Dynamic User Management, Authentication, RBAC, Permissions and Audit Logging

AI Coding Agent Implementation Specification

You are working on an existing Financially Up ERP application.

The application consists of:

Frontend: Next.js + React + Ant Design

Backend: Node.js API

Database: MySQL

ORM: Sequelize

Existing admin portal

Existing Financially Up modules and APIs

Your task is to implement a production-ready, secure, scalable User Management and Authorization system.

This is NOT a simple fixed-role authentication system.

The required architecture is:

Authentication + Dynamic RBAC + Permission-Based Authorization + Secure Sessions + Immutable Audit Logging

The administrator must be able to create users, create custom roles, assign permissions to roles, assign roles to users, disable users, revoke sessions, and view audit history.

Do not replace this architecture with a simple role ENUM or a JSON permissions field on the users table.

1. Core Business Requirement

The system must allow administrators to create completely customizable roles.

Example:

Role:

Accountant

Permissions:

gst.registration.view

gst.registration.export

client.view

document.view

The Accountant must be able to view GST Registration records but must NOT be able to edit them.

Another role may have:

gst.registration.view

gst.registration.edit

gst.registration.review

A third role may only have:

gst.registration.view

The authorization system must enforce these permissions on the BACKEND.

Hiding buttons in the frontend is not considered security.

Every protected API endpoint must independently authenticate the user and authorize the requested action.

Use a deny-by-default authorization model and least-privilege design.

2. Critical Security Requirements

Follow these rules strictly.

Never store plaintext passwords.

Store passwords using a strong password hashing algorithm such as Argon2id if the project supports it, otherwise bcrypt with an appropriate cost factor.

Do not store authentication tokens in localStorage.

Prefer secure HttpOnly cookies for browser authentication.

Cookies must use HTTPS in production.

Use Secure and SameSite cookie attributes.

Use short-lived authentication/session credentials.

Support server-side session revocation.

Never trust role or permission information sent by the frontend.

Never trust a permission value supplied by the client.

All authorization decisions must be made server-side.

Deny access by default.

Do not expose passwords, password hashes, secrets or tokens through API responses.

Never write passwords, tokens, API keys, identity-document numbers or other highly sensitive values into audit logs.

Audit logs must not be editable through normal application APIs.

Audit logs must not be deletable by ordinary administrators.

Sensitive files must not be stored in public web-accessible directories.

Do not hard-code production administrator credentials in source code.

Do not commit secrets to Git.

Add rate limiting to authentication endpoints.

Protect password reset and account recovery against account enumeration.

Add authorization checks against the requested resource to prevent IDOR/horizontal privilege escalation.

Sensitive actions such as password changes, role changes and disabling accounts should require appropriate authorization and may require re-authentication.

Log successful and failed authentication/security events.

Use HTTPS in production.

3. Required Database Architecture

Do NOT implement:

users.roleusers.permissions JSON

as the primary authorization architecture.

Instead create these tables.

3.1 users

Columns:

id

uuid

email

password_hash

first_name

last_name

phone

department

job_title

bio

avatar

status

email_verified_at

last_login_at

last_login_ip

created_at

updated_at

deleted_at

Requirements:

email must be unique

email must be indexed

status should support at least Active, Inactive and Suspended

password_hash must never be returned from APIs

use soft deletion where appropriate

do not store a fixed role in this table

4. roles table

Create:

roles

Fields:

id

uuid

name

slug

description

is_system

status

created_by

created_at

updated_at

Examples:

Administrator

Accountant

Reviewer

GST Officer

Senior Accountant

Viewer

Roles must be database-driven.

Do not use a hard-coded role ENUM.

System roles may be protected from deletion.

5. permissions table

Create:

permissions

Fields:

id

module

resource

action

name

slug

description

created_at

updated_at

Permission naming convention:

[module].[resource].[action]

Examples:

users.viewusers.createusers.editusers.disableroles.viewroles.createroles.editroles.deletegst.registration.viewgst.registration.creategst.registration.editgst.registration.deletegst.registration.reviewgst.registration.approvegst.registration.exportcompany.registration.viewcompany.registration.createcompany.registration.editcompany.registration.reviewcompany.registration.approveengagement.viewengagement.createengagement.editengagement.reviewengagement.approvedocuments.viewdocuments.uploaddocuments.downloaddocuments.deletepdf.viewpdf.generatepdf.downloadaudit.view

Permissions are developer-defined capabilities.

Do not allow an administrator to create arbitrary permission strings that have no corresponding backend authorization logic.

Administrators create and manage roles and assign existing permissions.

6. user_roles table

Create:

user_roles

Fields:

id

user_id

role_id

assigned_by

created_at

Use foreign keys.

A user may have multiple roles.

Effective permissions are the union of permissions from the user’s assigned roles.

Prevent duplicate user-role combinations.

7. role_permissions table

Create:

role_permissions

Fields:

id

role_id

permission_id

created_at

Use foreign keys.

Prevent duplicate role-permission combinations.

8. sessions table

Create:

sessions

Fields:

id

uuid

user_id

session_token_hash

ip_address

user_agent

device_name

expires_at

last_activity_at

revoked_at

created_at

The raw session token must not be stored if it is possible to store a secure hash instead.

Support:

login session creation

logout

session expiration

session revocation

revoke one session

revoke all sessions

account-wide session invalidation after critical security changes

9. audit_logs table

Create an immutable audit system.

Fields:

id

uuid

actor_user_id

target_user_id

action

module

resource_type

resource_id

description

before_data

after_data

ip_address

user_agent

request_id

status

error_message

created_at

Examples of actions:

LOGIN_SUCCESSLOGIN_FAILEDLOGOUTPASSWORD_CHANGEDPASSWORD_RESET_REQUESTEDPASSWORD_RESET_COMPLETEDUSER_CREATEDUSER_UPDATEDUSER_DISABLEDUSER_ENABLEDUSER_ROLE_ASSIGNEDUSER_ROLE_REMOVEDROLE_CREATEDROLE_UPDATEDROLE_DELETEDROLE_PERMISSIONS_UPDATEDSESSION_CREATEDSESSION_REVOKEDALL_SESSIONS_REVOKEDGST_REGISTRATION_VIEWEDGST_REGISTRATION_CREATEDGST_REGISTRATION_UPDATEDGST_REGISTRATION_APPROVEDDOCUMENT_VIEWEDDOCUMENT_DOWNLOADEDDOCUMENT_UPLOADEDPDF_GENERATEDPDF_DOWNLOADED

Audit records must be append-only.

Normal application APIs must not provide update/delete operations for audit logs.

Do not put passwords, tokens, secrets or highly sensitive raw data into before_data or after_data.

Create a centralized:

auditService.log()

service so that controllers do not implement audit formatting independently.

10. Database Relationships

Implement:

User  hasMany UserRoleRole  hasMany UserRole  belongsToMany PermissionPermission  belongsToMany RoleUser  hasMany SessionUser  hasMany AuditLogRole  hasMany RolePermissionPermission  hasMany RolePermission

Use Sequelize associations and foreign keys correctly.

Add indexes for:

users.email

users.status

roles.slug

permissions.slug

user_roles.user_id

user_roles.role_id

role_permissions.role_id

role_permissions.permission_id

sessions.user_id

sessions.expires_at

audit_logs.actor_user_id

audit_logs.target_user_id

audit_logs.module

audit_logs.action

audit_logs.resource_id

audit_logs.created_at

11. Permission Service

Create a centralized permission service.

Required methods:

hasPermission(userId, permission)getUserRoles(userId)getUserPermissions(userId)hasAnyPermission(userId, permissions)hasAllPermissions(userId, permissions)

Do not duplicate permission-resolution logic across controllers.

Cache permissions only if necessary and ensure the cache is invalidated when:

user roles change

role permissions change

user is disabled

role is disabled

12. Authorization Middleware

Create:

middleware/authenticate.jsmiddleware/authorize.js

Authentication should:

Read the secure authentication/session cookie.

Validate the session.

Load the user.

Verify the user is active.

Attach sanitized authenticated-user information to the request.

Authorization should support:

authorize(&quot;gst.registration.view&quot;)

and optionally:

authorizeAny(...)authorizeAll(...)

Example:

router.put(  &quot;/:id&quot;,  authenticate,  authorize(&quot;gst.registration.edit&quot;),  updateGSTRegistration);

The frontend must never be able to bypass this check.

13. Resource-Level Authorization

Do not assume that having a permission automatically grants access to every record.

Where required, verify:

ownership

assignment

department

application access

client access

reviewer assignment

Example:

A user may have:

engagement.view

but may only be allowed to view engagements assigned to their department or assigned to them.

Build the authorization service so resource-level checks can be added later without redesigning the entire system.

14. Authentication API

Implement:

POST /api/auth/loginPOST /api/auth/logoutGET  /api/auth/mePOST /api/auth/refreshPUT  /api/auth/change-passwordPOST /api/auth/forgot-passwordPOST /api/auth/reset-password

Login:

Validate input.

Apply rate limiting.

Find user.

Verify account status.

Verify password.

Create secure session.

Set secure HttpOnly cookie.

Update last login information.

Create LOGIN_SUCCESS audit event.

Return sanitized user information.

Failed login:

do not reveal whether email exists

create LOGIN_FAILED audit event

apply rate limiting

15. User Management API

Implement:

GET    /api/usersPOST   /api/usersGET    /api/users/:idPUT    /api/users/:idPATCH  /api/users/:id/statusPUT    /api/users/:id/rolesPOST   /api/users/:id/reset-passwordGET    /api/users/:id/activityGET    /api/users/:id/sessionsDELETE /api/users/:id/sessions/:sessionIdDELETE /api/users/:id/sessions

Every endpoint must have an appropriate permission.

Examples:

users.viewusers.createusers.editusers.disableusers.reset_passwordusers.roles.manageusers.activity.viewusers.sessions.manage

16. Role Management API

Implement:

GET    /api/rolesPOST   /api/rolesGET    /api/roles/:idPUT    /api/roles/:idDELETE /api/roles/:idGET    /api/roles/:id/permissionsPUT    /api/roles/:id/permissions

Only authorized users may access these endpoints.

When permissions change for a role, create an audit event containing a safe before/after representation.

17. Permission API

Implement:

GET /api/permissions

This returns the registered permissions grouped by module.

Permissions should be used by the Role Management UI.

Do not expose unnecessary internal implementation details.

18. Audit API

Implement:

GET /api/audit-logsGET /api/audit-logs/:id

Support:

pagination

user filter

module filter

action filter

resource filter

date range

status filter

search

Only authorized users may view audit logs.

Example permission:

audit.view

19. Frontend User Management Screens

Build the following Next.js pages using Ant Design.

Screen 1

/admin/users

User list.

Features:

pagination

search

filters

status

role

department

last login

create user

edit user

disable/enable

view user

view activity

Screen 2

/admin/users/new/admin/users/[id]

Create/Edit User.

Sections:

Personal Information

First Name

Last Name

Email

Phone

Department

Job Title

Bio

Avatar

Roles

Show all available roles.

Allow assigning multiple roles.

Account Status

Active

Inactive

Suspended

Use Ant Design validation.

20. User Details

Create:

/admin/users/[id]

Tabs:

OverviewRoles &amp; PermissionsActivitySessions

Overview:

name

email

phone

department

job title

status

created date

last login

Roles &amp; Permissions:

Show assigned roles and calculated effective permissions.

Activity:

Show audit history for that user.

Sessions:

Show active sessions and allow authorized administrators to revoke them.

21. Role Management Screen

Create:

/admin/roles

Show:

role name

description

number of users

number of permissions

status

system/custom indicator

Actions:

create

edit

duplicate

delete where permitted

manage permissions

22. Role Create/Edit Screen

Create:

/admin/roles/new/admin/roles/[id]

Fields:

Role NameSlugDescriptionStatus

Then show permissions grouped by module.

Example:

GST Registration[ ] View[ ] Create[ ] Edit[ ] Delete[ ] Review[ ] Approve[ ] Export

Provide:

Select All

Clear All

Select Module

Clear Module

Do not automatically grant permissions simply because the UI checkbox is selected. The backend must persist and enforce the assignment.

23. Audit Log Screen

Create:

/admin/audit-logs

Features:

pagination

date range

user filter

module filter

action filter

resource filter

success/failure filter

search

Columns:

Date/TimeUserActionModuleResourceStatusIP

Clicking an event opens a detailed drawer/modal.

Display:

ActorTargetActionModuleResourceDate/TimeIP AddressUser AgentRequest IDDescriptionBeforeAfterResult

Sensitive values must be masked.

24. My Profile Screen

Create:

/admin/profile

Tabs:

ProfileSecuritySessionsMy Activity

Profile:

First Name

Last Name

Email

Phone

Department

Job Title

Bio

Avatar

Security:

Change password

Security information

Sessions:

current session

other active sessions

revoke session

revoke all sessions

My Activity:

recent audit activity

The user may view their effective permissions but must not be allowed to modify their own roles unless they have explicit authorization to manage roles.

25. Frontend Permission Utility

Create a centralized permission utility.

Example:

can(&quot;gst.registration.view&quot;)can(&quot;gst.registration.edit&quot;)can(&quot;gst.registration.approve&quot;)

Use it for UI visibility.

Example:

{can(&quot;gst.registration.edit&quot;) &amp;&amp; (  &lt;Button&gt;Edit&lt;/Button&gt;)}

However, this is only a UI convenience.

The backend must always enforce the same permission.

Never rely on:

localStorageuser.roleuser.permissions

for security decisions.

26. Admin Navigation

The sidebar should dynamically hide modules for which the user has no relevant permission.

Example:

UsersRolesAudit LogsGST RegistrationCompany RegistrationIndividual EngagementDocumentsPDF

Do not show modules that the current user cannot access.

But again, direct URL access must also be protected by the backend.

27. Initial System Roles

Seed an initial Administrator role.

Do not create hard-coded roles through an ENUM.

Recommended initial roles:

AdministratorAccountantReviewerViewer

These are seed data only.

Administrators must be able to create additional custom roles later.

The Administrator role should receive all currently registered permissions explicitly.

Do not rely on a JSON:

[&quot;*&quot;]

permission as the normal permission model.

If a protected System Administrator capability is required, implement it as a deliberate server-side system-role rule.

28. Initial Administrator

Do not hard-code:

admin@example.com123456

inside source code.

Never commit a production password.

Use a secure first-run configuration or environment variables.

The initial administrator must be forced to change the temporary password after first login.

Do not display the temporary password in logs.

29. Audit Integration

Create a centralized audit service:

auditService.log({  actorUserId,  targetUserId,  action,  module,  resourceType,  resourceId,  description,  beforeData,  afterData,  ipAddress,  userAgent,  requestId,  status});

Important mutations must automatically create audit records.

At minimum audit:

login

failed login

logout

password change

password reset

user creation

user update

user disable/enable

role assignment

role removal

role creation

role update

role deletion

permission changes

session creation

session revocation

sensitive data access

document access/download

important workflow changes

approvals

manual overrides

Do not log sensitive raw values unnecessarily.

30. Existing Financially Up Integration

The new RBAC system must be designed so that existing modules can use it.

Examples:

Company RegistrationIndividual EngagementGST RegistrationDocumentsCompliancePDFAdmin Review

Each module should define its own permissions.

For example:

company.registration.viewcompany.registration.createcompany.registration.editcompany.registration.reviewcompany.registration.approveengagement.viewengagement.createengagement.editengagement.reviewengagement.approvedocuments.viewdocuments.uploaddocuments.downloadpdf.viewpdf.generatepdf.download

Do not put module-specific permissions directly into frontend components.

Permissions should be centralized.

31. API Error Handling

Use consistent responses.

Unauthenticated:

401 Unauthorized

Authenticated but not authorized:

403 Forbidden

Do not return internal security details.

Example:

{  &quot;success&quot;: false,  &quot;message&quot;: &quot;You do not have permission to perform this action.&quot;}

Do not reveal which permission was missing to untrusted users unless appropriate.

32. Security Testing

Create automated tests for:

Authentication

valid login

invalid password

disabled user

suspended user

expired session

logout

revoked session

password change

password reset

rate limiting

Authorization

Test every permission.

Example:

Accountant:

GET GST = 200PUT GST = 403DELETE GST = 403

Reviewer:

GET GST = 200PUT GST = 200DELETE GST = 403

Viewer:

GET GST = 200PUT GST = 403DELETE GST = 403

Security

Test:

IDOR

horizontal privilege escalation

vertical privilege escalation

direct URL access

manipulated role IDs

manipulated user IDs

manipulated permission IDs

forged authentication data

expired sessions

revoked sessions

unauthorized role modification

unauthorized audit modification

unauthorized audit deletion

33. Important IDOR Test

This must work:

User A:

GET /api/company-applications/100

User A must NOT be able to change the request to:

GET /api/company-applications/101

and access User B’s protected data.

Authorization must check both:

permission+resource access

34. Do Not Implement Security Only in Next.js

The frontend route guard is useful for user experience.

It is NOT a security mechanism.

This is insufficient:

if (!user) redirect(&quot;/login&quot;);

The backend must enforce authentication and authorization on every protected API request.

35. Migration Requirements

Before changing the database:

Inspect the existing Sequelize models.

Inspect existing User model if present.

Inspect existing authentication code.

Inspect existing database relationships.

Do not blindly overwrite existing tables.

Create proper Sequelize migrations.

Preserve existing user data where possible.

Create a safe migration path from fixed roles to the new RBAC model.

Create indexes and foreign keys.

Test migrations on a development database before production.

Do not use:

sequelize.sync({ alter: true })

as the production database migration strategy.

Use versioned migrations.

36. Existing Code Compatibility

Before creating files, inspect the existing project structure.

Do not create duplicate:

authentication middleware

API configuration

User model

database connection

route registration

React Auth Context

permission utilities

If an equivalent implementation already exists, improve/refactor it rather than creating a second competing system.

37. Implementation Order

Implement in this exact order:

Phase 1

Database:

users

roles

permissions

user_roles

role_permissions

sessions

audit_logs

Phase 2

Authentication:

login

logout

session

password hashing

password change

password reset

Phase 3

Authorization:

permission service

authentication middleware

authorization middleware

resource authorization

Phase 4

User Management:

list

create

edit

disable

roles

activity

sessions

Phase 5

Role Management:

list

create

edit

permission assignment

Phase 6

Audit:

centralized audit service

audit API

audit UI

Phase 7

Frontend permission-aware navigation and actions.

Phase 8

Integrate RBAC with existing Financially Up modules.

38. Deliverables

Produce:

Backend

Sequelize models

migrations

seeders

authentication services

session services

permission services

authorization middleware

user controller/service/routes

role controller/service/routes

permission routes

audit controller/service/routes

validation schemas

rate limiting

security utilities

tests

Frontend

authentication integration

user management

create/edit user

user details

role management

create/edit role

audit logs

profile

sessions

permission utility

protected routes

permission-aware navigation

permission-aware buttons/actions

39. Coding Rules

Use:

existing project conventions

existing Sequelize configuration

existing API response format

existing Ant Design version

existing Tailwind setup

reusable components

reusable services

reusable validation

centralized authorization

centralized audit logging

Do not:

hard-code roles in frontend

hard-code permissions in individual pages

store JWT/session credentials in localStorage

trust frontend permission values

return password hashes

store plaintext passwords

store audit logs in editable JSON attached to users

use users.permissions JSON as the primary RBAC system

use users.role ENUM as the primary RBAC system

hard-code production credentials

store protected files in public folders

silently delete historical audit records

40. Final Acceptance Criteria

The implementation is complete only when all of these work.

Administrator can create a user.

Administrator can disable a user.

Administrator can create a custom role.

Administrator can assign permissions to the role.

Administrator can assign one or more roles to a user.

User receives effective permissions from assigned roles.

Backend rejects unauthorized API requests with 403.

Frontend hides unauthorized actions.

Direct URL access cannot bypass authorization.

Users cannot modify their own roles without permission.

Users cannot modify audit logs.

Users cannot delete audit logs.

Login is securely authenticated.

Sessions can expire.

Sessions can be revoked.

Passwords are securely hashed.

Password reset is secure.

Authentication is rate limited.

Important user/security actions are audited.

Audit records contain actor and timestamp.

Audit records identify the affected resource where applicable.

Before/after data is recorded safely for material changes.

Sensitive values are not unnecessarily logged.

IDOR tests pass.

Horizontal privilege escalation tests pass.

Vertical privilege escalation tests pass.

Role changes are audited.

Permission changes are audited.

Existing Financially Up modules can use the same authorization service.

Database migrations are versioned and reversible where practical.

No production secret is committed to source control.

No authentication token is stored in localStorage.

No protected document is exposed through a public predictable URL.

All protected APIs enforce server-side authorization.

Authorization follows deny-by-default and least-privilege principles.

Before writing code, inspect the existing repository and explain any conflicts with this architecture. Do not overwrite existing authentication/database infrastructure blindly.

Implement the system incrementally and keep each phase testable.