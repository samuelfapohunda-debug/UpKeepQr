// Extended DatabaseStorage interface to include missing methods
import { DatabaseStorage as _DatabaseStorage } from '../storage';

declare module '../storage' {
  interface DatabaseStorage {
    getPendingReminders(now: Date): Promise<unknown[]>;
    updateReminderStatus(id: string, status: string): Promise<void>;
    getHouseholdById(id: string): Promise<unknown>;
    getBatchById(id: string): Promise<unknown>;
  }
}
