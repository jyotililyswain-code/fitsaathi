require("dotenv/config");

const assert = require("node:assert/strict");
const test = require("node:test");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

async function api(route, options = {}, expected = [200]) {
  const response = await fetch(`${baseUrl}${route}`, options);
  const text = await response.text();
  let body = text;
  try { body = text ? JSON.parse(text) : null; } catch {}
  assert.ok(expected.includes(response.status), `${options.method || "GET"} ${route}: expected ${expected.join("/")}, received ${response.status}: ${text}`);
  return body;
}

function json(method, body, token) {
  return {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  };
}

function auth(token) {
  return { headers: { authorization: `Bearer ${token}` } };
}

async function register(label, stamp, extra = {}) {
  const email = `social-${label}-${stamp}@example.test`;
  const result = await api("/auth/register", json("POST", {
    name: `Social ${label}`,
    email,
    password: "SocialPass123!",
    acceptedPolicies: true,
    acceptedPolicyVersion: "test",
    gender: label === "bob" ? "male" : "female",
    birthDate: label === "bob" ? "2000-02-02" : "2001-01-01",
    city: "Bhubaneswar",
    state: "Odisha",
    country: "India",
    heightCm: 170,
    weightKg: 68,
    fitnessGoal: "Karate strength",
    profileBio: `Automated social test profile for ${label}. Looking for safe training partners.`,
    fitnessLevel: "intermediate",
    preferredAgeMin: 18,
    preferredAgeMax: 35,
    interests: ["Karate", "Gym"],
    ...extra
  }), [201]);
  return { email, id: result.user.id, token: result.accessToken };
}

test("FitSaathi Life social APIs provide free verified profiles, invites, chat, safety, notifications, and admin queues", async () => {
  const stamp = Date.now();
  const userIds = [];
  let conversationId = "";
  try {
    const alice = await register("alice", stamp);
    const bob = await register("bob", stamp);
    const admin = await register("admin", stamp);
    userIds.push(alice.id, bob.id, admin.id);
    await prisma.user.update({ where: { id: admin.id }, data: { role: "admin" } });

    await prisma.userProfilePhoto.createMany({
      data: [alice.id, bob.id].flatMap((userId, userIndex) => [1, 2, 3, 4].map((sortOrder) => ({
        userId,
        path: `/uploads/social/audit-${stamp}-${userIndex}-${sortOrder}.webp`,
        contentHash: `social-api-${stamp}-${userIndex}-${sortOrder}`,
        sortOrder,
        moderationStatus: "clean"
      })))
    });
    await prisma.socialVerification.createMany({
      data: [alice.id, bob.id].map((userId) => ({
        userId,
        governmentIdEncrypted: `private/${userId}-government.enc`,
        governmentIdBackEncrypted: `private/${userId}-government-back.enc`,
        ageProofEncrypted: `private/${userId}-age.enc`,
        selfieEncrypted: `private/${userId}-selfie.enc`,
        status: "approved"
      }))
    });

    const me = await api("/social/me", auth(alice.token));
    assert.equal(me.email, alice.email);
    assert.equal(me.verified, true);
    assert.ok(me.profileCompletion.percent >= 80);

    await api("/social/presence", json("POST", { online: true }, bob.token), [204]);
    const discovery = await api("/social/discover?interest=Karate&verified=true&city=Bhubaneswar", auth(alice.token));
    assert.ok(discovery.items.some((item) => item.id === bob.id), "Bob should appear in verified Karate discovery results");

    const profile = await api(`/social/profiles/${bob.id}`, auth(alice.token));
    assert.equal(profile.id, bob.id);
    assert.equal(profile.verified, true);

    const invite = await api("/social/invites", json("POST", { recipientId: bob.id, message: "Train Karate together?" }, alice.token), [201]);
    assert.ok((await api("/social/notifications", auth(bob.token))).some((item) => item.type === "invite_received"));
    await api(`/social/invites/${invite.id}`, json("PATCH", { status: "accepted" }, bob.token));
    const conversations = await api("/social/conversations", auth(alice.token));
    const conversation = conversations.find((item) => item.partner.id === bob.id);
    assert.ok(conversation, "Accepted invite should create an active conversation");
    conversationId = conversation.id;

    const message = await api(`/social/conversations/${conversation.id}/messages`, json("POST", { type: "text", content: "OSS! Saturday Karate practice?" }, alice.token), [201]);
    const bobMessages = await api(`/social/conversations/${conversation.id}/messages`, auth(bob.token));
    assert.ok(bobMessages.messages.some((item) => item.id === message.id));
    await api(`/social/messages/${message.id}`, { method: "DELETE", headers: { authorization: `Bearer ${alice.token}` } }, [204]);

    assert.equal(await prisma.wallet.count({ where: { userId: { in: [alice.id, bob.id] } } }), 0, "Free chat must not create wallets");
    assert.equal(await prisma.dailyConnectionCharge.count({ where: { connectionId: invite.id } }), 0, "Free chat must not create daily charges");

    await api("/social/reports", json("POST", { targetId: conversation.id, type: "chat", reason: "Automated moderation report for API test." }, alice.token), [201]);
    await api("/social/emergency", json("POST", { message: "Automated emergency request for API test." }, alice.token), [201]);

    assert.ok((await api("/social/admin/overview", auth(admin.token))).users >= 3);
    assert.ok(Array.isArray(await api("/social/admin/verifications", auth(admin.token))));
    assert.ok(Array.isArray(await api("/social/admin/reports", auth(admin.token))));
    assert.ok(Array.isArray(await api("/social/admin/conversations", auth(admin.token))));
    assert.equal((await api("/social/admin/analytics", auth(admin.token))).windowDays, 30);
  } finally {
    await prisma.report.deleteMany({ where: { OR: [{ reporterId: { in: userIds } }, { targetId: conversationId || "__missing__" }] } });
    await prisma.moderationCase.deleteMany({ where: { OR: [{ subjectId: { in: userIds } }, { targetId: conversationId || "__missing__" }] } });
    await prisma.emergencyRequest.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.socialMessage.deleteMany({ where: { senderId: { in: userIds } } });
    await prisma.typingIndicator.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.conversation.deleteMany({ where: { OR: [{ userOneId: { in: userIds } }, { userTwoId: { in: userIds } }] } });
    await prisma.connectionInvite.deleteMany({ where: { OR: [{ senderId: { in: userIds } }, { recipientId: { in: userIds } }] } });
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.profileView.deleteMany({ where: { OR: [{ viewerId: { in: userIds } }, { viewedId: { in: userIds } }] } });
    await prisma.socialReview.deleteMany({ where: { OR: [{ authorId: { in: userIds } }, { subjectId: { in: userIds } }] } });
    await prisma.pushSubscription.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userBlock.deleteMany({ where: { OR: [{ blockerId: { in: userIds } }, { blockedId: { in: userIds } }] } });
    await prisma.socialVerification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userProfilePhoto.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userInterest.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  }
});
