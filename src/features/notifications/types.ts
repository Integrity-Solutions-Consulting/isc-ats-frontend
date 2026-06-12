export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string; // ISO datetime
}
