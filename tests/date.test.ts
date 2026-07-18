import assert from "node:assert/strict";
import test from "node:test";
import { monthInIndia, todayInIndia } from "../lib/date";

test("todayInIndia follows Asia/Kolkata instead of UTC", () => {
  assert.equal(todayInIndia(new Date("2026-07-18T20:00:00.000Z")), "2026-07-19");
  assert.equal(todayInIndia(new Date("2026-07-18T01:00:00.000Z")), "2026-07-18");
});

test("monthInIndia follows the local calendar month", () => {
  assert.equal(monthInIndia(new Date("2026-07-31T20:00:00.000Z")), "2026-08");
});
