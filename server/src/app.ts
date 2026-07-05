import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { z } from "zod";
import { accessToken, allowRoles, authenticate, hashToken, refreshToken, type AuthRequest, type SessionUser } from "./auth";
import { config } from "./config";
import { prisma } from "./db";
import { validateInterestList } from "./interests";
import { paymentsRouter, razorpayWebhookHandler, walletRouter } from "./payments";
import { databaseRateLimit } from "./rate-limit";
import { socialRouter } from "./social";
import { matchesRouter } from "./matches";
import { discardIncomingUploads, optimizeUploads, removeUploads, upload } from "./uploads";

const app = express();
const admins = ["admin", "super_admin", "moderator", "support_admin"];
const asyncRoute = (handler: (request: any, response: any) => Promise<unknown>) => (request: any, response: any, next: any) => Promise.resolve(handler(request, response)).catch(next);
const pricing = (value: unknown) => { const sellerPrice = Math.max(0, Math.round(Number(value) || 0)); return { sellerPrice, customerPrice: sellerPrice + 100, sellerPayout: sellerPrice + 50, platformFee: 50 }; };
const publicUser = { id: true, name: true, email: true, phone: true, role: true, accountStatus: true, address: true, acceptedPolicies: true, acceptedPolicyVersion: true, createdAt: true } as const;
const publicCoach = ({ phoneNumber: _phone, isPhoneVerified: _phoneVerified, coachPayout: _payout, ...coach }: any) => coach;
const publicDojo = ({ email: _email, phoneNumber: _phone, isPhoneVerified: _phoneVerified, gstNumber: _gst, accountHolder: _holder, accountNumberLast4: _account, ifsc: _ifsc, ...dojo }: any) => dojo;
const publicSellerRecord = ({ phone: _phone, aadhaarPath: _aadhaar, gstNumber: _gst, owner, ...seller }: any) => ({ ...seller, ...(owner ? { owner: { id: owner.id, name: owner.name } } : {}) });
const publicProductRecord = ({ sellerPrice: _sellerPrice, sellerPayout: _sellerPayout, platformFee: _platformFee, seller, ...product }: any) => ({ ...product, ...(seller ? { seller: publicSellerRecord(seller) } : {}) });

const sessionCookie = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };

async function issueSession(record: { id: string; name: string; email: string; role: string }, response: express.Response) {
  const claims: SessionUser = { id: record.id, email: record.email, role: record.role };
  const refresh = refreshToken(claims);
  const access = accessToken(claims);
  await prisma.refreshToken.create({ data: { tokenHash: hashToken(refresh), userId: record.id, expiresAt: new Date(Date.now() + 30 * 86400_000) } });
  response.cookie("fitsaathi_access", access, { ...sessionCookie, maxAge: 15 * 60_000 });
  response.cookie("fitsaathi_refresh", refresh, { ...sessionCookie, maxAge: 30 * 86400_000 });
  return { accessToken: access, refreshToken: refresh, user: { id: record.id, name: record.name, email: record.email, role: record.role } };
}

fs.mkdirSync(config.uploadRoot, { recursive: true });
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: config.frontendOrigin, credentials: true }));
app.post("/api/webhooks/razorpay", express.raw({ type: "application/json", limit: "1mb" }), razorpayWebhookHandler);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(config.uploadRoot, { maxAge: "1d", fallthrough: false }));
app.use("/api/uploads", express.static(config.uploadRoot, { maxAge: "1d", fallthrough: false }));
app.use("/api", databaseRateLimit(process.env.NODE_ENV === "production" ? 120 : 1000, 60_000));
app.get("/api/health", asyncRoute(async (_request, response) => { await prisma.$queryRaw`SELECT 1`; response.json({ ok: true, database: "connected", storage: config.uploadRoot }); }));

