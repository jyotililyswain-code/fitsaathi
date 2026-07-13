import assert from "node:assert/strict";
import test from "node:test";
import {
  ageFromBirthDate,
  isMatchMakingEligible,
  MATCH_MAKING_AGE_MESSAGE,
} from "../lib/age-eligibility";

const today = new Date("2026-07-13T12:00:00.000Z");

test("normal account ages are calculated without making registration eligibility decisions", () => {
  assert.equal(ageFromBirthDate("2012-07-13", today), 14);
  assert.equal(ageFromBirthDate("2008-07-14", today), 17);
  assert.equal(ageFromBirthDate("2008-07-13", today), 18);
});

test("Match Making eligibility starts on the user's eighteenth birthday", () => {
  assert.equal(isMatchMakingEligible("2008-07-14", today), false);
  assert.equal(isMatchMakingEligible("2008-07-13", today), true);
  assert.equal(isMatchMakingEligible("2000-01-01", today), true);
  assert.equal(isMatchMakingEligible(null, today), false);
});

test("the age restriction uses the required user-facing message", () => {
  assert.equal(
    MATCH_MAKING_AGE_MESSAGE,
    "Match Making is available only for users aged 18 years or older.",
  );
});
