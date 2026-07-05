import { Router } from "express";
import { z } from "zod";
import { allowRoles, authenticate, type AuthRequest } from "./auth";
import { prisma } from "./db";
import { cleanInterest, validateInterestList } from "./interests";
import { inspectPhoto, moderateText, saferUsername } from "./moderation";
import { readEncryptedFile, removePrivateFiles, storeEncryptedFile } from "./private-storage";
import { discardIncomingUploads, optimizeUploads, removeUploads, socialUpload } from "./uploads";

export const socialRouter = Router();
const admins = ["admin", "super_admin", "moderator", "support_admin"];
const asyncRoute = (handler: (request: any, response: any) => Promise<unknown>) => (request: any, response: any, next: any) => Promise.resolve(handler(request, response)).catch(next);

socialRouter.use(authenticate);

const publicInclude = {
  profilePhotos: { where: { moderationStatus: { not: "blocked" as const } }, orderBy: { sortOrder: "asc" as const } },
  interests: { orderBy: { interest: "asc" as const } },
  achievements: { orderBy: { createdAt: "desc" as const }, take: 20 },
  socialLinks: true,
  socialVerification: { select: { status: true, paymentStatus: true, expiresAt: true } },
  socialReviewsReceived: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" as const }, take: 20 }
};

socialRouter.get("/me", asyncRoute(async (request: AuthRequest, response) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: request.user!.id }, include: publicInclude });
  response.set("Cache-Control", "no-store").json({ ...publicProfile(user), email: user.email, phone: user.phone, birthDate: user.birthDate, profileCompletion: profileCompletion(user) });
}));

socialRouter.patch("/me", asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({
    name: z.string().trim().min(2).max(80).optional(), gender: z.enum(["male", "female", "other"]).optional(), birthDate: z.coerce.date().optional(),
    city: z.string().trim().min(2).max(80).optional(), state: z.string().trim().min(2).max(80).optional(), country: z.string().trim().min(2).max(80).optional(),
    heightCm: z.coerce.number().int().min(100).max(250).optional(), weightKg: z.coerce.number().min(25).max(350).optional(), fitnessGoal: z.string().trim().max(200).optional(),
    relationshipPreference: z.string().trim().max(80).nullable().optional(), profileBio: z.string().trim().max(1200).optional(), fitnessLevel: z.enum(["beginner", "intermediate", "advanced", "athlete"]).optional(),
    preferredAgeMin: z.coerce.number().int().min(18).max(100).optional(), preferredAgeMax: z.coerce.number().int().min(18).max(100).optional(),
    latitude: z.coerce.number().min(-90).max(90).nullable().optional(), longitude: z.coerce.number().min(-180).max(180).nullable().optional(), interests: z.array(z.string().trim().min(2).max(50)).max(30).optional(),
    achievements: z.array(z.object({ title: z.string().trim().min(2).max(120), details: z.string().trim().max(500).optional() })).max(20).optional(),
    socialLinks: z.array(z.object({ platform: z.string().trim().min(2).max(40), url: z.string().url().max(300) })).max(10).optional()
  }).refine(value => value.preferredAgeMin == null || value.preferredAgeMax == null || value.preferredAgeMin <= value.preferredAgeMax, { message: "Preferred minimum age cannot exceed maximum age." }).parse(request.body);
  const text = moderateText(`${input.name || ""} ${input.profileBio || ""}`);
  if (!text.clean) return response.status(422).json({ error: "Profile text did not pass safety review.", categories: text.categories, suggestedName: input.name ? saferUsername(input.name) : undefined });
  const { interests, achievements, socialLinks, ...profile } = input;
  const interestList = interests ? validateInterestList(interests) : undefined;
  if (interestList && !interestList.ok) return response.status(400).json({ error: interestList.error, field: "interests" });
  await prisma.$transaction(async tx => {
    await tx.user.update({ where: { id: request.user!.id }, data: { ...profile, onboardingCompleted: true, lastSeenAt: new Date() } });
    if (interestList?.ok) { await tx.userInterest.deleteMany({ where: { userId: request.user!.id } }); if (interestList.interests.length) await tx.userInterest.createMany({ data: interestList.interests.map(interest => ({ userId: request.user!.id, interest })) }); }
    if (achievements) { await tx.userAchievement.deleteMany({ where: { userId: request.user!.id } }); if (achievements.length) await tx.userAchievement.createMany({ data: achievements.map(item => ({ userId: request.user!.id, ...item })) }); }
    if (socialLinks) { await tx.userSocialLink.deleteMany({ where: { userId: request.user!.id } }); if (socialLinks.length) await tx.userSocialLink.createMany({ data: socialLinks.map(item => ({ userId: request.user!.id, ...item })) }); }
  });
  const updated = await prisma.user.findUniqueOrThrow({ where: { id: request.user!.id }, include: publicInclude });
  response.json({ ...publicProfile(updated), email: updated.email, phone: updated.phone, profileCompletion: profileCompletion(updated) });
}));

socialRouter.post("/presence", asyncRoute(async (request: AuthRequest, response) => {
  const online = z.object({ online: z.boolean().default(true) }).parse(request.body || {}).online;
  await prisma.user.update({ where: { id: request.user!.id }, data: { isOnline: online, lastSeenAt: new Date() } });
  response.status(204).end();
}));

