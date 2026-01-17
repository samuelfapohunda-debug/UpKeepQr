# Households Bug Fix Instructions

## Functions to Fix in server/storage.ts

### 1. getHousehold (around line 381-384)
**REPLACE:**
```typescript
  async getHousehold(id: string): Promise<Household | undefined> {
    const doc = await adminDb.collection(COLLECTIONS.HOUSEHOLDS).doc(id).get();
    return this.convertFirestoreData<Household>(doc);
  }
```

**WITH:**
```typescript
  async getHousehold(id: string): Promise<Household | undefined> {
    const result = await db.query.householdsTable.findFirst({
      where: eq(householdsTable.id, id)
    });
    return result;
  }
```

### 2. getHouseholdByToken (around line 386-393)
**REPLACE:**
```typescript
  async getHouseholdByToken(magnetToken: string): Promise<Household | undefined> {
    const query = await adminDb.collection(COLLECTIONS.HOUSEHOLDS)
      .where('magnetToken', '==', magnetToken)
      .limit(1)
      .get();
    
    if (query.empty) return undefined;
    return this.convertFirestoreData<Household>(query.docs[0]);
  }
```

**WITH:**
```typescript
  async getHouseholdByToken(magnetToken: string): Promise<Household | undefined> {
    const result = await db.query.householdsTable.findFirst({
      where: eq(householdsTable.qrCode, magnetToken)
    });
    return result;
  }
```

### 3. getHouseholdsByAgent (around line 396-403)
**REPLACE:**
```typescript
  async getHouseholdsByAgent(agentId: string): Promise<Household[]> {
    const query = await adminDb.collection(COLLECTIONS.HOUSEHOLDS)
      .where('agentId', '==', agentId)
      .get();
    
    const households = query.docs.map(doc => this.convertFirestoreData<Household>(doc)!);
    return households.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
```

**WITH:**
```typescript
  async getHouseholdsByAgent(agentId: string): Promise<Household[]> {
    const results = await db.query.householdsTable.findMany({
      where: eq(householdsTable.createdBy, agentId),
      orderBy: desc(householdsTable.createdAt)
    });
    return results;
  }
```

### 4. updateHousehold (around line 572-578)
**REPLACE:**
```typescript
  async updateHousehold(id: string, data: Partial<Household>): Promise<Household | undefined> {
    await adminDb.collection(COLLECTIONS.HOUSEHOLDS).doc(id).update({
      ...data,
      updatedAt: new Date()
    });
    
    return this.getHousehold(id);
  }
```

**WITH:**
```typescript
  async updateHousehold(id: string, data: Partial<Household>): Promise<Household | undefined> {
    await db.update(householdsTable)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(householdsTable.id, id));
    
    return this.getHousehold(id);
  }
```

## Required Imports
Verify these are at the top of server/storage.ts:
```typescript
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { householdsTable } from "@shared/schema";
```
