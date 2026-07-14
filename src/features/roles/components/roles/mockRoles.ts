export interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  isSystem?: boolean;
  permissionIds: Set<string>;
  /** Catalog parameter types (org.parameters values) this role may write.
   *  Loaded separately from GET /auth/roles/{id}/parameter-types — not part
   *  of the roles list payload — so it starts empty until fetched. */
  parameterTypes: Set<string>;
}