socialRouter.post("/verification", socialUpload.fields([{ name: "aadhaarFront", maxCount: 1 }, { name: "aadhaarBack", maxCount: 1 }, { name: "governmentId", maxCount: 1 }, { name: "ageProof", maxCount: 1 }, { name: "selfie", maxCount: 1 }, { name: "profilePhotos", maxCount: 6 }, { name: "introVideo", maxCount: 1 }]), asyncRoute(async (request: AuthRequest, response) => {
  const files = request.files as Record<string, Express.Multer.File[]>;
  const incoming = Object.values(files || {}).flat();
  const aadhaarFront = files?.aadhaarFront?.[0] || files?.governmentId?.[0];
  const aadhaarBack = files?.aadhaarBack?.[0];
  if (!aadhaarFront || !aadhaarBack || !files?.ageProof?.[0] || !files?.selfie?.[0] || (files?.profilePhotos?.length || 0) < 4) {
    discardIncomingUploads(incoming);
    return response.status(400).json({ error: "Aadhaar front, Aadhaar back, age proof, selfie, and at least four profile photos are required." });
  }
  const photoInspections = await Promise.all(files.profilePhotos.map(inspectPhoto));
  const hashes = photoInspections.map(item => item.hash);
  const duplicates = await prisma.userProfilePhoto.findMany({ where: { contentHash: { in: hashes }, userId: { not: request.user!.id } }, select: { contentHash: true } });
  const duplicateHashes = new Set(duplicates.map(item => item.contentHash));
  const riskScore = Math.min(100, Math.max(...photoInspections.map(item => item.riskScore), 0) + (duplicateHashes.size ? 60 : 0));
  const automatedNotes = [
    duplicateHashes.size ? "Possible duplicate profile photos detected." : "",
    ...photoInspections.map(item => item.notes),
    "AI/KYC placeholder: future provider can compare selfies, detect blur or spoofing, and flag gender/photo inconsistencies. Admin review remains the final decision."
  ].filter(Boolean).join(" ");
  const [governmentIdEncrypted, governmentIdBackEncrypted, ageProofEncrypted, selfieEncrypted, introVideoEncrypted, photos] = await Promise.all([
    storeEncryptedFile(aadhaarFront, "verification"), storeEncryptedFile(aadhaarBack, "verification"), storeEncryptedFile(files.ageProof[0], "verification"), storeEncryptedFile(files.selfie[0], "verification"),
    files.introVideo?.[0] ? storeEncryptedFile(files.introVideo[0], "verification") : Promise.resolve(undefined), optimizeUploads(files.profilePhotos, "social")
  ]);
  const previous = await prisma.socialVerification.findUnique({ where: { userId: request.user!.id } });
  const status = riskScore >= 60 ? "needs_review" : "pending";
  const result = await prisma.$transaction(async tx => {
    await tx.userProfilePhoto.deleteMany({ where: { userId: request.user!.id } });
    await tx.userProfilePhoto.createMany({ data: photos.map((photo, index) => ({ userId: request.user!.id, path: photo.path, contentHash: photoInspections[index].hash, sortOrder: index, moderationStatus: duplicateHashes.has(photoInspections[index].hash) ? "flagged" : "clean" })) });
    const verification = await tx.socialVerification.upsert({ where: { userId: request.user!.id }, update: { governmentIdEncrypted, governmentIdBackEncrypted, ageProofEncrypted, selfieEncrypted, introVideoEncrypted, status, riskScore, automatedNotes, rejectionReason: null, reviewedAt: null, reviewedById: null }, create: { userId: request.user!.id, governmentIdEncrypted, governmentIdBackEncrypted, ageProofEncrypted, selfieEncrypted, introVideoEncrypted, status, riskScore, automatedNotes } });
    if (riskScore > 0) await tx.moderationCase.create({ data: { subjectId: request.user!.id, targetType: "verification", targetId: verification.id, category: duplicateHashes.size ? "duplicate_photo" : "photo_quality", riskScore, evidence: { duplicateCount: duplicateHashes.size } } });
    return verification;
  });
  removePrivateFiles(previous ? [previous.governmentIdEncrypted, previous.governmentIdBackEncrypted, previous.ageProofEncrypted, previous.selfieEncrypted, previous.introVideoEncrypted] : []);
  response.status(201).json({ id: result.id, status: result.status, riskScore: result.riskScore });
}));

socialRouter.get("/discover", asyncRoute(async (request: AuthRequest, response) => {
  const query = z.object({ interest: z.string().trim().max(50).optional(), gender: z.enum(["male", "female", "other"]).optional(), ageMin: z.coerce.number().int().min(18).max(100).optional(), ageMax: z.coerce.number().int().min(18).max(100).optional(), distance: z.coerce.number().min(1).max(1000).optional(), city: z.string().trim().max(80).optional(), verified: z.enum(["true", "false"]).optional(), online: z.enum(["true", "false"]).optional(), premium: z.enum(["true", "false"]).optional(), sort: z.enum(["nearest", "active", "newest"]).default("active"), limit: z.coerce.number().int().min(1).max(100).default(30) }).parse(request.query);
  const viewer = await prisma.user.findUniqueOrThrow({ where: { id: request.user!.id }, include: { interests: true } });
  const viewerAge = ageFromDate(viewer.birthDate);
  const ageMin = query.ageMin ?? (viewerAge ? Math.max(18, viewerAge - 2) : 18);
  const ageMax = query.ageMax ?? (viewerAge ? viewerAge + 2 : 100);
  if (ageMin > ageMax) return response.status(400).json({ error: "Minimum age cannot exceed maximum age." });
  const requestedInterest = cleanInterest(query.interest);
  if (query.interest != null && requestedInterest.length < 2) return response.status(400).json({ error: "Enter at least two characters for an interest search." });
  const now = new Date();
  const defaultGender = query.gender || oppositeGender(viewer.gender);
  const viewerInterests = viewer.interests.map(item => cleanInterest(item.interest)).filter(Boolean);
  const interestClauses = requestedInterest
    ? [{ interests: { some: { interest: { equals: requestedInterest, mode: "insensitive" as const } } } }]
    : viewerInterests.map(interest => ({ interests: { some: { interest: { equals: interest, mode: "insensitive" as const } } } }));
  const candidates = await prisma.user.findMany({
    where: { id: { not: viewer.id }, accountStatus: "active", birthDate: { gte: dateForAge(ageMax + 1), lte: dateForAge(ageMin) }, verificationPaymentStatus: "paid", verificationPaidUntil: { gt: now }, ...(defaultGender ? { gender: defaultGender } : {}), ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}), ...(interestClauses.length === 1 ? interestClauses[0] : interestClauses.length ? { OR: interestClauses } : {}), socialVerification: { status: "approved" }, ...(query.online === "true" ? { isOnline: true, lastSeenAt: { gte: new Date(now.getTime() - 5 * 60_000) } } : {}), ...(query.premium === "true" ? { premiumUntil: { gt: now } } : {}), blocksReceived: { none: { blockerId: viewer.id } }, blocksMade: { none: { blockedId: viewer.id } } },
    include: publicInclude, orderBy: query.sort === "newest" ? { createdAt: "desc" } : { lastSeenAt: "desc" }, take: 100
  });
  const distanceLimit = query.distance || 1000;
  const items = candidates.map(candidate => ({ ...publicProfile(candidate), distanceKm: distanceKm(viewer.latitude, viewer.longitude, candidate.latitude, candidate.longitude), compatibility: compatibility(viewer, candidate) })).filter(item => item.distanceKm == null || item.distanceKm <= distanceLimit);
  if (query.sort === "nearest") items.sort((a, b) => (a.distanceKm ?? Number.MAX_VALUE) - (b.distanceKm ?? Number.MAX_VALUE));
  if (query.sort === "active") items.sort((a, b) => Number(b.online) - Number(a.online) || b.compatibility - a.compatibility);
  response.set("Cache-Control", "no-store").json({ items: items.slice(0, query.limit), suggestedAgeRange: { min: ageMin, max: ageMax } });
}));