const credentials = z.object({ email: z.string().trim().email().transform(v => v.toLowerCase()), password: z.string().min(8).max(100) });
app.post("/api/auth/register", asyncRoute(async (request, response) => {
  const input = credentials.extend({ name: z.string().min(2).max(80), phone: z.string().max(20).optional(), gender: z.enum(["male", "female", "other"]).optional(), birthDate: z.coerce.date().optional(), city: z.string().trim().max(80).optional(), state: z.string().trim().max(80).optional(), country: z.string().trim().max(80).optional(), heightCm: z.coerce.number().int().min(100).max(250).optional(), weightKg: z.coerce.number().min(25).max(350).optional(), fitnessGoal: z.string().trim().max(200).optional(), relationshipPreference: z.string().trim().max(80).optional(), profileBio: z.string().trim().max(1200).optional(), fitnessLevel: z.enum(["beginner", "intermediate", "advanced", "athlete"]).optional(), preferredAgeMin: z.coerce.number().int().min(18).max(100).optional(), preferredAgeMax: z.coerce.number().int().min(18).max(100).optional(), interests: z.array(z.string().trim().min(2).max(50)).max(30).optional(), acceptedPolicies: z.boolean().optional(), acceptedPolicyVersion: z.string().max(40).optional() }).parse(request.body);
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) return response.status(409).json({ error: "An account with this email address already exists.", code: "DUPLICATE_EMAIL", field: "email" });
  const passwordHash = await bcrypt.hash(input.password, 12);
  const { interests = [], password: _password, ...details } = input;
  const interestList = validateInterestList(interests);
  if (!interestList.ok) return response.status(400).json({ error: interestList.error, field: "interests" });
  const user = await prisma.$transaction(async tx => {
    const created = await tx.user.create({ data: { ...details, passwordHash, acceptedPolicies: input.acceptedPolicies === true, acceptedAt: input.acceptedPolicies ? new Date() : undefined, onboardingCompleted: Boolean(input.gender && input.birthDate && input.city && input.state && input.heightCm && input.weightKg && input.fitnessGoal && input.profileBio) }, select: publicUser });
    if (interestList.interests.length) await tx.userInterest.createMany({ data: interestList.interests.map(interest => ({ userId: created.id, interest })) });
    await tx.wallet.create({ data: { userId: created.id } });
    return created;
  });
  response.status(201).json(await issueSession(user, response));
}));
app.post("/api/auth/login", asyncRoute(async (request, response) => {
  const input = credentials.extend({ acceptedPolicies: z.boolean().optional(), acceptedPolicyVersion: z.string().max(40).optional() }).parse(request.body); const record = await prisma.user.findUnique({ where: { email: input.email } });
  if (!record || record.accountStatus !== "active" || !await bcrypt.compare(input.password, record.passwordHash)) return response.status(401).json({ error: "Invalid email or password.", code: "INVALID_CREDENTIALS" });
  const current = input.acceptedPolicies ? await prisma.user.update({ where: { id: record.id }, data: { acceptedPolicies: true, acceptedPolicyVersion: input.acceptedPolicyVersion, acceptedAt: new Date() } }) : record;
  response.json(await issueSession(current, response));
}));
app.post("/api/auth/refresh", asyncRoute(async (request, response) => {
  const token = String(request.body?.refreshToken || request.headers.cookie?.match(/(?:^|;\s*)fitsaathi_refresh=([^;]+)/)?.[1] || "");
  if (token.length < 20) return response.status(401).json({ error: "Refresh session expired." });
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!stored || stored.expiresAt < new Date() || stored.user.accountStatus !== "active") return response.status(401).json({ error: "Refresh session expired." });
  const user = { id: stored.user.id, email: stored.user.email, role: stored.user.role };
  const access = accessToken(user);
  response.cookie("fitsaathi_access", access, { ...sessionCookie, maxAge: 15 * 60_000 });
  response.json({ accessToken: access, user: { ...user, name: stored.user.name } });
}));
app.post("/api/auth/logout", asyncRoute(async (request, response) => { const token = String(request.body?.refreshToken || request.headers.cookie?.match(/(?:^|;\s*)fitsaathi_refresh=([^;]+)/)?.[1] || ""); if (token) await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(token) } }); response.clearCookie("fitsaathi_access", sessionCookie); response.clearCookie("fitsaathi_refresh", sessionCookie); response.status(204).end(); }));
app.get("/api/auth/me", authenticate, asyncRoute(async (request: AuthRequest, response) => response.json(await prisma.user.findUnique({ where: { id: request.user!.id }, select: publicUser }))));
app.post("/api/auth/forgot-password", asyncRoute(async (request, response) => {
  credentials.pick({ email: true }).parse(request.body);
  response.json({ message: "If the account exists, ask an administrator to reset the password. Email delivery is not configured." });
}));
app.post("/api/auth/change-password", authenticate, asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ currentPassword: z.string().min(8), newPassword: z.string().min(8).max(100) }).parse(request.body);
  const user = await prisma.user.findUnique({ where: { id: request.user!.id } });
  if (!user || !await bcrypt.compare(input.currentPassword, user.passwordHash)) return response.status(401).json({ error: "Current password is incorrect." });
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(input.newPassword, 12) } });
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  response.status(204).end();
}));

app.get("/api/stats", asyncRoute(async (_request, response) => {
  const [coaches, dojos, bookings, users, products, sellers] = await prisma.$transaction([
    prisma.coach.count(), prisma.dojo.count(), prisma.booking.count(), prisma.user.count(), prisma.product.count({ where: { status: "approved" } }), prisma.seller.count()
  ]);
  response.set("Cache-Control", "no-store").json({ coaches, dojos, bookings, users, products, sellers });
}));

