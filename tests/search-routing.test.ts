import assert from "node:assert/strict";
import test from "node:test";
import { generalSearchTargetFor } from "../lib/search-routing";

test("general provider search routes dojo and martial arts terms correctly", () => {
  assert.equal(generalSearchTargetFor("taekwondo"), "/dojos?search=taekwondo");
  assert.equal(generalSearchTargetFor("karate academy"), "/dojos?search=karate%20academy");
  assert.equal(generalSearchTargetFor("local gym"), "/dojos?search=local%20gym");
  assert.equal(generalSearchTargetFor("taekwondo coach"), "/find-coach?search=taekwondo%20coach");
});