socialRouter.get("/profiles/:id", asyncRoute(async (request: AuthRequest, response) => {
  const id = z.string().uuid().parse(request.params.id);
  if (await isBlocked(request.user!.id, id)) return response.status(404).json({ error: "Profile not found." });
  const profile = await prisma.user.findFirst({ where: { id, accountStatus: "active" }, include: publicInclude });
  if (!profile) return response.status(404).json({ error: "Profile not found." });
  if (id !== request.user!.id) await prisma.profileView.create({ data: { viewerId: request.user!.id, viewedId: id } });
  response.json(publicProfile(profile));
}));

socialRouter.post("/profiles/:id/reviews", asyncRoute(async (request: AuthRequest, response) => {
  const subjectId = z.string().uuid().parse(request.params.id);
  const input = z.object({ rating: z.coerce.number().int().min(1).max(5), comment: z.string().trim().max(500).optional() }).parse(request.body);
  if (subjectId === request.user!.id) return response.status(400).json({ error: "You cannot review yourself." });
  const accepted = await prisma.connectionInvite.findFirst({ where: { status: "accepted", OR: [{ senderId: request.user!.id, recipientId: subjectId }, { senderId: subjectId, recipientId: request.user!.id }] } });
  if (!accepted) return response.status(403).json({ error: "Reviews are available after an accepted connection." });
  response.status(201).json(await prisma.socialReview.upsert({ where: { authorId_subjectId: { authorId: request.user!.id, subjectId } }, update: input, create: { authorId: request.user!.id, subjectId, ...input } }));
}));

socialRouter.get("/invites", asyncRoute(async (request: AuthRequest, response) => response.json(await prisma.connectionInvite.findMany({ where: { OR: [{ senderId: request.user!.id }, { recipientId: request.user!.id }] }, include: { sender: { include: { profilePhotos: { orderBy: { sortOrder: "asc" }, take: 1 } } }, recipient: { include: { profilePhotos: { orderBy: { sortOrder: "asc" }, take: 1 } } } }, orderBy: { createdAt: "desc" }, take: 100 }))));

socialRouter.post("/invites", asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ recipientId: z.string().uuid(), message: z.string().trim().max(300).optional() }).parse(request.body);
  if (input.recipientId === request.user!.id) return response.status(400).json({ error: "You cannot invite yourself." });
  if (await isBlocked(request.user!.id, input.recipientId)) return response.status(403).json({ error: "This connection is unavailable." });
  const [sender, recipient] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: request.user!.id }, include: { socialVerification: true } }),
    prisma.user.findUnique({ where: { id: input.recipientId }, include: { socialVerification: true } })
  ]);
  if (!recipient || !hasActiveVerification(sender) || !hasActiveVerification(recipient)) return response.status(403).json({ error: "Both members need an approved and paid yearly verification before invites unlock." });
  const premium = Boolean(sender.premiumUntil && sender.premiumUntil > new Date());
  if (!premium) { const sentToday = await prisma.connectionInvite.count({ where: { senderId: sender.id, createdAt: { gte: startOfToday() } } }); if (sentToday >= 5) return response.status(403).json({ error: "Free accounts can send five invites per day. Upgrade to Premium for unlimited invites." }); }
  const reverse = await prisma.connectionInvite.findFirst({ where: { senderId: input.recipientId, recipientId: sender.id } });
  if (reverse) return response.status(409).json({ error: `This connection already exists with status ${reverse.status}.`, inviteId: reverse.id });
  const invite = await prisma.connectionInvite.upsert({ where: { senderId_recipientId: { senderId: sender.id, recipientId: input.recipientId } }, update: { status: "pending", message: input.message }, create: { senderId: sender.id, ...input } });
  await prisma.notification.create({ data: { userId: input.recipientId, type: "invite_received", title: "New fitness invite", message: `${sender.name} invited you to connect.` } });
  response.status(201).json(invite);
}));

