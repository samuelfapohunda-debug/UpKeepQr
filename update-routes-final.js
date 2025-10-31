import fs from 'fs';

console.log('🔧 Updating public routes to use adapter functions...');

let routeContent = fs.readFileSync('server/src/routes/publicHomeExtra.ts', 'utf8');

// Update imports to use the adapter functions
routeContent = routeContent.replace(
  /import { \n {2}getHomeProfileExtra, \n {2}updateHomeProfileExtra,\n {2}getHomeIdByToken\n} from "\.\.\/\.\.\/storage\.js";/,
  `import { 
  getHomeProfileExtraByHomeId, 
  updateHomeProfileExtraByHomeId,
  getHomeIdByToken
} from "../../storage.js";`
);

// Update function calls
routeContent = routeContent.replace(
  /const extra = await getHomeProfileExtra\(homeId\);/g,
  'const extra = await getHomeProfileExtraByHomeId(homeId);'
);

routeContent = routeContent.replace(
  /const updated = await updateHomeProfileExtra\(homeId, validatedData\);/g,
  'const updated = await updateHomeProfileExtraByHomeId(homeId, validatedData);'
);

fs.writeFileSync('server/src/routes/publicHomeExtra.ts', routeContent);

console.log('✅ Public routes updated to use adapter functions');