app.get("/api/coaches", asyncRoute(async (request, response) => {
  const query = z.object({ featured: z.enum(["true", "false"]).optional(), limit: z.coerce.number().int().min(1).max(100).default(24), search: z.string().trim().max(100).optional(), category: z.string().trim().max(80).optional(), city: z.string().trim().max(80).optional() }).parse(request.query);
  const featured = query.featured === "true";
  const where: any = { ...(featured ? { verified: true, status: "approved" } : { status: { not: "suspended" } }), ...(query.category ? { category: { contains: query.category, mode: "insensitive" } } : {}), ...(query.city ? { city: { contains: query.city, mode: "insensitive" } } : {}), ...(query.search ? { OR: [{ name: { contains: query.search, mode: "insensitive" } }, { category: { contains: query.search, mode: "insensitive" } }, { bio: { contains: query.search, mode: "insensitive" } }] } : {}) };
  const items = await prisma.coach.findMany({ where, orderBy: featured ? { rating: "desc" } : { createdAt: "desc" }, take: query.limit });
  response.json(items.map(publicCoach));
}));
app.get("/api/coaches/:id", asyncRoute(async (request, response) => {
  const item = await prisma.coach.findUnique({ where: { id: String(request.params.id) }, include: { reviews: true } });
  item ? response.json(publicCoach(item)) : response.status(404).json({ error: "Coach not found." });
}));
app.post("/api/coaches", authenticate, upload.fields([{ name: "photo", maxCount: 1 }, { name: "certificate", maxCount: 1 }, { name: "aadharFront", maxCount: 1 }, { name: "aadharBack", maxCount: 1 }]), asyncRoute(async (request: AuthRequest, response) => {
  const files = request.files as Record<string, Express.Multer.File[]>;
  const incomingFiles = Object.values(files || {}).flat();
  const parsed = z.object({ name: z.string().min(2), phoneNumber: z.string().min(10), category: z.string().min(2), customCategory: z.string().optional(), city: z.string().min(2), price: z.coerce.number().positive(), availableTimings: z.string().min(2), bio: z.string().max(2000).optional() }).safeParse(request.body);
  if (!parsed.success) {
    discardIncomingUploads(incomingFiles);
    return response.status(400).json({ error: "Please correct the coach registration fields.", issues: parsed.error.issues });
  }
  const input = parsed.data;
  const existing = await prisma.coach.findUnique({ where: { ownerId: request.user!.id }, select: { id: true, status: true } });
  if (existing) {
    discardIncomingUploads(incomingFiles);
    return response.status(409).json({ error: "This account already has a coach profile.", code: "COACH_PROFILE_EXISTS", field: "ownerId", profileId: existing.id, status: existing.status });
  }
  if (!files?.aadharFront?.length) {
    discardIncomingUploads(incomingFiles);
    return response.status(400).json({ error: "Aadhaar front image is required." });
  }
  const [photo, certificate, aadhaarFront, aadhaarBack] = await Promise.all([
    optimizeUploads(files.photo || [], "providers"), optimizeUploads(files.certificate || [], "providers"), optimizeUploads(files.aadharFront || [], "aadhaar"), optimizeUploads(files.aadharBack || [], "aadhaar")
  ]);
  const category = input.category === "Other" ? String(input.customCategory || "Other") : input.category;
  const days = Array.isArray(request.body.availableDays) ? request.body.availableDays.map(String) : request.body.availableDays ? [String(request.body.availableDays)] : [];
  const timings = input.availableTimings.split(",").map(value => value.trim()).filter(Boolean);
  const baseFee = Math.round(input.price); const platformFee = 700;
  const result = await prisma.$transaction(async tx => {
    const coach = await tx.coach.create({ data: { ownerId: request.user!.id, name: input.name, phoneNumber: input.phoneNumber, category, city: input.city, bio: input.bio, baseFee, platformFee, customerPrice: baseFee + platformFee, coachPayout: baseFee + 100, availableDays: days, availableTimings: timings, photoPath: photo[0]?.path } });
    await tx.providerVerification.create({ data: { ownerId: request.user!.id, profileId: coach.id, profileType: "coach", aadhaarFrontPath: aadhaarFront[0]?.path, aadhaarBackPath: aadhaarBack[0]?.path, certificatePath: certificate[0]?.path } });
    const user = await tx.user.update({ where: { id: request.user!.id }, data: { role: "coach", phone: input.phoneNumber } });
    return { coach, user };
  });
  response.status(201).json({ profile: result.coach, session: await issueSession(result.user, response) });
}));
app.put("/api/coaches/:id", authenticate, asyncRoute(async (request: AuthRequest, response) => {
  const coach = await prisma.coach.findUnique({ where: { id: String(request.params.id) } });
  if (!coach) return response.status(404).json({ error: "Coach not found." });
  if (coach.ownerId !== request.user!.id && !admins.includes(request.user!.role)) return response.status(403).json({ error: "Not your coach profile." });
  const input = z.object({ name: z.string().min(2).optional(), category: z.string().min(2).optional(), city: z.string().optional(), bio: z.string().optional(), baseFee: z.coerce.number().positive().optional(), availableDays: z.array(z.string()).optional(), availableTimings: z.array(z.string()).optional() }).parse(request.body);
  const baseFee = input.baseFee == null ? undefined : Math.round(input.baseFee);
  response.json(await prisma.coach.update({ where: { id: coach.id }, data: { ...input, ...(baseFee == null ? {} : { baseFee, customerPrice: baseFee + coach.platformFee, coachPayout: baseFee + 100 }), verified: admins.includes(request.user!.role) ? coach.verified : false, status: admins.includes(request.user!.role) ? coach.status : "pending" } }));
}));
app.delete("/api/coaches/:id", authenticate, asyncRoute(async (request: AuthRequest, response) => {
  const coach = await prisma.coach.findUnique({ where: { id: String(request.params.id) } });
  if (!coach) return response.status(404).json({ error: "Coach not found." });
  if (coach.ownerId !== request.user!.id && !["admin", "super_admin"].includes(request.user!.role)) return response.status(403).json({ error: "Not your coach profile." });
  const verification = await prisma.providerVerification.findUnique({ where: { profileType_profileId: { profileType: "coach", profileId: coach.id } } });
  await prisma.$transaction([prisma.providerVerification.deleteMany({ where: { profileType: "coach", profileId: coach.id } }), prisma.coach.delete({ where: { id: coach.id } })]);
  removeUploads([coach.photoPath, verification?.aadhaarFrontPath, verification?.aadhaarBackPath, verification?.certificatePath]);
  response.status(204).end();
}));

