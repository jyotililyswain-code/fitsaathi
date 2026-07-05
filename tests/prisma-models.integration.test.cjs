require("dotenv/config");

const assert = require("node:assert/strict");
const test = require("node:test");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

test("every Prisma model supports its CRUD lifecycle and required relations", async () => {
  const stamp = Date.now();
  const ids = {};
  try {
    for (const [kind, role] of [["customer", "customer"], ["coach", "coach"], ["dojo", "dojo"], ["seller", "seller"], ["admin", "admin"]]) {
      const user = await prisma.user.create({ data: { name: `Audit ${kind}`, email: `model-${kind}-${stamp}@example.test`, passwordHash: "not-a-login-hash", role } });
      ids[`${kind}User`] = user.id;
    }
    assert.equal((await prisma.user.update({ where: { id: ids.customerUser }, data: { address: "Updated address" } })).address, "Updated address");

    const token = await prisma.refreshToken.create({ data: { tokenHash: `audit-${stamp}`, userId: ids.customerUser, expiresAt: new Date(Date.now() + 60_000) } });
    assert.ok(await prisma.refreshToken.findUnique({ where: { id: token.id } }));
    assert.equal((await prisma.refreshToken.update({ where: { id: token.id }, data: { expiresAt: new Date(Date.now() + 120_000) } })).id, token.id);

    const coach = await prisma.coach.create({ data: { ownerId: ids.coachUser, name: "Audit Coach", category: "Strength", city: "Delhi", baseFee: 800, customerPrice: 1500, coachPayout: 900 } }); ids.coach = coach.id;
    assert.equal((await prisma.coach.update({ where: { id: coach.id }, data: { verified: true, status: "approved" } })).verified, true);
    const dojo = await prisma.dojo.create({ data: { ownerId: ids.dojoUser, name: "Audit Dojo", category: "Karate", city: "Delhi", originalPrice: 1800, finalPrice: 1800 } }); ids.dojo = dojo.id;
    assert.equal((await prisma.dojo.update({ where: { id: dojo.id }, data: { approved: true, status: "approved" } })).approved, true);

    const verification = await prisma.providerVerification.create({ data: { ownerId: ids.coachUser, profileId: coach.id, profileType: "coach", aadhaarFrontPath: "/private/audit.webp" } }); ids.verification = verification.id;
    assert.equal((await prisma.providerVerification.update({ where: { id: verification.id }, data: { status: "approved", reviewedById: ids.adminUser } })).status, "approved");

    const seller = await prisma.seller.create({ data: { ownerId: ids.sellerUser, storeName: "Audit Store", phone: "9876543210", address: "Audit address" } }); ids.seller = seller.id;
    assert.equal((await prisma.seller.update({ where: { id: seller.id }, data: { verified: true, status: "verified" } })).verified, true);
    const product = await prisma.product.create({ data: { sellerId: seller.id, title: "Audit Product", description: "Direct Prisma model lifecycle test.", category: "Audit", brand: "Audit", sellerPrice: 100, customerPrice: 200, sellerPayout: 150, platformFee: 50, stock: 3 } }); ids.product = product.id;
    assert.equal((await prisma.product.update({ where: { id: product.id }, data: { status: "approved" } })).status, "approved");
    const image = await prisma.productImage.create({ data: { productId: product.id, path: "/uploads/products/audit.webp" } }); ids.image = image.id;
    assert.equal((await prisma.productImage.update({ where: { id: image.id }, data: { sortOrder: 2 } })).sortOrder, 2);

    const order = await prisma.order.create({ data: { userId: ids.customerUser, total: 200, platformRevenue: 50, shippingAddress: "Audit shipping address" } }); ids.order = order.id;
    assert.equal((await prisma.order.update({ where: { id: order.id }, data: { status: "paid" } })).status, "paid");
    const item = await prisma.orderItem.create({ data: { orderId: order.id, productId: product.id, sellerId: seller.id, quantity: 1, customerPrice: 200, sellerPayout: 150, platformFee: 50 } }); ids.orderItem = item.id;
    assert.equal((await prisma.orderItem.update({ where: { id: item.id }, data: { quantity: 2 } })).quantity, 2);

    const booking = await prisma.booking.create({ data: { userId: ids.customerUser, providerOwnerId: ids.coachUser, coachId: coach.id, customerName: "Audit Customer", preferredDate: "2099-01-01", amount: 1500, originalPrice: 800, platformFee: 700, finalPrice: 1500, coachPayout: 900, payoutAmount: 900, commissionAmount: 600 } }); ids.booking = booking.id;
    assert.equal((await prisma.booking.update({ where: { id: booking.id }, data: { status: "accepted" } })).status, "accepted");
    const attendance = await prisma.attendance.create({ data: { id: `attendance-${stamp}`, bookingId: booking.id, customerId: ids.customerUser, scannedById: ids.coachUser, providerProfileId: coach.id, nonceHash: `nonce-${stamp}` } }); ids.attendance = attendance.id;
    assert.equal((await prisma.attendance.update({ where: { id: attendance.id }, data: { location: "Audit room" } })).location, "Audit room");

    const payment = await prisma.payment.create({ data: { userId: ids.customerUser, orderId: order.id, bookingId: booking.id, sellerId: seller.id, amount: 200, status: "created", platformFee: 50, sellerPayout: 150 } }); ids.payment = payment.id;
    assert.equal((await prisma.payment.update({ where: { id: payment.id }, data: { status: "paid" } })).status, "paid");
    const review = await prisma.review.create({ data: { userId: ids.customerUser, productId: product.id, rating: 5, comment: "Audit review" } }); ids.review = review.id;
    assert.equal((await prisma.review.update({ where: { id: review.id }, data: { rating: 4 } })).rating, 4);
    const providerReview = await prisma.providerReview.create({ data: { userId: ids.customerUser, coachId: coach.id, rating: 5 } }); ids.providerReview = providerReview.id;
    assert.equal((await prisma.providerReview.update({ where: { id: providerReview.id }, data: { comment: "Updated" } })).comment, "Updated");

    const notification = await prisma.notification.create({ data: { userId: ids.customerUser, bookingId: booking.id, type: "audit", message: "Audit notification" } }); ids.notification = notification.id;
    assert.equal((await prisma.notification.update({ where: { id: notification.id }, data: { read: true } })).read, true);
    const wishlist = await prisma.wishlist.create({ data: { userId: ids.customerUser, productId: product.id } }); ids.wishlist = wishlist.id;
    assert.ok(await prisma.wishlist.findUnique({ where: { id: wishlist.id } }));
    const cart = await prisma.cartItem.create({ data: { userId: ids.customerUser, productId: product.id } }); ids.cart = cart.id;
    assert.equal((await prisma.cartItem.update({ where: { id: cart.id }, data: { quantity: 2 } })).quantity, 2);

    const chat = await prisma.chatRequest.create({ data: { userId: ids.customerUser, coachId: coach.id, message: "Audit chat" } }); ids.chat = chat.id;
    assert.equal((await prisma.chatRequest.update({ where: { id: chat.id }, data: { status: "accepted" } })).status, "accepted");
    const contact = await prisma.contactMessage.create({ data: { name: "Audit", email: `contact-${stamp}@example.test`, message: "Audit contact message" } }); ids.contact = contact.id;
    assert.equal((await prisma.contactMessage.update({ where: { id: contact.id }, data: { status: "closed" } })).status, "closed");
    const settings = await prisma.platformSettings.create({ data: { id: `audit-${stamp}`, commissionPercent: 9 } }); ids.settings = settings.id;
    assert.equal((await prisma.platformSettings.update({ where: { id: settings.id }, data: { commissionPercent: 10 } })).commissionPercent, 10);
    const report = await prisma.report.create({ data: { reporterId: ids.customerUser, targetId: coach.id, type: "coach", reason: "Audit report" } }); ids.report = report.id;
    assert.equal((await prisma.report.update({ where: { id: report.id }, data: { status: "resolved", resolvedById: ids.adminUser } })).status, "resolved");
    const log = await prisma.adminLog.create({ data: { actorId: ids.adminUser, action: "model_audit", targetId: product.id } }); ids.log = log.id;
    assert.ok(await prisma.adminLog.findUnique({ where: { id: log.id } }));
    const rateLimit = await prisma.rateLimitBucket.create({ data: { key: `audit-${stamp}`, resetAt: new Date(Date.now() + 60_000) } }); ids.rateLimit = rateLimit.key;
    assert.equal((await prisma.rateLimitBucket.update({ where: { key: rateLimit.key }, data: { count: { increment: 1 } } })).count, 2);

    const socialPhoto = await prisma.userProfilePhoto.create({ data: { userId: ids.customerUser, path: "/uploads/social/audit.webp", contentHash: `hash-${stamp}`, moderationStatus: "clean" } }); ids.socialPhoto = socialPhoto.id;
    assert.equal((await prisma.userProfilePhoto.update({ where: { id: socialPhoto.id }, data: { sortOrder: 1 } })).sortOrder, 1);
    const socialVerification = await prisma.socialVerification.create({ data: { userId: ids.customerUser, governmentIdEncrypted: "private/government.enc", ageProofEncrypted: "private/age.enc", selfieEncrypted: "private/selfie.enc" } }); ids.socialVerification = socialVerification.id;
    assert.equal((await prisma.socialVerification.update({ where: { id: socialVerification.id }, data: { status: "approved", reviewedById: ids.adminUser } })).status, "approved");
    const interest = await prisma.userInterest.create({ data: { userId: ids.customerUser, interest: "Karate" } }); ids.interest = interest.id;
    assert.ok(await prisma.userInterest.findUnique({ where: { id: interest.id } }));
    const achievement = await prisma.userAchievement.create({ data: { userId: ids.customerUser, title: "Audit Belt", details: "CRUD test" } }); ids.achievement = achievement.id;
    assert.equal((await prisma.userAchievement.update({ where: { id: achievement.id }, data: { details: "Updated" } })).details, "Updated");
    const socialLink = await prisma.userSocialLink.create({ data: { userId: ids.customerUser, platform: "Instagram", url: "https://example.test/fitsaathi" } }); ids.socialLink = socialLink.id;
    assert.equal((await prisma.userSocialLink.update({ where: { id: socialLink.id }, data: { platform: "Website" } })).platform, "Website");
    const invite = await prisma.connectionInvite.create({ data: { senderId: ids.customerUser, recipientId: ids.coachUser, message: "Audit invite" } }); ids.invite = invite.id;
    assert.equal((await prisma.connectionInvite.update({ where: { id: invite.id }, data: { status: "accepted", acceptedAt: new Date() } })).status, "accepted");
    const conversation = await prisma.conversation.create({ data: { connectionId: invite.id, userOneId: ids.customerUser, userTwoId: ids.coachUser } }); ids.conversation = conversation.id;
    assert.equal((await prisma.conversation.update({ where: { id: conversation.id }, data: { active: true } })).active, true);
    const socialMessage = await prisma.socialMessage.create({ data: { conversationId: conversation.id, senderId: ids.customerUser, content: "Audit social message" } }); ids.socialMessage = socialMessage.id;
    assert.equal((await prisma.socialMessage.update({ where: { id: socialMessage.id }, data: { readAt: new Date() } })).id, socialMessage.id);
    const typing = await prisma.typingIndicator.create({ data: { conversationId: conversation.id, userId: ids.customerUser, expiresAt: new Date(Date.now() + 5000) } }); ids.typing = typing.id;
    assert.ok(await prisma.typingIndicator.findUnique({ where: { id: typing.id } }));
    const wallet = await prisma.wallet.create({ data: { userId: ids.customerUser, balancePaise: 10000 } }); ids.wallet = wallet.id;
    assert.equal((await prisma.wallet.update({ where: { id: wallet.id }, data: { balancePaise: { increment: 500 } } })).balancePaise, 10500);
    const coachWallet = await prisma.wallet.create({ data: { userId: ids.coachUser, balancePaise: 10000 } }); ids.coachWallet = coachWallet.id;
    const walletTx = await prisma.walletTransaction.create({ data: { userId: ids.customerUser, type: "recharge", amountPaise: 10000, balanceAfterPaise: 10000, reference: `wallet-audit-${stamp}` } }); ids.walletTx = walletTx.id;
    const coachWalletTx = await prisma.walletTransaction.create({ data: { userId: ids.coachUser, type: "connection_fee", amountPaise: -500, balanceAfterPaise: 9500, reference: `wallet-audit-coach-${stamp}` } }); ids.coachWalletTx = coachWalletTx.id;
    const dailyCharge = await prisma.dailyConnectionCharge.create({ data: { connectionId: invite.id, chargeDate: new Date(), userOneTxId: walletTx.id, userTwoTxId: coachWalletTx.id } }); ids.dailyCharge = dailyCharge.id;
    assert.ok(await prisma.dailyConnectionCharge.findUnique({ where: { id: dailyCharge.id } }));
    const premium = await prisma.premiumSubscription.create({ data: { userId: ids.customerUser, plan: "monthly", startsAt: new Date(), endsAt: new Date(Date.now() + 30 * 86400_000), amountPaise: 19900 } }); ids.premium = premium.id;
    assert.equal((await prisma.premiumSubscription.update({ where: { id: premium.id }, data: { active: false } })).active, false);
    const profileView = await prisma.profileView.create({ data: { viewerId: ids.coachUser, viewedId: ids.customerUser } }); ids.profileView = profileView.id;
    assert.ok(await prisma.profileView.findUnique({ where: { id: profileView.id } }));
    const socialReview = await prisma.socialReview.create({ data: { authorId: ids.coachUser, subjectId: ids.customerUser, rating: 5, comment: "Audit social review" } }); ids.socialReview = socialReview.id;
    assert.equal((await prisma.socialReview.update({ where: { id: socialReview.id }, data: { rating: 4 } })).rating, 4);
    const push = await prisma.pushSubscription.create({ data: { userId: ids.customerUser, endpoint: `https://push.example.test/${stamp}`, p256dh: "audit-p256dh-key", auth: "audit-auth" } }); ids.push = push.id;
    assert.ok(await prisma.pushSubscription.findUnique({ where: { id: push.id } }));
    const moderation = await prisma.moderationCase.create({ data: { subjectId: ids.customerUser, targetType: "profile", category: "audit", riskScore: 10 } }); ids.moderation = moderation.id;
    assert.equal((await prisma.moderationCase.update({ where: { id: moderation.id }, data: { status: "clean" } })).status, "clean");
    const emergency = await prisma.emergencyRequest.create({ data: { userId: ids.customerUser, message: "Audit emergency" } }); ids.emergency = emergency.id;
    assert.equal((await prisma.emergencyRequest.update({ where: { id: emergency.id }, data: { status: "closed" } })).status, "closed");
    const block = await prisma.userBlock.create({ data: { blockerId: ids.adminUser, blockedId: ids.sellerUser, reason: "Audit block" } }); ids.block = block.id;
    assert.ok(await prisma.userBlock.findUnique({ where: { id: block.id } }));

    assert.equal((await prisma.chatRequest.delete({ where: { id: chat.id } })).id, chat.id); delete ids.chat;
    assert.equal((await prisma.contactMessage.delete({ where: { id: contact.id } })).id, contact.id); delete ids.contact;
    assert.equal((await prisma.platformSettings.delete({ where: { id: settings.id } })).id, settings.id); delete ids.settings;
  } finally {
    await prisma.userBlock.deleteMany({ where: { id: ids.block || "__missing__" } });
    await prisma.emergencyRequest.deleteMany({ where: { id: ids.emergency || "__missing__" } });
    await prisma.moderationCase.deleteMany({ where: { id: ids.moderation || "__missing__" } });
    await prisma.pushSubscription.deleteMany({ where: { id: ids.push || "__missing__" } });
    await prisma.socialReview.deleteMany({ where: { id: ids.socialReview || "__missing__" } });
    await prisma.profileView.deleteMany({ where: { id: ids.profileView || "__missing__" } });
    await prisma.premiumSubscription.deleteMany({ where: { id: ids.premium || "__missing__" } });
    await prisma.dailyConnectionCharge.deleteMany({ where: { id: ids.dailyCharge || "__missing__" } });
    await prisma.walletTransaction.deleteMany({ where: { id: { in: [ids.walletTx, ids.coachWalletTx].filter(Boolean) } } });
    await prisma.wallet.deleteMany({ where: { id: { in: [ids.wallet, ids.coachWallet].filter(Boolean) } } });
    await prisma.typingIndicator.deleteMany({ where: { id: ids.typing || "__missing__" } });
    await prisma.socialMessage.deleteMany({ where: { id: ids.socialMessage || "__missing__" } });
    await prisma.conversation.deleteMany({ where: { id: ids.conversation || "__missing__" } });
    await prisma.connectionInvite.deleteMany({ where: { id: ids.invite || "__missing__" } });
    await prisma.userSocialLink.deleteMany({ where: { id: ids.socialLink || "__missing__" } });
    await prisma.userAchievement.deleteMany({ where: { id: ids.achievement || "__missing__" } });
    await prisma.userInterest.deleteMany({ where: { id: ids.interest || "__missing__" } });
    await prisma.socialVerification.deleteMany({ where: { id: ids.socialVerification || "__missing__" } });
    await prisma.userProfilePhoto.deleteMany({ where: { id: ids.socialPhoto || "__missing__" } });
    await prisma.rateLimitBucket.deleteMany({ where: { key: ids.rateLimit } });
    await prisma.adminLog.deleteMany({ where: { id: ids.log } });
    await prisma.report.deleteMany({ where: { id: ids.report } });
    await prisma.chatRequest.deleteMany({ where: { id: ids.chat } });
    await prisma.contactMessage.deleteMany({ where: { id: ids.contact } });
    await prisma.platformSettings.deleteMany({ where: { id: ids.settings } });
    await prisma.notification.deleteMany({ where: { id: ids.notification } });
    await prisma.attendance.deleteMany({ where: { id: ids.attendance } });
    await prisma.payment.deleteMany({ where: { id: ids.payment } });
    await prisma.orderItem.deleteMany({ where: { id: ids.orderItem } });
    await prisma.order.deleteMany({ where: { id: ids.order } });
    await prisma.providerReview.deleteMany({ where: { id: ids.providerReview } });
    await prisma.review.deleteMany({ where: { id: ids.review } });
    await prisma.wishlist.deleteMany({ where: { id: ids.wishlist } });
    await prisma.cartItem.deleteMany({ where: { id: ids.cart } });
    await prisma.booking.deleteMany({ where: { id: ids.booking } });
    await prisma.providerVerification.deleteMany({ where: { id: ids.verification } });
    await prisma.productImage.deleteMany({ where: { id: ids.image } });
    await prisma.product.deleteMany({ where: { id: ids.product } });
    await prisma.seller.deleteMany({ where: { id: ids.seller } });
    await prisma.coach.deleteMany({ where: { id: ids.coach } });
    await prisma.dojo.deleteMany({ where: { id: ids.dojo } });
    await prisma.refreshToken.deleteMany({ where: { tokenHash: `audit-${stamp}` } });
    await prisma.user.deleteMany({ where: { email: { endsWith: `-${stamp}@example.test` } } });
    await prisma.$disconnect();
  }
});
