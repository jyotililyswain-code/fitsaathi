require("dotenv/config");

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
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

function imageForm(fields, imageFields = []) {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) form.append(name, String(value));
  const bytes = fs.readFileSync(path.join(process.cwd(), "public", "scroll-art", "dumbbell.jpg"));
  for (const field of imageFields) form.append(field, new Blob([bytes], { type: "image/jpeg" }), `${field}.jpg`);
  return form;
}

function diskPath(storedPath) {
  return path.join(process.cwd(), "server", "uploads", String(storedPath).replace(/^\/uploads\//, ""));
}

test("local Express API authentication, uploads, marketplace CRUD, orders, and admin operations", async () => {
  const stamp = Date.now();
  const userIds = [];
  const productIds = [];
  const uploadedPaths = [];

  async function register(label, extra = {}) {
    const email = `audit-${label}-${stamp}@example.test`;
    const result = await api("/auth/register", json("POST", { name: `Audit ${label}`, email, password: "AuditPass123!", ...extra }), [201]);
    assert.ok(result.accessToken, "registration should create an authenticated access token");
    assert.ok(result.refreshToken, "registration should create a refresh token");
    assert.equal((await api("/auth/me", { headers: { authorization: `Bearer ${result.accessToken}` } })).email, email);
    userIds.push(result.user.id);
    return { email, user: result.user };
  }

  async function login(email) {
    return api("/auth/login", json("POST", { email, password: "AuditPass123!" }));
  }

  try {
    const health = await api("/health");
    assert.equal(health.database, "connected");

    const sellerAccount = await register("seller");
    const duplicate = await api("/auth/register", json("POST", { name: "Duplicate", email: sellerAccount.email.toUpperCase(), password: "AuditPass123!" }), [409]);
    assert.deepEqual({ code: duplicate.code, field: duplicate.field }, { code: "DUPLICATE_EMAIL", field: "email" });
    assert.match(duplicate.error, /email address already exists/i);
    const sharedPhone = "9666666666";
    await register("shared-phone-a", { phone: sharedPhone, acceptedPolicies: true, acceptedPolicyVersion: "test" });
    await register("shared-phone-b", { phone: sharedPhone, acceptedPolicies: true, acceptedPolicyVersion: "test" });
    let sellerSession = await login(sellerAccount.email);
    assert.equal((await api("/auth/me", { headers: { authorization: `Bearer ${sellerSession.accessToken}` } })).email, sellerAccount.email);

    const sellerForm = imageForm({
      storeName: `Audit Store ${stamp}`,
      phone: "9876543210",
      address: "123 Audit Street, Test City",
      bio: "Temporary automated API test seller."
    }, ["aadhaar", "profile"]);
    const seller = await api("/sellers", { method: "POST", headers: { authorization: `Bearer ${sellerSession.accessToken}` }, body: sellerForm }, [201]);
    uploadedPaths.push(seller.aadhaarPath, seller.profilePath);
    sellerSession = await login(sellerAccount.email);

    const adminAccount = await register("admin");
    await prisma.user.update({ where: { id: adminAccount.user.id }, data: { role: "admin" } });
    const adminSession = await login(adminAccount.email);
    assert.equal((await api(`/sellers/${seller.id}/verify`, json("PATCH", { status: "trusted" }, adminSession.accessToken))).trusted, true);
    const publicSeller = await api(`/sellers/${seller.id}`);
    assert.equal("phone" in publicSeller, false, "public seller records must not expose phone numbers");
    assert.equal("aadhaarPath" in publicSeller, false, "public seller records must not expose verification files");
    assert.equal("email" in publicSeller.owner, false, "public seller owners must not expose email addresses");

    async function createProduct(title) {
      const form = imageForm({ title, description: "Temporary product created by the local API integration audit.", category: "Equipment", brand: "Audit", sellerPrice: 500, stock: 5 }, ["images"]);
      const product = await api("/products", { method: "POST", headers: { authorization: `Bearer ${sellerSession.accessToken}` }, body: form }, [201]);
      productIds.push(product.id);
      for (const image of product.images || []) uploadedPaths.push(image.path, image.thumbnail);
      return product;
    }

    const product = await createProduct("Audit Dumbbell");
    const publicProduct = await api(`/products/${product.id}`);
    assert.equal(publicProduct.id, product.id);
    assert.equal("sellerPrice" in publicProduct, false, "public products must not expose seller pricing");
    assert.equal("sellerPayout" in publicProduct, false, "public products must not expose seller payouts");
    assert.equal("aadhaarPath" in publicProduct.seller, false, "public products must not expose seller verification files");
    assert.equal((await api(`/products/${product.id}`, json("PUT", { title: "Audit Dumbbell Updated", stock: 4 }, sellerSession.accessToken))).stock, 4);
    assert.equal((await api(`/admin/products/${product.id}/status`, json("PATCH", { status: "approved" }, adminSession.accessToken))).status, "approved");
    assert.ok((await api("/products?search=Audit%20Dumbbell&limit=5")).items.some((item) => item.id === product.id));

    const buyerAccount = await register("buyer");
    const buyerSession = await login(buyerAccount.email);
    await api("/admin/analytics", { headers: { authorization: `Bearer ${buyerSession.accessToken}` } }, [403]);
    await api("/cart", json("POST", { productId: product.id, quantity: 1 }, buyerSession.accessToken), [201]);
    assert.equal((await api("/cart", { headers: { authorization: `Bearer ${buyerSession.accessToken}` } }))[0].productId, product.id);
    assert.equal((await api(`/cart/${product.id}`, json("PATCH", { quantity: 2 }, buyerSession.accessToken))).quantity, 2);
    await api(`/cart/${product.id}`, { method: "DELETE", headers: { authorization: `Bearer ${buyerSession.accessToken}` } }, [204]);
    await api("/cart", json("POST", { productId: product.id, quantity: 1 }, buyerSession.accessToken), [201]);
    await api("/cart", { method: "DELETE", headers: { authorization: `Bearer ${buyerSession.accessToken}` } }, [204]);
    const order = await api("/orders", json("POST", { shippingAddress: "456 Buyer Road, Test City 123456", items: [{ productId: product.id, quantity: 2 }] }, buyerSession.accessToken), [201]);
    assert.ok((await api("/orders", { headers: { authorization: `Bearer ${buyerSession.accessToken}` } })).some((item) => item.id === order.id));
    assert.ok((await api("/seller/dashboard", { headers: { authorization: `Bearer ${sellerSession.accessToken}` } })).orders.some((item) => item.id === order.id));
    assert.equal((await api(`/seller/orders/${order.id}/status`, json("PATCH", { status: "processing" }, sellerSession.accessToken))).status, "processing");
    await api("/admin/analytics", { headers: { authorization: `Bearer ${adminSession.accessToken}` } });
    await api("/admin/users", { headers: { authorization: `Bearer ${adminSession.accessToken}` } });
    await api("/admin/settings", json("PUT", { commissionPercent: 10, highValueOrderThreshold: 25000, maintenanceMode: false, manualSellerVerification: true }, adminSession.accessToken));
    assert.ok((await api("/admin/snapshot", { headers: { authorization: `Bearer ${adminSession.accessToken}` } })).products.some((item) => item.id === product.id));

    const refreshed = await api("/auth/refresh", json("POST", { refreshToken: buyerSession.refreshToken }));
    assert.equal((await api("/auth/me", { headers: { authorization: `Bearer ${refreshed.accessToken}` } })).email, buyerAccount.email);
    await api("/auth/logout", json("POST", { refreshToken: buyerSession.refreshToken }), [204]);
    await api("/auth/refresh", json("POST", { refreshToken: buyerSession.refreshToken }), [401]);

    const sellerDeleted = await createProduct("Audit Seller Delete");
    const sellerDeletedPaths = sellerDeleted.images.flatMap((image) => [image.path, image.thumbnail]).filter(Boolean);
    await api(`/products/${sellerDeleted.id}`, { method: "DELETE", headers: { authorization: `Bearer ${sellerSession.accessToken}` } }, [204]);
    for (const storedPath of sellerDeletedPaths) assert.equal(fs.existsSync(diskPath(storedPath)), false, `${storedPath} should be removed with its product`);

    const adminDeleted = await createProduct("Audit Admin Delete");
    const adminDeletedPaths = adminDeleted.images.flatMap((image) => [image.path, image.thumbnail]).filter(Boolean);
    await api(`/admin/product/${adminDeleted.id}`, { method: "DELETE", headers: { authorization: `Bearer ${adminSession.accessToken}` } }, [204]);
    for (const storedPath of adminDeletedPaths) assert.equal(fs.existsSync(diskPath(storedPath)), false, `${storedPath} should be removed by admin deletion`);
  } finally {
    const orders = await prisma.order.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
    const orderIds = orders.map((order) => order.id);
    await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    await prisma.adminLog.deleteMany({ where: { actorId: { in: userIds } } });
    await prisma.productImage.deleteMany({ where: { productId: { in: productIds } } });
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });
    await prisma.seller.deleteMany({ where: { ownerId: { in: userIds } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    for (const storedPath of new Set(uploadedPaths.filter(Boolean))) fs.rmSync(diskPath(storedPath), { force: true });
    await prisma.$disconnect();
  }
});
