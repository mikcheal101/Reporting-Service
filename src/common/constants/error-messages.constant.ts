export const ERRORS = {
  USER_NOT_FOUND: 'User not found',
  USER_WITH_ID_NOT_FOUND: (id: number) => `User with ID ${id} was not found`,
  ROLE_ALREADY_EXISTS: 'Role already exists',
  ROLE_NOT_FOUND: 'Role not found',
  REPORT_NOT_FOUND: 'Report not found',
  NO_REPORT_FOUND_FOR_QUERY: 'No report found for this query',
  NO_CONNECTION_DEFINED:
    'No connection defined for the report found for this query',
  CONNECTION_NOT_FOUND: 'Connection not found',
  CONNECTION_NAME_EXISTS: 'A connection with this name already exists',
  REPORT_TYPE_ALREADY_EXISTS: 'Report type already exists',
  REPORT_TYPE_NOT_FOUND: 'Report type not found',
  TASK_NOT_FOUND: 'Task not found',
  TASK_REPORT_NOT_FOUND: 'Task report not found',
  REPORT_ALREADY_SCHEDULED: (id: number) =>
    `Report already scheduled with id: ${id}!`,
  REPORT_WITH_ID_NOT_FOUND: (id: number) => `Report with ID ${id} not found`,
  INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
  NO_ROLES_SELECTED: 'No roles selected to assign!',
  CANNOT_ASSIGN_SUPER_ADMIN:
    'Cannot assign super administrator rights to any user!',
  CANNOT_REMOVE_SUPER_ADMIN: 'Cannot remove super admin rights!',
  PERMISSION_NOT_FOUND: (id: number) => `Permission with ID ${id} not found`,
  SUPER_ADMIN_CANNOT_BE_MODIFIED: 'The super-admin role cannot be modified',
  AI_QUERY_GENERATION_FAILED: 'AI query generation failed',
} as const;