app.get("/api/dojos", asyncRoute(async (request, response) => {
  const query = z.object({ featured: z.enum(["true", "false"]).optional(), limit: z.coerce.number().int().min(1).max(100).default(24) }).parse(request.query);
  const featured = query.featured === "true";
  const items = await prisma.dojo.findMany({ where: featured ? { approved: true, status: "approved" } : { status: { not: "suspended" } }, orderBy: featured ? { rating: "desc" } : { createdAt: "desc" }, take: query.limit });
  response.json(items.map(publicDojo));
}));
app.get("/api/dojos/:id", asyncRoute(async (request, response) => {
  const item = await prisma.dojo.findUnique({ where: { id: String(request.params.id) }, include: { reviews: true } });
  item ? response.json(publicDojo(item)) : response.status(404).json({ error: "Dojo not found." });
}));
app.post("/api/dojos", authenticate, upload.fields([{ name: "photo", maxCount: 1 }, { name: "certificate", maxCount: 1 }, { name: "aadharFront", maxCount: 1 }, { name: "aadharBack", maxCount: 1 }]), asyncRoute(async (request: AuthRequest, response) => {
  const files = request.files as Record<string, Express.Multer.File[]>;
  const incomingFiles = Object.values(files || {}).flat();
  const parsed = z.object({ name: z.string().min(2), ownerName: z.string().min(2), email: z.string().email(), phoneNumber: z.string().min(10), category: z.string().min(2), customCategory: z.string().optional(), address: z.string().min(5), city: z.string().min(2), state: z.string().min(2), pincode: z.string().regex(/^\d{6}$/), price: z.coerce.number().min(0), experience: z.string().min(2), gstNumber: z.string().optional(), accountHolder: z.string().min(2), accountNumber: z.string().min(4).max(34), ifsc: z.string().min(4).max(20), description: z.string().max(2000).optional(), razorpayOrderId: z.string().min(3) }).safeParse(request.body);
  if (!parsed.success) { discardIncomingUploads(incomingFiles); return response.status(400).json({ error: "Please correct the dojo registration fields.", issues: parsed.error.issues }); }
  const input = parsed.data;
  const existing = await prisma.dojo.findUnique({ where: { ownerId: request.user!.id }, select: { id: true, status: true } });
  if (existing) { discardIncomingUploads(incomingFiles); return response.status(409).json({ error: "This account already has a dojo profile.", code: "DOJO_PROFILE_EXISTS", field: "ownerId", profileId: existing.id, status: existing.status }); }
  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: input.razorpayOrderId } });
  if (!payment || payment.userId !== request.user!.id || payment.purpose !== "dojo_registration" || payment.status !== "paid") { discardIncomingUploads(incomingFiles); return response.status(409).json({ error: "A verified dojo registration payment is required.", code: "DOJO_PAYMENT_REQUIRED" }); }
  if (payment.targetId) { discardIncomingUploads(incomingFiles); return response.status(409).json({ error: "This registration payment has already been used.", code: "DOJO_PAYMENT_USED" }); }
  if (!files?.aadharFront?.length) { discardIncomingUploads(incomingFiles); return response.status(400).json({ error: "Aadhaar front image is required." }); }
  const [photo, certificate, aadhaarFront, aadhaarBack] = await Promise.all([
    optimizeUploads(files.photo || [], "providers"), optimizeUploads(files.certificate || [], "providers"), optimizeUploads(files.aadharFront || [], "aadhaar"), optimizeUploads(files.aadharBack || [], "aadhaar")
  ]);
  const category = input.category === "Other" ? String(input.customCategory || "Other") : input.category;
  const price = Math.round(input.price);
  const result = await prisma.$transaction(async tx => {
    const dojo = await tx.dojo.create({ data: { ownerId: request.user!.id, name: input.name, ownerName: input.ownerName, email: input.email.toLowerCase(), phoneNumber: input.phoneNumber, category, address: input.address, city: input.city, state: input.state, pincode: input.pincode, experience: input.experience, gstNumber: input.gstNumber, accountHolder: input.accountHolder, accountNumberLast4: input.accountNumber.slice(-4), ifsc: input.ifsc.toUpperCase(), description: input.description, originalPrice: price, finalPrice: price, imagePath: photo[0]?.path, registrationPaymentStatus: "paid" } });
    await tx.providerVerification.create({ data: { ownerId: request.user!.id, profileId: dojo.id, profileType: "dojo", aadhaarFrontPath: aadhaarFront[0]?.path, aadhaarBackPath: aadhaarBack[0]?.path, certificatePath: certificate[0]?.path } });
    await tx.payment.update({ where: { id: payment.id }, data: { targetType: "dojo", targetId: dojo.id } });
    const user = await tx.user.update({ where: { id: request.user!.id }, data: { role: "dojo", phone: input.phoneNumber } });
    return { dojo, user };
  });
  response.status(201).json({ profile: result.dojo, session: await issueSession(result.user, response) });
}));
app.put("/api/dojos/:id", authenticate, asyncRoute(async (request: AuthRequest, response) => {
  const dojo = await prisma.dojo.findUnique({ where: { id: String(request.params.id) } });
  if (!dojo) return response.status(404).json({ error: "Dojo not found." });
  if (dojo.ownerId !== request.user!.id && !admins.includes(request.user!.role)) return response.status(403).json({ error: "Not your dojo profile." });
  const input = z.object({ name: z.string().min(2).optional(), category: z.string().optional(), city: z.string().optional(), description: z.string().optional(), originalPrice: z.coerce.number().min(0).optional() }).parse(request.body);
  response.json(await prisma.dojo.update({ where: { id: dojo.id }, data: { ...input, ...(input.originalPrice == null ? {} : { finalPrice: Math.round(input.originalPrice) }), approved: admins.includes(request.user!.role) ? dojo.approved : false, status: admins.includes(request.user!.role) ? dojo.status : "pending" } }));
}));
app.delete("/api/dojos/:id", authenticate, asyncRoute(async (request: AuthRequest, response) => {
  const dojo = await prisma.dojo.findUnique({ where: { id: String(request.params.id) } });
  if (!dojo) return response.status(404).json({ error: "Dojo not found." });
  if (dojo.ownerId !== request.user!.id && !["admin", "super_admin"].includes(request.user!.role)) return response.status(403).json({ error: "Not your dojo profile." });
  const verification = await prisma.providerVerification.findUnique({ where: { profileType_profileId: { profileType: "dojo", profileId: dojo.id } } });
  await prisma.$transaction([prisma.providerVerification.deleteMany({ where: { profileType: "dojo", profileId: dojo.id } }), prisma.dojo.delete({ where: { id: dojo.id } })]);
  removeUploads([dojo.imagePath, verification?.aadhaarFrontPath, verification?.aadhaarBackPath, verification?.certificatePath]);
  response.status(204).end();
}));

