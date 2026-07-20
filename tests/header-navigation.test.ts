import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("shared and super-admin brand marks use direct homepage links", () => {
  const sharedHeader = fs.readFileSync("components/Header.tsx", "utf8");
  const superAdmin = fs.readFileSync(
    "app/super-admin-dashboard/page.tsx",
    "utf8",
  );

  for (const source of [sharedHeader, superAdmin]) {
    assert.match(
      source,
      /<Link\s+href="\/"\s+aria-label="Go to FitSaathi homepage"/,
    );
  }

  const sharedLogoStart = sharedHeader.indexOf('href="/"');
  const sharedLogoEnd = sharedHeader.indexOf("</Link>", sharedLogoStart);
  const sharedLogo = sharedHeader.slice(sharedLogoStart, sharedLogoEnd);
  assert.doesNotMatch(sharedLogo, /preventDefault|router\.refresh|window\.location/);
  assert.match(sharedLogo, /pointer-events-auto/);
  assert.match(sharedLogo, /cursor-pointer/);
});

test("authenticated visitors render the public homepage with an account link", () => {
  const homepage = fs.readFileSync("app/page.tsx", "utf8");
  const sharedHeader = fs.readFileSync("components/Header.tsx", "utf8");

  assert.doesNotMatch(
    homepage,
    /router\.replace\(dashboardPathForRole\(user\.role\)\)/,
  );
  assert.match(homepage, /<FitSaathiHome \/>/);
  assert.match(sharedHeader, /const accountLabel = signedIn \? "My Account" : "Log In \/ Sign Up"/);
  assert.match(sharedHeader, /const accountHref = signedIn \? dashboardHref\(role\) : "\/login"/);
  assert.match(sharedHeader, /href=\{accountHref\}/);
});
