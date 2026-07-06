"use client";

import { Lock, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { ManualUpiPayment } from "@/components/ManualUpiPayment";
import { useSessionUser } from "@/lib/auth-client";
import { useCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { readJsonResponse } from "@/lib/http";
import { customerProductPrice } from "@/lib/marketplace";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const { user } = useSessionUser();
  const lock = useRef(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const total = cart.items.reduce((sum, item) => sum + (item.product ? customerProductPrice(item.product) * item.quantity : 0), 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    if (!user) return setMessage("Please sign in before checkout.");
    if (!cart.items.length) return setMessage("Your cart is empty.");

    const form = new FormData(event.currentTarget);
    const phone = normalizePhone(String(form.get("phoneNumber")));
    if (!isValidIndianPhone(phone)) return setMessage("Enter a valid Indian mobile number.");
    form.set("phoneNumber", phone);
    form.set("items", JSON.stringify(cart.items.map(item => ({ productId: item.productId, quantity: item.quantity }))));

    lock.current = true;
    setLoading(true);
    setMessage("");
    try {
      const createResponse = await fetch("/api/marketplace/orders", {
        method: "POST",
        body: form
      });
      const created = await readJsonResponse<{ orderId: string }>(createResponse, "Could not create order.");
      await cart.clear();
      router.push(`/payment-success?orderId=${encodeURIComponent(created.orderId)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      lock.current = false;
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Lock className="text-acid" />
        <div>
          <p className="text-sm text-acid">Manual UPI checkout</p>
          <h1 className="text-4xl font-bold text-white">Complete your order</h1>
        </div>
      </div>
      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-white/10 bg-white/[.04] p-6">
          <h2 className="text-xl font-semibold text-white">Delivery details</h2>
          <input name="customerName" required placeholder="Full name" className="field mt-5" />
          <input name="phoneNumber" required placeholder="Phone number" className="field mt-3" />
          <textarea name="shippingAddress" required rows={5} placeholder="Complete delivery address with pincode" className="field mt-3" />
        </section>
        <aside className="h-fit rounded-2xl border border-white/10 bg-white/[.05] p-6">
          <h2 className="text-xl font-semibold text-white">Order summary</h2>
          <div className="mt-4 space-y-3">
            {cart.items.map(item => (
              <div key={item.productId} className="flex justify-between gap-3 text-sm">
                <span className="text-zinc-300">{item.quantity} x {item.product?.title}</span>
                <span>{formatMoney(item.product ? customerProductPrice(item.product) * item.quantity : 0)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between border-t border-white/10 pt-5 text-xl font-bold">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
          <ManualUpiPayment amountLabel={formatMoney(total)} className="mt-5" />
          <button disabled={loading || !cart.items.length} className="mt-6 w-full rounded-xl bg-acid px-5 py-4 font-semibold text-ink disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400">
            <ShoppingBag className="mr-2 inline" />
            {loading ? "Submitting payment..." : "I have paid"}
          </button>
          {message ? <p className="mt-4 text-sm text-red-300">{message}</p> : null}
        </aside>
      </form>
    </main>
  );
}