socialRouter.patch("/invites/:id", asyncRoute(async (request: AuthRequest, response) => {
  const id = z.string().uuid().parse(request.params.id);
  const status = z.object({ status: z.enum(["accepted", "rejected", "blocked", "disconnected"]) }).parse(request.body).status;
  const invite = await prisma.connectionInvite.findUnique({ where: { id } });
  if (!invite || ![invite.senderId, invite.recipientId].includes(request.user!.id)) return response.status(404).json({ error: "Invite not found." });
  if (["accepted", "rejected", "blocked"].includes(status) && invite.recipientId !== request.user!.id) return response.status(403).json({ error: "Only the recipient can respond to this invite." });
  const updated = await prisma.$transaction(async tx => {
    const item = await tx.connectionInvite.update({ where: { id }, data: { status, acceptedAt: status === "accepted" ? new Date() : invite.acceptedAt } });
    if (status === "accepted") {
      await tx.conversation.upsert({ where: { connectionId: id }, update: { active: true }, create: { connectionId: id, userOneId: invite.senderId, userTwoId: invite.recipientId } });
      await tx.wallet.upsert({ where: { userId: invite.senderId }, update: {}, create: { userId: invite.senderId } });
      await tx.wallet.upsert({ where: { userId: invite.recipientId }, update: {}, create: { userId: invite.recipientId } });
      await tx.notification.create({ data: { userId: invite.senderId, type: "invite_accepted", title: "Invite accepted", message: "Your fitness connection invite was accepted. Chat is now unlocked." } });
    }
    if (["blocked", "disconnected"].includes(status)) await tx.conversation.updateMany({ where: { connectionId: id }, data: { active: false } });
    if (status === "blocked") await tx.userBlock.upsert({ where: { blockerId_blockedId: { blockerId: request.user!.id, blockedId: invite.senderId } }, update: {}, create: { blockerId: request.user!.id, blockedId: invite.senderId, reason: "Blocked from invite response" } });
    return item;
  });
  response.json(updated);
}));

