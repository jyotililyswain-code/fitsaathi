import assert from "node:assert/strict";
import test from "node:test";
import { isServerlessRuntime } from "../server/src/runtime";

test("serverless runtime detection covers Vercel and its read-only task directory", () => {
  assert.equal(isServerlessRuntime({ VERCEL: "1" }, "/workspace"), true);
  assert.equal(isServerlessRuntime({ VERCEL_ENV: "production" }, "/workspace"), true);
  assert.equal(isServerlessRuntime({}, "/var/task"), true);
  assert.equal(isServerlessRuntime({}, "/var/task/server"), true);
  assert.equal(isServerlessRuntime({}, "D:\\pupu\\fitness"), false);
});
