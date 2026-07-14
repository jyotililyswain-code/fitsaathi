const assert = require("node:assert/strict");
const test = require("node:test");
const { Prisma } = require("@prisma/client");

test("Supabase Auth is the sole password authority in the application schema", () => {
  const user = Prisma.dmmf.datamodel.models.find(model => model.name === "User");
  assert.ok(user);
  assert.equal(user.fields.some(field => field.name === "passwordHash"), false);
  assert.equal(user.fields.some(field => field.name === "authUserId"), true);
  assert.equal(user.fields.some(field => field.name === "emailVerified"), true);
  assert.equal(user.fields.some(field => field.name === "emailNormalized"), true);
});

test("notification delivery models include deduplication and outbox state", () => {
  const notification = Prisma.dmmf.datamodel.models.find(model => model.name === "Notification");
  const outbox = Prisma.dmmf.datamodel.models.find(model => model.name === "NotificationOutbox");
  const push = Prisma.dmmf.datamodel.models.find(model => model.name === "PushSubscription");
  assert.ok(notification?.fields.some(field => field.name === "deduplicationKey"));
  assert.ok(outbox?.fields.some(field => field.name === "attemptCount"));
  assert.ok(push?.fields.some(field => field.name === "isActive"));
});