app.post("/api/contact", asyncRoute(async (request, response) => {
  const input = z.object({ name: z.string().min(2).max(100), email: z.string().email(), phone: z.string().max(20).optional(), message: z.string().min(10).max(2000) }).parse(request.body);
  const item = await prisma.contactMessage.create({ data: input }); response.status(201).json({ id: item.id });
}));
app.post("/api/chats", authenticate, asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ coachId: z.string().uuid(), message: z.string().min(2).max(1000) }).parse(request.body);
  response.status(201).json(await prisma.chatRequest.create({ data: { userId: request.user!.id, ...input } }));
}));

app.get("/api/products", asyncRoute(async (request, response) => {
  const query = z.object({ search: z.string().optional(), category: z.string().optional(), brand: z.string().optional(), trusted: z.enum(["true", "false"]).optional(), minPrice: z.coerce.number().optional(), maxPrice: z.coerce.number().optional(), page: z.coerce.number().min(1).default(1), limit: z.coerce.number().min(1).max(50).default(20), sort: z.enum(["newest", "price_asc", "price_desc", "rating"]).default("newest") }).parse(request.query);
  const where: any = { status: "approved", ...(query.category && { category: query.category }), ...(query.brand && { brand: query.brand }), ...(query.trusted === "true" && { seller: { trusted: true } }), ...((query.minPrice != null || query.maxPrice != null) && { customerPrice: { gte: query.minPrice, lte: query.maxPrice } }), ...(query.search && { OR: [{ title: { contains: query.search, mode: "insensitive" } }, { description: { contains: query.search, mode: "insensitive" } }] }) };
  const orderBy: any = query.sort === "price_asc" ? { customerPrice: "asc" } : query.sort === "price_desc" ? { customerPrice: "desc" } : query.sort === "rating" ? { rating: "desc" } : { createdAt: "desc" };
  const [items, total] = await prisma.$transaction([prisma.product.findMany({ where, include: { images: true, seller: { select: { id: true, storeName: true, trusted: true, verified: true, rating: true } } }, orderBy: [{ seller: { trusted: "desc" } }, orderBy], skip: (query.page - 1) * query.limit, take: query.limit }), prisma.product.count({ where })]);
  response.json({ items: items.map(publicProductRecord), total, page: query.page, pages: Math.ceil(total / query.limit) });
}));
app.get("/api/products/:id", asyncRoute(async (request, response) => { const item = await prisma.product.findUnique({ where: { id: request.params.id }, include: { images: true, seller: true, reviews: true } }); item ? response.json(publicProductRecord(item)) : response.status(404).json({ error: "Product not found." }); }));
app.post("/api/products", authenticate, allowRoles("seller", ...admins), upload.array("images", 6), asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ title: z.string().min(3), description: z.string().min(10), category: z.string().min(2), brand: z.string().min(1), sellerPrice: z.coerce.number().positive(), stock: z.coerce.number().int().min(0) }).parse(request.body);
  const seller = await prisma.seller.findUnique({ where: { ownerId: request.user!.id } }); if (!seller) return response.status(403).json({ error: "Seller profile required." });
  const images = await optimizeUploads((request.files as Express.Multer.File[]) || [], "products"); const item = await prisma.product.create({ data: { sellerId: seller.id, ...input, ...pricing(input.sellerPrice), images: { create: images.map((image, sortOrder) => ({ ...image, sortOrder })) } }, include: { images: true } }); response.status(201).json(item);
}));
app.put("/api/products/:id", authenticate, allowRoles("seller", ...admins), asyncRoute(async (request: AuthRequest, response) => {
  const item = await prisma.product.findUnique({ where: { id: String(request.params.id) }, include: { seller: true } }); if (!item) return response.status(404).json({ error: "Product not found." });
  if (!admins.includes(request.user!.role) && item.seller.ownerId !== request.user!.id) return response.status(403).json({ error: "Not your product." });
  const input = z.object({ title: z.string().min(3).optional(), description: z.string().min(10).optional(), category: z.string().optional(), brand: z.string().optional(), sellerPrice: z.coerce.number().positive().optional(), stock: z.coerce.number().int().min(0).optional() }).parse(request.body);
  response.json(await prisma.product.update({ where: { id: item.id }, data: { ...input, ...(input.sellerPrice != null ? pricing(input.sellerPrice) : {}), status: "pending" } }));
}));
app.delete("/api/products/:id", authenticate, allowRoles("seller", ...admins), asyncRoute(async (request: AuthRequest, response) => {
  const item = await prisma.product.findUnique({ where: { id: String(request.params.id) }, include: { seller: true, images: true } });
  if (!item) return response.status(404).json({ error: "Product not found." });
  if (!admins.includes(request.user!.role) && item.seller.ownerId !== request.user!.id) return response.status(403).json({ error: "Not your product." });
  await prisma.product.delete({ where: { id: item.id } });
  removeUploads(item.images.flatMap(image => [image.path, image.thumbnail]));
  response.status(204).end();
}));

