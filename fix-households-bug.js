const fs = require('fs');

const file = 'server/storage.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: getHousehold() - Replace Firebase with PostgreSQL
const oldGetHousehold = `  async getHousehold(id: string): Promise<Household | undefined> {
    const doc = await adminDb.collection(COLLECTIONS.HOUSEHOLDS).doc(id).get();
    return this.convertFirestoreData<Household>(doc);
  }`;

const newGetHousehold = `  async getHousehold(id: string): Promise<Household | undefined> {
    const result = await db.query.householdsTable.findFirst({
      where: eq(householdsTable.id, id)
    });
    return result;
  }`;

// Fix 2: getHouseholdByToken() - Replace Firebase with PostgreSQL
const oldGetHouseholdByToken = `  async getHouseholdByToken(magnetToken: string): Promise<Household | undefined> {
    const query = await adminDb.collection(COLLECTIONS.HOUSEHOLDS)
      .where('magnetToken', '==', magnetToken)
      .limit(1)
      .get();
    
    if (query.empty) return undefined;
    return this.convertFirestoreData<Household>(query.docs[0]);
  }`;

const newGetHouseholdByToken = `  async getHouseholdByToken(magnetToken: string): Promise<Household | undefined> {
    const result = await db.query.householdsTable.findFirst({
      where: eq(householdsTable.qrCode, magnetToken)
    });
    return result;
  }`;

// Fix 3: getHouseholdsByAgent() - Replace Firebase with PostgreSQL
const oldGetHouseholdsByAgent = `  async getHouseholdsByAgent(agentId: string): Promise<Household[]> {
    const query = await adminDb.collection(COLLECTIONS.HOUSEHOLDS)
      .where('agentId', '==', agentId)
      .get();
    
    const households = query.docs.map(doc => this.convertFirestoreData<Household>(doc)!);
    // Sort in memory instead of using orderBy to avoid index requirement
    return households.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }`;

const newGetHouseholdsByAgent = `  async getHouseholdsByAgent(agentId: string): Promise<Household[]> {
    const results = await db.query.householdsTable.findMany({
      where: eq(householdsTable.createdBy, agentId),
      orderBy: desc(householdsTable.createdAt)
    });
    return results;
  }`;

// Fix 4: updateHousehold() - Replace Firebase with PostgreSQL
const oldUpdateHousehold = `  async updateHousehold(id: string, data: Partial<Household>): Promise<Household | undefined> {
    await adminDb.collection(COLLECTIONS.HOUSEHOLDS).doc(id).update({
      ...data,
      updatedAt: new Date()
    });
    
    // Return the updated household
    return this.getHousehold(id);
  }`;

const newUpdateHousehold = `  async updateHousehold(id: string, data: Partial<Household>): Promise<Household | undefined> {
    await db.update(householdsTable)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(householdsTable.id, id));
    
    // Return the updated household
    return this.getHousehold(id);
  }`;

// Apply fixes
content = content.replace(oldGetHousehold, newGetHousehold);
content = content.replace(oldGetHouseholdByToken, newGetHouseholdByToken);
content = content.replace(oldGetHouseholdsByAgent, newGetHouseholdsByAgent);
content = content.replace(oldUpdateHousehold, newUpdateHousehold);

fs.writeFileSync(file, content);
console.log('✅ Fixed all 4 household functions!');
