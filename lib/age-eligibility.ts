export const MATCH_MAKING_MINIMUM_AGE = 18;

export const MATCH_MAKING_AGE_MESSAGE =
  "Match Making is available only for users aged 18 years or older.";

export function ageFromBirthDate(
  value?: Date | string | null,
  referenceDate = new Date(),
) {
  if (!value) return null;

  const birthDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(birthDate.getTime())) return null;

  let age = referenceDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const birthdayHasPassed =
    referenceDate.getUTCMonth() > birthDate.getUTCMonth() ||
    (referenceDate.getUTCMonth() === birthDate.getUTCMonth() &&
      referenceDate.getUTCDate() >= birthDate.getUTCDate());

  if (!birthdayHasPassed) age -= 1;
  return age;
}

export function isMatchMakingEligible(
  value?: Date | string | null,
  referenceDate = new Date(),
) {
  const age = ageFromBirthDate(value, referenceDate);
  return age != null && age >= MATCH_MAKING_MINIMUM_AGE;
}