socialRouter.get("/conversations", asyncRoute(async (request: AuthRequest, response) => {
  await settleDailyCharges(request.user!.id);
  const conversations = await prisma.conversation.findMany({ where: { active: true, OR: [{ userOneId: request.user!.id }, { userTwoId: request.user!.id }] }, include: { userOne: { include: { profilePhotos: { orderBy: { sortOrder: "asc" }, take: 1 }, socialVerification: { select: { status: true } } } }, userTwo: { include: { profilePhotos: { orderBy: { sortOrder: "asc" }, take: 1 }, socialVerification: { select: { status: true } } } }, messages: { where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { lastActivityAt: "desc" } });
  response.json(conversations.map(item => ({ id: item.id, connectionId: item.connectionId, partner: publicProfile(item.userOneId === request.user!.id ? item.userTwo : item.userOne), lastMessage: item.messages[0] || null, lastActivityAt: item.lastActivityAt })));
}));

socialRouter.get("/conversations/:id/messages", asyncRoute(async (request: AuthRequest, response) => {
  const conversation = await requireConversation(String(request.params.id), request.user!.id);
  const after = request.query.after ? new Date(String(request.query.after)) : undefined;
  await prisma.socialMessage.updateMany({ where: { conversationId: conversation.id, senderId: { not: request.user!.id }, readAt: null }, data: { readAt: new Date() } });
  const [messages, typing] = await Promise.all([prisma.socialMessage.findMany({ where: { conversationId: conversation.id, ...(after ? { createdAt: { gt: after } } : {}) }, include: { sender: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" }, take: 200 }), prisma.typingIndicator.findFirst({ where: { conversationId: conversation.id, userId: { not: request.user!.id }, expiresAt: { gt: new Date() } } })]);
  response.set("Cache-Control", "no-store").json({ messages: messages.map(message => ({ ...message, mediaUrl: message.mediaPath ? `/api/social/messages/${message.id}/media` : null, mediaPath: undefined, content: message.deletedAt ? null : message.content })), typing: Boolean(typing) });
}));

socialRouter.post("/conversations/:id/messages", socialUpload.single("media"), asyncRoute(async (request: AuthRequest, response) => {
  const conversation = await requireConversation(String(request.params.id), request.user!.id);
  const input = z.object({ type: z.enum(["text", "image", "voice", "workout"]).default("text"), content: z.string().trim().max(4000).optional() }).parse(request.body);
  const moderation = moderateText(input.content || "");
  if (!moderation.clean) { if (request.file) discardIncomingUploads([request.file]); await prisma.moderationCase.create({ data: { subjectId: request.user!.id, targetType: "message", category: moderation.categories.join(","), riskScore: moderation.riskScore, evidence: { excerpt: (input.content || "").slice(0, 200) } } }); return response.status(422).json({ error: "Message blocked by automated safety moderation.", categories: moderation.categories }); }
  if (!input.content && !request.file) return response.status(400).json({ error: "Message text or media is required." });
  const mediaPath = request.file ? await storeEncryptedFile(request.file, "messages") : undefined;
  const message = await prisma.$transaction(async tx => {
    const created = await tx.socialMessage.create({ data: { conversationId: conversation.id, senderId: request.user!.id, type: input.type, content: input.content, mediaPath, mediaMime: request.file?.mimetype } });
    await tx.conversation.update({ where: { id: conversation.id }, data: { lastActivityAt: new Date() } });
    const recipientId = conversation.userOneId === request.user!.id ? conversation.userTwoId : conversation.userOneId;
    await tx.notification.create({ data: { userId: recipientId, type: "message_received", title: "New message", message: input.type === "text" ? (input.content || "New message").slice(0, 120) : `New ${input.type} message` } });
    return created;
  });
  response.status(201).json({ ...message, mediaUrl: mediaPath ? `/api/social/messages/${message.id}/media` : null, mediaPath: undefined });
}));

socialRouter.post("/conversations/:id/typing", asyncRoute(async (request: AuthRequest, response) => {
  const conversation = await requireConversation(String(request.params.id), request.user!.id);
  await prisma.typingIndicator.upsert({ where: { conversationId_userId: { conversationId: conversation.id, userId: request.user!.id } }, update: { expiresAt: new Date(Date.now() + 5000) }, create: { conversationId: conversation.id, userId: request.user!.id, expiresAt: new Date(Date.now() + 5000) } });
  response.status(204).end();
}));

socialRouter.delete("/messages/:id", asyncRoute(async (request: AuthRequest, response) => {
  const message = await prisma.socialMessage.findUnique({ where: { id: String(request.params.id) }, include: { conversation: true } });
  if (!message || message.senderId !== request.user!.id) return response.status(404).json({ error: "Message not found." });
  await prisma.socialMessage.update({ where: { id: message.id }, data: { deletedAt: new Date(), content: null } });
  response.status(204).end();
}));

socialRouter.get("/messages/:id/media", asyncRoute(async (request: AuthRequest, response) => {
  const message = await prisma.socialMessage.findUnique({ where: { id: String(request.params.id) }, include: { conversation: true } });
  if (!message?.mediaPath || ![message.conversation.userOneId, message.conversation.userTwoId].includes(request.user!.id)) return response.status(404).json({ error: "Media not found." });
  response.type(message.mediaMime || "application/octet-stream").send(await readEncryptedFile(message.mediaPath));
}));

socialRouter.get("/wallet", asyncRoute(async (request: AuthRequest, response) => {
  await settleDailyCharges(request.user!.id);
  const wallet = await prisma.wallet.upsert({ where: { userId: request.user!.id }, update: {}, create: { userId: request.user!.id } });
  const transactions = await prisma.walletTransaction.findMany({ where: { userId: request.user!.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const verification = await prisma.socialVerification.findUnique({ where: { userId: request.user!.id }, select: { status: true, paymentStatus: true, expiresAt: true } });
  response.json({ wallet, transactions, verification, verificationFeePaise: 30000, minimumRechargePaise: 10000, dailyConnectionFeePaise: 500 });
}));

socialRouter.post("/wallet/recharge", asyncRoute(async (request: AuthRequest, response) => {
  const razorpayOrderId = z.object({ razorpayOrderId: z.string().min(5) }).parse(request.body).razorpayOrderId;
  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } });
  if (!payment || payment.userId !== request.user!.id || payment.status !== "paid" || payment.purpose !== "wallet_recharge" || Number(payment.amountPaise || 0) < 10000) return response.status(409).json({ error: "A verified wallet recharge of at least ₹100 is required." });
  const reference = `wallet:${payment.id}`;
  const existing = await prisma.walletTransaction.findUnique({ where: { reference } });
  if (existing) return response.json(existing);
  const transaction = await prisma.$transaction(async tx => {
    const wallet = await tx.wallet.upsert({ where: { userId: request.user!.id }, update: { balancePaise: { increment: payment.amountPaise! } }, create: { userId: request.user!.id, balancePaise: payment.amountPaise! } });
    return tx.walletTransaction.create({ data: { userId: request.user!.id, type: "recharge", amountPaise: payment.amountPaise!, balanceAfterPaise: wallet.balancePaise, reference, description: "Wallet recharge" } });
  });
  response.status(201).json(transaction);
}));

socialRouter.post("/verification/payment", asyncRoute(async (request: AuthRequest, response) => {
  const razorpayOrderId = z.object({ razorpayOrderId: z.string().min(5) }).parse(request.body).razorpayOrderId;
  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } });
  if (!payment || payment.userId !== request.user!.id || payment.status !== "paid" || payment.purpose !== "verification_fee" || Number(payment.amountPaise || 0) !== 30000) return response.status(409).json({ error: "A verified yearly verification payment of Rs. 300 is required." });
  const existingTx = await prisma.walletTransaction.findUnique({ where: { reference: `verification:${payment.id}` } });
  const startsAt = payment.paidAt || new Date();
  const expiresAt = new Date(startsAt.getTime() + 365 * 86400_000);
  const verification = await prisma.$transaction(async tx => {
    const current = await tx.socialVerification.findUnique({ where: { userId: request.user!.id } });
    if (!current) throw Object.assign(new Error("Submit verification documents before paying the yearly verification fee."), { status: 409 });
    const wallet = await tx.wallet.upsert({ where: { userId: request.user!.id }, update: {}, create: { userId: request.user!.id } });
    const updated = await tx.socialVerification.update({ where: { userId: request.user!.id }, data: { paymentStatus: "paid", paymentId: payment.id, paidAt: startsAt, expiresAt } });
    await tx.user.update({ where: { id: request.user!.id }, data: { verificationPaymentStatus: "paid", verificationPaidUntil: expiresAt } });
    if (!existingTx) await tx.walletTransaction.create({ data: { userId: request.user!.id, type: "verification_fee", amountPaise: -30000, balanceAfterPaise: wallet.balancePaise, reference: `verification:${payment.id}`, description: "Yearly verification fee paid by Razorpay" } });
    return updated;
  });
  response.status(201).json({ status: verification.status, paymentStatus: verification.paymentStatus, expiresAt: verification.expiresAt });
}));

socialRouter.post("/premium", asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ razorpayOrderId: z.string().min(5), plan: z.enum(["monthly", "quarterly", "annual"]) }).parse(request.body);
  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: input.razorpayOrderId } });
  if (!payment || payment.userId !== request.user!.id || payment.status !== "paid" || payment.purpose !== "premium") return response.status(409).json({ error: "Verified Premium payment not found." });
  const days = input.plan === "monthly" ? 30 : input.plan === "quarterly" ? 90 : 365;
  const startsAt = new Date(); const endsAt = new Date(startsAt.getTime() + days * 86400_000);
  const subscription = await prisma.$transaction(async tx => { await tx.premiumSubscription.updateMany({ where: { userId: request.user!.id, active: true }, data: { active: false } }); const item = await tx.premiumSubscription.create({ data: { userId: request.user!.id, plan: input.plan, startsAt, endsAt, amountPaise: payment.amountPaise || payment.amount * 100, paymentId: payment.id } }); await tx.user.update({ where: { id: request.user!.id }, data: { premiumUntil: endsAt } }); return item; });
  response.status(201).json(subscription);
}));