app.get("/api/sellers", asyncRoute(async (_request, response) => {
  const sellers = await prisma.seller.findMany({ where: { status: { in: ["verified", "trusted"] } }, orderBy: [{ trusted: "desc" }, { rating: "desc" }], include: { owner: { select: { id: true, name: true } } } });
  response.json(sellers.map(publicSellerRecord));
}));
app.get("/api/sellers/:id", asyncRoute(async (request, response) => {
  const seller = await prisma.seller.findUnique({ where: { id: String(request.params.id) }, include: { owner: { select: { id: true, name: true } } } });
  seller ? response.json(publicSellerRecord(seller)) : response.status(404).json({ error: "Seller not found." });
}));
app.get("/api/seller/me", authenticate, asyncRoute(async (request: AuthRequest, response) => {
  const seller = await prisma.seller.findUnique({ where: { ownerId: request.user!.id }, include: { owner: { select: publicUser } } });
  seller ? response.json(seller) : response.status(404).json({ error: "Seller profile not found." });
}));
app.post("/api/sellers", authenticate, upload.fields([{ name: "aadhaar", maxCount: 1 }, { name: "profile", maxCount: 1 }]), asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ storeName: z.string().min(2), phone: z.string().min(8), address: z.string().min(8), bio: z.string().max(1000).optional(), gstNumber: z.string().optional(), website: z.string().optional(), socialLinks: z.string().optional() }).parse(request.body); const files = request.files as Record<string, Express.Multer.File[]>;
  const aadhaar = await optimizeUploads(files?.aadhaar || [], "aadhaar"); const profile = await optimizeUploads(files?.profile || [], "sellers");
  const result = await prisma.$transaction(async tx => { const seller = await tx.seller.create({ data: { ownerId: request.user!.id, ...input, aadhaarPath: aadhaar[0]?.path, profilePath: profile[0]?.path } }); const user = await tx.user.update({ where: { id: request.user!.id }, data: { role: "seller", phone: input.phone } }); return { seller, user }; });
  response.status(201).json({ ...result.seller, session: await issueSession(result.user, response) });
}));
app.patch("/api/sellers/:id/verify", authenticate, allowRoles("admin", "super_admin", "moderator"), asyncRoute(async (request: AuthRequest, response) => { const status = z.object({ status: z.enum(["pending", "verified", "trusted", "rejected", "suspended"]) }).parse(request.body).status; const seller = await prisma.seller.update({ where: { id: String(request.params.id) }, data: { status, verified: ["verified", "trusted"].includes(status), trusted: status === "trusted" } }); await prisma.adminLog.create({ data: { actorId: request.user!.id, action: "seller_status", targetId: seller.id, details: { status }, ip: request.ip } }); response.json(seller); }));

app.post("/api/orders", authenticate, asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ shippingAddress: z.string().min(10), items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1) }).parse(request.body);
  const order = await prisma.$transaction(async tx => { const products = await tx.product.findMany({ where: { id: { in: input.items.map(i => i.productId) }, status: "approved" } }); if (products.length !== input.items.length) throw new Error("One or more products are unavailable."); const lines = input.items.map(line => { const product = products.find(p => p.id === line.productId)!; if (product.stock < line.quantity) throw new Error(`${product.title} is out of stock.`); return { product, quantity: line.quantity }; }); const total = lines.reduce((sum, line) => sum + line.product.customerPrice * line.quantity, 0); const platformRevenue = lines.reduce((sum, line) => sum + line.product.platformFee * line.quantity, 0); const created = await tx.order.create({ data: { userId: request.user!.id, shippingAddress: input.shippingAddress, total, platformRevenue, items: { create: lines.map(line => ({ productId: line.product.id, sellerId: line.product.sellerId, quantity: line.quantity, customerPrice: line.product.customerPrice, sellerPayout: line.product.sellerPayout, platformFee: line.product.platformFee })) } }, include: { items: true } }); for (const line of lines) await tx.product.update({ where: { id: line.product.id }, data: { stock: { decrement: line.quantity } } }); return created; }); response.status(201).json(order);
}));
app.get("/api/orders", authenticate, asyncRoute(async (request: AuthRequest, response) => response.json(await prisma.order.findMany({ where: admins.includes(request.user!.role) ? {} : { userId: request.user!.id }, include: { items: { include: { product: { include: { images: true } } } }, payment: true }, orderBy: { createdAt: "desc" }, take: 100 }))));

