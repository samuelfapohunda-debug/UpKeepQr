// Extended FirebaseStorage interface to include missing methods
import { FirebaseStorage as _FirebaseStorage } from '../storage';

declare module '../storage' {
  interface FirebaseStorage {
    getPendingReminders(now: Date): Promise<unknown[]>;
    updateReminderStatus(id: string, status: string): Promise<void>;
    getHouseholdById(id: string): Promise<unknown>;
    getBatchById(id: string): Promise<unknown>;
  }
}