socialRouter.get("/profile-views", asyncRoute(async (request: AuthRequest, response) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: request.user!.id } });
  if (!user.premiumUntil || user.premiumUntil <= new Date()) return response.status(403).json({ error: "Who viewed your profile is a Premium feature." });
  response.json(await prisma.profileView.findMany({ where: { viewedId: user.id }, include: { viewer: { include: { profilePhotos: { orderBy: { sortOrder: "asc" }, take: 1 }, socialVerification: { select: { status: true } } } } }, orderBy: { createdAt: "desc" }, take: 100 }));
}));

socialRouter.post("/block", asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ userId: z.string().uuid(), reason: z.string().trim().max(300).optional() }).parse(request.body);
  if (input.userId === request.user!.id) return response.status(400).json({ error: "You cannot block yourself." });
  const block = await prisma.$transaction(async tx => { const item = await tx.userBlock.upsert({ where: { blockerId_blockedId: { blockerId: request.user!.id, blockedId: input.userId } }, update: { reason: input.reason }, create: { blockerId: request.user!.id, blockedId: input.userId, reason: input.reason } }); await tx.connectionInvite.updateMany({ where: { OR: [{ senderId: request.user!.id, recipientId: input.userId }, { senderId: input.userId, recipientId: request.user!.id }] }, data: { status: "blocked" } }); await tx.conversation.updateMany({ where: { OR: [{ userOneId: request.user!.id, userTwoId: input.userId }, { userOneId: input.userId, userTwoId: request.user!.id }] }, data: { active: false } }); return item; });
  response.status(201).json(block);
}));

socialRouter.post("/reports", asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ targetId: z.string().max(100), type: z.enum(["user", "message", "chat", "profile"]), reason: z.string().trim().min(10).max(1000) }).parse(request.body);
  const report = await prisma.report.create({ data: { reporterId: request.user!.id, targetId: input.targetId, type: input.type, reason: input.reason } });
  await prisma.moderationCase.create({ data: { subjectId: input.type === "user" || input.type === "profile" ? input.targetId : undefined, targetType: input.type, targetId: input.targetId, category: "user_report", riskScore: 50, evidence: { reportId: report.id, reason: input.reason } } });
  response.status(201).json(report);
}));

socialRouter.post("/emergency", asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ message: z.string().trim().min(5).max(1000), location: z.string().trim().max(300).optional() }).parse(request.body);
  response.status(201).json(await prisma.emergencyRequest.create({ data: { userId: request.user!.id, ...input } }));
}));

socialRouter.post("/push-subscriptions", asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ endpoint: z.string().url(), keys: z.object({ p256dh: z.string().min(10), auth: z.string().min(5) }) }).parse(request.body);
  response.status(201).json(await prisma.pushSubscription.upsert({ where: { endpoint: input.endpoint }, update: { userId: request.user!.id, p256dh: input.keys.p256dh, auth: input.keys.auth }, create: { userId: request.user!.id, endpoint: input.endpoint, p256dh: input.keys.p256dh, auth: input.keys.auth } }));
}));

socialRouter.get("/notifications", asyncRoute(async (request: AuthRequest, response) => {
  response.set("Cache-Control", "no-store").json(await prisma.notification.findMany({ where: { userId: request.user!.id }, orderBy: { createdAt: "desc" }, take: 100 }));
}));

socialRouter.patch("/notifications/:id", asyncRoute(async (request: AuthRequest, response) => {
  const id = z.string().uuid().parse(request.params.id);
  const notification = await prisma.notification.findFirst({ where: { id, userId: request.user!.id } });
  if (!notification) return response.status(404).json({ error: "Notification not found." });
  response.json(await prisma.notification.update({ where: { id }, data: { read: true } }));
}));

socialRouter.get("/admin/overview", allowRoles(...admins), asyncRoute(async (_request, response) => {
  const [users, pendingVerification, wallets, reports, conversations, premium, moderation, emergency] = await Promise.all([prisma.user.count(), prisma.socialVerification.count({ where: { status: { in: ["pending", "needs_review"] } } }), prisma.wallet.aggregate({ _count: true, _sum: { balancePaise: true } }), prisma.report.count({ where: { status: "open" } }), prisma.conversation.count({ where: { active: true } }), prisma.premiumSubscription.count({ where: { active: true, endsAt: { gt: new Date() } } }), prisma.moderationCase.count({ where: { status: "flagged" } }), prisma.emergencyRequest.count({ where: { status: "open" } })]);
  response.json({ users, pendingVerification, wallets, reports, conversations, premium, moderation, emergency });
}));

socialRouter.get("/admin/reports", allowRoles(...admins), asyncRoute(async (_request, response) => {
  response.json(await prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 200 }));
}));

socialRouter.patch("/admin/reports/:id", allowRoles(...admins), asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ status: z.enum(["open", "reviewing", "resolved", "dismissed"]) }).parse(request.body);
  response.json(await prisma.report.update({ where: { id: String(request.params.id) }, data: { status: input.status, resolvedById: ["resolved", "dismissed"].includes(input.status) ? request.user!.id : undefined } }));
}));

