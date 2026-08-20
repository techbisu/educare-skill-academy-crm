// Re-seed permissions and role-permission grants without touching other data.
// Run after updating ROLE_PERMISSIONS in src/lib/constants.ts.
const { PrismaClient } = require('@prisma/client');
const { PERMISSION_GROUPS, PERMISSION_ACTIONS, ROLE_PERMISSIONS, ROLE_NAMES } = require('../src/lib/constants');
const db = new PrismaClient();

async function main() {
  console.log('Refreshing permissions catalogue...');
  // Add any new permissions
  for (const group of PERMISSION_GROUPS) {
    for (const action of PERMISSION_ACTIONS) {
      const name = `${group.toLowerCase()}.${action}`;
      await db.permission.upsert({
        where: { name },
        update: { group, description: `${action} ${group}` },
        create: { name, group, description: `${action} ${group}` },
      });
    }
  }

  console.log('Refreshing role-permission grants...');
  const allPermissions = await db.permission.findMany();
  const permMap = new Map(allPermissions.map(p => [p.name, p.id]));

  for (const roleName of ROLE_NAMES) {
    const role = await db.role.findUnique({ where: { name: roleName } });
    if (!role) { console.warn(`Role not found: ${roleName}`); continue; }
    // Clear existing grants for this role
    await db.rolePermission.deleteMany({ where: { roleId: role.id } });

    const grants = ROLE_PERMISSIONS[roleName] || [];
    if (roleName === 'Super Admin') {
      // Super Admin gets all permissions
      for (const p of allPermissions) {
        await db.rolePermission.create({ data: { roleId: role.id, permissionId: p.id } });
      }
      console.log(`  ${roleName}: ${allPermissions.length} permissions (all)`);
    } else {
      let count = 0;
      for (const grant of grants) {
        for (const action of grant.actions) {
          const name = `${grant.group.toLowerCase()}.${action}`;
          const pId = permMap.get(name);
          if (pId) {
            await db.rolePermission.create({ data: { roleId: role.id, permissionId: pId } });
            count++;
          } else {
            console.warn(`    Permission not found: ${name}`);
          }
        }
      }
      console.log(`  ${roleName}: ${count} permissions`);
    }
  }

  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