app.get("/api/seller/dashboard", authenticate, allowRoles("seller", ...admins), asyncRoute(async (request: AuthRequest, response) => {
  const seller = await prisma.seller.findUnique({ where: { ownerId: request.user!.id }, include: { owner: { select: publicUser } } });
  if (!seller) return response.status(404).json({ error: "Seller profile not found." });
  const [products, orders] = await Promise.all([
    prisma.product.findMany({ where: { sellerId: seller.id }, include: { images: true }, orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({ where: { items: { some: { sellerId: seller.id } } }, include: { items: { where: { sellerId: seller.id }, include: { product: true } }, payment: true }, orderBy: { createdAt: "desc" } })
  ]);
  response.json({ seller, products, orders });
}));
app.patch("/api/seller/orders/:id/status", authenticate, allowRoles("seller", ...admins), asyncRoute(async (request: AuthRequest, response) => {
  const status = z.object({ status: z.enum(["processing", "shipped", "delivered", "cancelled"]) }).parse(request.body).status;
  const seller = await prisma.seller.findUnique({ where: { ownerId: request.user!.id } });
  const order = await prisma.order.findFirst({ where: { id: String(request.params.id), ...(admins.includes(request.user!.role) ? {} : { items: { some: { sellerId: seller?.id || "" } } }) } });
  if (!order) return response.status(404).json({ error: "Order not found." });
  response.json(await prisma.order.update({ where: { id: order.id }, data: { status } }));
}));

app.get("/api/bookings", authenticate, asyncRoute(async (request: AuthRequest, response) => {
  const where = admins.includes(request.user!.role) ? {} : ["coach", "dojo"].includes(request.user!.role) ? { providerOwnerId: request.user!.id } : { userId: request.user!.id };
  response.json(await prisma.booking.findMany({ where, include: { coach: true, dojo: true, attendance: true }, orderBy: { createdAt: "desc" }, take: 100 }));
}));
app.patch("/api/bookings/:id/status", authenticate, asyncRoute(async (request: AuthRequest, response) => {
  const status = z.object({ status: z.enum(["accepted", "rejected", "completed", "cancelled"]) }).parse(request.body).status;
  const booking = await prisma.booking.findUnique({ where: { id: String(request.params.id) }, include: { customer: true, providerOwner: true } });
  if (!booking) return response.status(404).json({ error: "Booking not found." });
  if (booking.providerOwnerId !== request.user!.id && !admins.includes(request.user!.role)) return response.status(403).json({ error: "You cannot manage this booking." });
  if (status === "accepted" && booking.paymentStatus !== "paid") return response.status(409).json({ error: "Only paid bookings can be accepted." });
  const visible = ["accepted", "completed"].includes(status);
  const updated = await prisma.$transaction(async tx => {
    const item = await tx.booking.update({ where: { id: booking.id }, data: { status, contactVisible: visible, customerPhone: visible ? booking.customer.phone : null, providerPhone: visible ? booking.providerOwner.phone : null, payoutStatus: status === "accepted" ? "pending" : ["rejected", "cancelled"].includes(status) ? "held" : booking.payoutStatus } });
    if (["accepted", "rejected"].includes(status)) await tx.notification.create({ data: { userId: booking.userId, bookingId: booking.id, type: `booking_${status}`, title: `Booking ${status}`, message: status === "accepted" ? "Your provider accepted the booking." : "Your provider rejected the booking." } });
    return item;
  });
  response.json(updated);
}));

app.get("/api/dashboard/summary", authenticate, asyncRoute(async (request: AuthRequest, response) => {
  const provider = ["coach", "dojo"].includes(request.user!.role);
  const bookingWhere = provider ? { providerOwnerId: request.user!.id } : { userId: request.user!.id };
  const [bookings, wishlist, payments, reviews, attendance, notifications, customers] = await Promise.all([
    prisma.booking.count({ where: bookingWhere }), prisma.wishlist.count({ where: { userId: request.user!.id } }), prisma.payment.count({ where: provider ? { booking: { providerOwnerId: request.user!.id } } : { userId: request.user!.id } }), prisma.providerReview.count({ where: provider ? { OR: [{ coach: { ownerId: request.user!.id } }, { dojo: { ownerId: request.user!.id } }] } : { userId: request.user!.id } }), prisma.attendance.count({ where: provider ? { scannedById: request.user!.id } : { customerId: request.user!.id } }), prisma.notification.count({ where: { userId: request.user!.id } }), provider ? prisma.booking.groupBy({ by: ["userId"], where: bookingWhere }).then(rows => rows.length) : Promise.resolve(0)
  ]);
  response.json({ bookings, students: customers, memberships: bookings, favorites: wishlist, payments, reviews, attendance, notifications });
}));

app.get("/api/reviews", authenticate, asyncRoute(async (request: AuthRequest, response) => {
  const where = request.user!.role === "coach" ? { coach: { ownerId: request.user!.id } } : request.user!.role === "dojo" ? { dojo: { ownerId: request.user!.id } } : { userId: request.user!.id };
  response.json(await prisma.providerReview.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }));
}));

app.get("/api/cart", authenticate, asyncRoute(async (request: AuthRequest, response) => response.json(await prisma.cartItem.findMany({ where: { userId: request.user!.id }, include: { product: { include: { images: true, seller: true } } }, orderBy: { createdAt: "asc" } }))));
app.post("/api/cart", authenticate, asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(20).default(1) }).parse(request.body);
  response.status(201).json(await prisma.cartItem.upsert({ where: { userId_productId: { userId: request.user!.id, productId: input.productId } }, update: { quantity: { increment: input.quantity } }, create: { userId: request.user!.id, ...input } }));
}));
app.patch("/api/cart/:productId", authenticate, asyncRoute(async (request: AuthRequest, response) => {
  const quantity = z.object({ quantity: z.number().int().min(1).max(20) }).parse(request.body).quantity;
  response.json(await prisma.cartItem.update({ where: { userId_productId: { userId: request.user!.id, productId: String(request.params.productId) } }, data: { quantity } }));
}));
app.delete("/api/cart/:productId", authenticate, asyncRoute(async (request: AuthRequest, response) => { await prisma.cartItem.deleteMany({ where: { userId: request.user!.id, productId: String(request.params.productId) } }); response.status(204).end(); }));
app.delete("/api/cart", authenticate, asyncRoute(async (request: AuthRequest, response) => { await prisma.cartItem.deleteMany({ where: { userId: request.user!.id } }); response.status(204).end(); }));

app.get("/api/notifications", authenticate, asyncRoute(async (request: AuthRequest, response) => response.json(await prisma.notification.findMany({ where: { userId: request.user!.id }, orderBy: { createdAt: "desc" }, take: 100 }))));
app.patch("/api/notifications/:id/read", authenticate, asyncRoute(async (request: AuthRequest, response) => {
  const notification = await prisma.notification.findFirst({ where: { id: String(request.params.id), userId: request.user!.id } });
  if (!notification) return response.status(404).json({ error: "Notification not found." });
  response.json(await prisma.notification.update({ where: { id: notification.id }, data: { read: true } }));
}));

