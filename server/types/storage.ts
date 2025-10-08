// Extended FirebaseStorage interface to include missing methods
import { FirebaseStorage } from '../storage';

declare module '../storage' {
  interface FirebaseStorage {
    getPendingReminders(now: Date): Promise<any[]>;
    updateReminderStatus(id: string, status: string): Promise<void>;
    getHouseholdById(id: string): Promise<any>;
    getBatchById(id: string): Promise<any>;
  }
}
