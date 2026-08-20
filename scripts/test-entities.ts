// Quick smoke test for all entities
const { db } = require('/home/z/my-project/src/lib/db.ts');
const { ENTITY_MAP, getModel } = require('/home/z/my-project/src/lib/entity-map.ts');

async function test() {
  for (const entity of Object.keys(ENTITY_MAP)) {
    try {
      const model = getModel(entity);
      const count = await model.count();
      console.log(`✓ ${entity}: ${count} records`);
    } catch (e) {
      console.log(`✗ ${entity}: ${e.message}`);
    }
  }
  await db.$disconnect();
}
test();
