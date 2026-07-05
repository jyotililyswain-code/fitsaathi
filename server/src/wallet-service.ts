import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

type WalletClient = Pick<typeof prisma, "wallet" | "walletTransaction">;

export async function creditWallet(client: WalletClient, userId: string, amountPaise: number, purpose: string, metadata: Prisma.InputJsonValue = {}, reference?: string) {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) throw Object.assign(new Error("Wallet credit failed."), { status: 400 });
  const wallet = await client.wallet.upsert({
    where: { userId },
    update: { balancePaise: { increment: amountPaise } },
    create: { userId, balancePaise: amountPaise }
  });
  const transaction = await client.walletTransaction.create({
    data: {
      userId,
      type: "recharge",
      purpose,
      amountPaise,
      balanceAfterPaise: wallet.balancePaise,
      status: "success",
      reference,
      creditedAt: new Date(),
      metadata
    }
  });
  return { wallet, transaction };
}

export async function debitWallet(client: WalletClient, userId: string, amountPaise: number, purpose: string, metadata: Prisma.InputJsonValue = {}, reference?: string) {
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) throw Object.assign(new Error("Wallet debit failed."), { status: 400 });
  const wallet = await client.wallet.findUnique({ where: { userId } });
  if (!wallet || !wallet.active || wallet.balancePaise < amountPaise) throw Object.assign(new Error("Insufficient wallet balance."), { status: 409 });
  const updated = await client.wallet.update({ where: { userId }, data: { balancePaise: { decrement: amountPaise } } });
  const transaction = await client.walletTransaction.create({
    data: {
      userId,
      type: purpose === "CHAT_CHARGE" ? "chat_fee" : purpose === "VERIFICATION_PAYMENT" ? "verification_fee" : "adjustment",
      purpose,
      amountPaise: -amountPaise,
      balanceAfterPaise: updated.balancePaise,
      status: "success",
      reference,
      metadata
    }
  });
  return { wallet: updated, transaction };
}
