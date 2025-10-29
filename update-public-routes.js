import fs from 'fs';

console.log('🔧 Updating public routes to use householdId...');

let routeContent = fs.readFileSync('server/src/routes/publicHomeExtra.ts', 'utf8');

// Replace homeId with householdId in the route handlers
routeContent = routeContent.replace(
  /const homeId = await getHomeIdByToken\(token\);/g,
  \`const homeId = await getHomeIdByToken(token);
    // Convert numeric homeId to string householdId for existing functions
    const householdId = homeId ? homeId.toString() : null;\`
);

routeContent = routeContent.replace(
  /const extra = await getHomeProfileExtra\(homeId\);/g,
  'const extra = await getHomeProfileExtra(householdId);'
);

routeContent = routeContent.replace(
  /const updated = await updateHomeProfileExtra\(homeId, validatedData\);/g,
  'const updated = await updateHomeProfileExtra(householdId, validatedData);'
);

fs.writeFileSync('server/src/routes/publicHomeExtra.ts', routeContent);
console.log('✅ Updated public routes to use householdId');
