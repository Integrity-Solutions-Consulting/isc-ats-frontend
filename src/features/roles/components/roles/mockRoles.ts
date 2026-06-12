export interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  isSystem?: boolean;
  permissionIds: Set<string>;
}