socialRouter.get("/admin/wallets", allowRoles(...admins), asyncRoute(async (_request, response) => {
  response.json(await prisma.wallet.findMany({ include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { updatedAt: "desc" }, take: 200 }));
}));

socialRouter.get("/admin/conversations", allowRoles(...admins), asyncRoute(async (_request, response) => {
  response.json(await prisma.conversation.findMany({
    include: { userOne: { select: { id: true, name: true, email: true } }, userTwo: { select: { id: true, name: true, email: true } }, connection: true, _count: { select: { messages: true } } },
    orderBy: { lastActivityAt: "desc" },
    take: 200
  }));
}));

socialRouter.get("/admin/premium", allowRoles(...admins), asyncRoute(async (_request, response) => {
  response.json(await prisma.premiumSubscription.findMany({ include: { user: { select: { id: true, name: true, email: true, premiumUntil: true } } }, orderBy: { createdAt: "desc" }, take: 200 }));
}));

socialRouter.get("/admin/analytics", allowRoles(...admins), asyncRoute(async (_request, response) => {
  const since = new Date(Date.now() - 30 * 86400_000);
  const [newUsers, invites, acceptedInvites, messages, walletVolume, premiumRevenue, profileViews, reports] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.connectionInvite.count({ where: { createdAt: { gte: since } } }),
    prisma.connectionInvite.count({ where: { acceptedAt: { gte: since } } }),
    prisma.socialMessage.count({ where: { createdAt: { gte: since }, deletedAt: null } }),
    prisma.walletTransaction.aggregate({ where: { createdAt: { gte: since }, amountPaise: { gt: 0 } }, _sum: { amountPaise: true } }),
    prisma.premiumSubscription.aggregate({ where: { createdAt: { gte: since } }, _sum: { amountPaise: true } }),
    prisma.profileView.count({ where: { createdAt: { gte: since } } }),
    prisma.report.count({ where: { createdAt: { gte: since } } })
  ]);
  response.json({ windowDays: 30, newUsers, invites, acceptedInvites, messages, walletVolumePaise: walletVolume._sum.amountPaise || 0, premiumRevenuePaise: premiumRevenue._sum.amountPaise || 0, profileViews, reports });
}));

socialRouter.get("/admin/verifications", allowRoles(...admins), asyncRoute(async (_request, response) => response.json(await prisma.socialVerification.findMany({ include: { user: { select: { id: true, name: true, email: true, birthDate: true, city: true, profilePhotos: true } } }, orderBy: [{ status: "asc" }, { createdAt: "asc" }], take: 200 }))));

socialRouter.patch("/admin/verifications/:id", allowRoles(...admins), asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ status: z.enum(["approved", "rejected", "needs_review"]), rejectionReason: z.string().trim().max(500).optional() }).parse(request.body);
  const verification = await prisma.socialVerification.update({ where: { id: String(request.params.id) }, data: { ...input, reviewedById: request.user!.id, reviewedAt: new Date() } });
  await prisma.notification.create({ data: { userId: verification.userId, type: `verification_${input.status}`, title: `Verification ${input.status}`, message: input.status === "approved" ? "Your FitSaathi profile is now verified." : input.rejectionReason || "Your verification needs attention." } });
  response.json(verification);
}));

socialRouter.get("/admin/verifications/:id/file/:kind", allowRoles(...admins), asyncRoute(async (request, response) => {
  const verification = await prisma.socialVerification.findUnique({ where: { id: String(request.params.id) } });
  if (!verification) return response.status(404).json({ error: "Verification not found." });
  const kind = z.enum(["government", "aadhaarBack", "age", "selfie", "video"]).parse(request.params.kind);
  const storedPath = kind === "government" ? verification.governmentIdEncrypted : kind === "aadhaarBack" ? verification.governmentIdBackEncrypted : kind === "age" ? verification.ageProofEncrypted : kind === "selfie" ? verification.selfieEncrypted : verification.introVideoEncrypted;
  if (!storedPath) return response.status(404).json({ error: "File not found." });
  response.type(kind === "video" ? "video/mp4" : "image/jpeg").send(await readEncryptedFile(storedPath));
}));