app.get("/api/admin/users", authenticate, allowRoles(...admins), asyncRoute(async (_request, response) => response.json(await prisma.user.findMany({ select: publicUser, orderBy: { createdAt: "desc" }, take: 300 }))));
app.get("/api/admin/snapshot", authenticate, allowRoles(...admins), asyncRoute(async (_request, response) => {
  const [users, sellers, products, orders, reports, payments, audit, notifications, settings, verifications, coaches, dojos, bookings, counts] = await Promise.all([
    prisma.user.findMany({ select: publicUser, orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.seller.findMany({ include: { owner: { select: publicUser } }, orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.product.findMany({ include: { images: true, seller: { include: { owner: { select: publicUser } } } }, orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.order.findMany({ include: { items: true, user: { select: publicUser } }, orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.adminLog.findMany({ include: { actor: { select: publicUser } }, orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.platformSettings.findUnique({ where: { id: "global" } }),
    prisma.providerVerification.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.coach.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.dojo.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
    Promise.all([prisma.user.count(), prisma.coach.count(), prisma.dojo.count(), prisma.seller.count(), prisma.booking.count(), prisma.product.count(), prisma.order.count()])
      .then(([users, coaches, dojos, sellers, bookings, products, orders]) => ({ users, coaches, dojos, sellers, bookings, products, orders }))
  ]);
  response.set("Cache-Control", "no-store").json({ users, sellers, products, orders, reports, payments, audit, notifications, settings, verifications, coaches, dojos, bookings, counts });
}));
app.patch("/api/admin/providers/:type/:id/status", authenticate, allowRoles("admin", "super_admin", "moderator"), asyncRoute(async (request: AuthRequest, response) => {
  const type = z.enum(["coach", "dojo"]).parse(request.params.type);
  const status = z.enum(["pending", "approved", "rejected", "suspended"]).parse(request.body.status);
  const id = String(request.params.id);
  const result = type === "coach" ? await prisma.coach.update({ where: { id }, data: { status, verified: status === "approved" } }) : await prisma.dojo.update({ where: { id }, data: { status, approved: status === "approved" } });
  await prisma.providerVerification.updateMany({ where: { profileType: type, profileId: id }, data: { status, reviewedById: request.user!.id, reviewedAt: new Date() } });
  await prisma.adminLog.create({ data: { actorId: request.user!.id, action: "provider_status", targetId: id, details: { type, status }, ip: request.ip } });
  response.json(result);
}));
app.put("/api/admin/settings", authenticate, allowRoles("admin", "super_admin"), asyncRoute(async (request: AuthRequest, response) => {
  const input = z.object({ commissionPercent: z.coerce.number().min(0).max(50), highValueOrderThreshold: z.coerce.number().min(0).max(10_000_000), maintenanceMode: z.boolean(), manualSellerVerification: z.boolean() }).parse(request.body);
  response.json(await prisma.platformSettings.upsert({ where: { id: "global" }, update: { ...input, updatedById: request.user!.id }, create: { id: "global", ...input, updatedById: request.user!.id } }));
}));
app.patch("/api/admin/products/:id/status", authenticate, allowRoles("admin", "super_admin", "moderator"), asyncRoute(async (request: AuthRequest, response) => {
  const status = z.object({ status: z.enum(["pending", "approved", "rejected"]) }).parse(request.body).status;
  const product = await prisma.product.update({ where: { id: String(request.params.id) }, data: { status } });
  await prisma.adminLog.create({ data: { actorId: request.user!.id, action: "product_status", targetId: product.id, details: { status }, ip: request.ip } });
  response.json(product);
}));
app.delete("/api/admin/product/:id", authenticate, allowRoles("admin", "super_admin"), asyncRoute(async (request: AuthRequest, response) => {
  const targetId = String(request.params.id);
  const item = await prisma.product.findUnique({ where: { id: targetId }, include: { images: true } });
  if (!item) return response.status(404).json({ error: "Product not found." });
  await prisma.product.delete({ where: { id: targetId } });
  removeUploads(item.images.flatMap(image => [image.path, image.thumbnail]));
  await prisma.adminLog.create({ data: { actorId: request.user!.id, action: "delete_product", targetId, ip: request.ip } });
  response.status(204).end();
}));
app.get("/api/admin/analytics", authenticate, allowRoles(...admins), asyncRoute(async (_request, response) => { const [users, coaches, dojos, sellers, bookings, products, orders, revenue] = await Promise.all([prisma.user.count(), prisma.coach.count(), prisma.dojo.count(), prisma.seller.count(), prisma.booking.count(), prisma.product.count(), prisma.order.count(), prisma.order.aggregate({ _sum: { total: true, platformRevenue: true } })]); response.set("Cache-Control", "no-store").json({ users, coaches, dojos, sellers, bookings, products, orders, revenue: revenue._sum }); }));

app.use("/api/social", socialRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/wallet", walletRouter);

app.use((_request, response) => response.status(404).json({ error: "API route not found." }));
app.use((error: any, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) return response.status(400).json({ error: "Invalid request.", issues: error.issues });
  if (error?.code === "P2002") {
    const fields = Array.isArray(error?.meta?.target) ? error.meta.target.map(String) : error?.meta?.target ? [String(error.meta.target)] : [];
    const field = fields[0] || "record";
    const labels: Record<string, string> = { email: "email address", phone: "phone number", ownerId: "owner account", tokenHash: "session token", razorpayOrderId: "payment order", razorpayPaymentId: "payment" };
    return response.status(409).json({ error: `A record with this ${labels[field] || field} already exists.`, code: `DUPLICATE_${field.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`, field, fields });
  }
  console.error(error);
  response.status(Number(error?.status) || 500).json({ error: error instanceof Error ? error.message : "Server error." });
});

export { app };