socialRouter.get("/admin/moderation", allowRoles(...admins), asyncRoute(async (_request, response) => response.json(await prisma.moderationCase.findMany({ include: { subject: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 200 }))));

socialRouter.patch("/admin/moderation/:id", allowRoles(...admins), asyncRoute(async (request, response) => {
  const status = z.object({ status: z.enum(["clean", "blocked"]) }).parse(request.body).status;
  response.json(await prisma.moderationCase.update({ where: { id: String(request.params.id) }, data: { status, resolvedAt: new Date() } }));
}));

async function requireConversation(id: string, userId: string) {
  const conversation = await prisma.conversation.findFirst({ where: { id, active: true, OR: [{ userOneId: userId }, { userTwoId: userId }] } });
  if (!conversation) { const error = new Error("Conversation not found or connection is inactive.") as Error & { status?: number }; error.status = 404; throw error; }
  return conversation;
}

async function isBlocked(first: string, second: string) {
  return Boolean(await prisma.userBlock.findFirst({ where: { OR: [{ blockerId: first, blockedId: second }, { blockerId: second, blockedId: first }] } }));
}

export async function settleDailyCharges(userId: string) {
  const today = startOfToday();
  const activeSince = new Date(Date.now() - 7 * 86400_000);
  const chargeableSince = new Date(Date.now() - 2 * 86400_000);
  const connections = await prisma.connectionInvite.findMany({ where: { status: "accepted", acceptedAt: { lte: chargeableSince }, OR: [{ senderId: userId }, { recipientId: userId }], conversation: { active: true, lastActivityAt: { gte: activeSince } }, dailyCharges: { none: { chargeDate: today } } }, include: { conversation: true }, take: 50 });
  for (const connection of connections) {
    try {
      await prisma.$transaction(async tx => {
        const [one, two] = await Promise.all([tx.wallet.findUnique({ where: { userId: connection.senderId } }), tx.wallet.findUnique({ where: { userId: connection.recipientId } })]);
        if (!one?.active || !two?.active || one.balancePaise < 500 || two.balancePaise < 500) return;
        const oneWallet = await tx.wallet.update({ where: { userId: connection.senderId }, data: { balancePaise: { decrement: 500 } } });
        const twoWallet = await tx.wallet.update({ where: { userId: connection.recipientId }, data: { balancePaise: { decrement: 500 } } });
        const oneTx = await tx.walletTransaction.create({ data: { userId: connection.senderId, type: "chat_fee", purpose: "CHAT_CHARGE", amountPaise: -500, balanceAfterPaise: oneWallet.balancePaise, reference: `connection:${connection.id}:${today.toISOString()}:${connection.senderId}`, description: "Daily chat access fee" } });
        const twoTx = await tx.walletTransaction.create({ data: { userId: connection.recipientId, type: "chat_fee", purpose: "CHAT_CHARGE", amountPaise: -500, balanceAfterPaise: twoWallet.balancePaise, reference: `connection:${connection.id}:${today.toISOString()}:${connection.recipientId}`, description: "Daily chat access fee" } });
        await tx.dailyConnectionCharge.create({ data: { connectionId: connection.id, chargeDate: today, userOneTxId: oneTx.id, userTwoTxId: twoTx.id } });
      });
    } catch (error: any) { if (error?.code !== "P2002") throw error; }
  }
}

function publicProfile(user: any) {
  const age = ageFromDate(user.birthDate);
  return { id: user.id, name: user.name, age, gender: user.gender, city: user.city, state: user.state, country: user.country, heightCm: user.heightCm, weightKg: user.weightKg, fitnessGoal: user.fitnessGoal, relationshipPreference: user.relationshipPreference, profileBio: user.profileBio, fitnessLevel: user.fitnessLevel, photos: (user.profilePhotos || []).map((photo: any) => photo.path), interests: (user.interests || []).map((item: any) => item.interest), achievements: user.achievements || [], socialLinks: user.socialLinks || [], verified: hasActiveVerification(user), verificationStatus: user.socialVerification?.status || "not_submitted", verificationPaymentStatus: effectivePaymentStatus(user), verificationExpiresAt: user.verificationPaidUntil || user.socialVerification?.expiresAt || null, online: Boolean(user.isOnline && user.lastSeenAt && new Date(user.lastSeenAt) > new Date(Date.now() - 5 * 60_000)), premium: Boolean(user.premiumUntil && new Date(user.premiumUntil) > new Date()), reviews: user.socialReviewsReceived || [], createdAt: user.createdAt };
}

function profileCompletion(user: any) {
  const checks = [
    Boolean(user.profilePhotos?.length >= 4),
    Boolean(user.profileBio),
    hasActiveVerification(user),
    Boolean(user.interests?.length),
    Boolean(user.city && user.state),
    Boolean(user.fitnessGoal),
    Boolean(user.gender),
    Boolean(user.birthDate)
  ];
  return {
    percent: Math.round(checks.filter(Boolean).length / checks.length * 100),
    photo: checks[0],
    bio: checks[1],
    verification: checks[2],
    interests: checks[3],
    location: checks[4],
    fitnessGoals: checks[5],
    gender: checks[6],
    birthDate: checks[7]
  };
}

function hasActiveVerification(user: any) {
  return Boolean(user.socialVerification?.status === "approved" && effectivePaymentStatus(user) === "paid");
}

function effectivePaymentStatus(user: any) {
  const status = user.verificationPaymentStatus || user.socialVerification?.paymentStatus || "unpaid";
  const expiresAt = user.verificationPaidUntil || user.socialVerification?.expiresAt;
  if (status === "paid" && expiresAt && new Date(expiresAt) <= new Date()) return "expired";
  return status;
}

function oppositeGender(value?: string | null) {
  if (value === "male") return "female";
  if (value === "female") return "male";
  return undefined;
}

function ageFromDate(value?: Date | string | null) { if (!value) return null; const birth = new Date(value); const now = new Date(); let age = now.getFullYear() - birth.getFullYear(); if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1; return age; }
function dateForAge(age: number) { const date = new Date(); date.setFullYear(date.getFullYear() - age); return date; }
function startOfToday() { const now = new Date(); return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); }
function distanceKm(aLat?: number | null, aLng?: number | null, bLat?: number | null, bLng?: number | null) { if (aLat == null || aLng == null || bLat == null || bLng == null) return null; const rad = (value: number) => value * Math.PI / 180; const dLat = rad(bLat - aLat), dLng = rad(bLng - aLng); const value = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2; return Math.round(6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)) * 10) / 10; }
function compatibility(viewer: any, candidate: any) { const first = new Set((viewer.interests || []).map((item: any) => item.interest.toLowerCase())); const second = new Set((candidate.interests || []).map((item: any) => item.interest.toLowerCase())); const common = [...first].filter(value => second.has(value)).length; const union = new Set([...first, ...second]).size || 1; const interestScore = common / union * 70; const goalScore = viewer.fitnessGoal && candidate.fitnessGoal && viewer.fitnessGoal.toLowerCase() === candidate.fitnessGoal.toLowerCase() ? 20 : 0; const ageDifference = Math.abs((ageFromDate(viewer.birthDate) || 0) - (ageFromDate(candidate.birthDate) || 0)); return Math.max(0, Math.min(100, Math.round(interestScore + goalScore + Math.max(0, 10 - ageDifference * 2)))); }
