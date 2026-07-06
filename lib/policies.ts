export type PolicySection = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
  variant?: "default" | "success" | "warning" | "danger" | "verified" | "royal" | "legendary";
};

export type Policy = {
  slug: string;
  title: string;
  summary: string;
  lastUpdated: string;
  sections: PolicySection[];
};

export const POLICY_VERSION = "2026-06-29";

export const policies: Policy[] = [
  {
    slug: "terms",
    title: "Terms & Conditions",
    summary: "The core rules for using FitSaathi as a customer, coach, dojo owner, or visitor.",
    lastUpdated: "June 29, 2026",
    sections: [
      {
        id: "platform-overview",
        title: "Platform Overview",
        body: ["FitSaathi acts as a platform connecting customers with fitness professionals, martial arts coaches, trainers, and dojos. Coaches and dojos are independent service providers, not employees of FitSaathi."]
      },
      {
        id: "user-responsibilities",
        title: "User Responsibilities",
        body: ["Users must provide accurate account details, communicate respectfully, attend booked sessions on time, and use the platform only for lawful fitness and wellness purposes."]
      },
      {
        id: "coach-responsibilities",
        title: "Coach Responsibilities",
        body: ["Coaches must represent their skills honestly, maintain professional conduct, avoid fake certifications or reviews, and deliver sessions according to the agreed schedule and package rules."]
      },
      {
        id: "booking-rules",
        title: "Booking Rules",
        body: ["Bookings, package terms, cancellations, replacement requests, attendance records, and payment obligations must follow the policies published by FitSaathi and the rules shown at checkout. Customers see the final payable price; FitSaathi may retain an internal platform commission from that amount."]
      },
      {
        id: "platform-payments",
        title: "Platform Payments",
        body: ["All booking and registration payments must be handled through FitSaathi payment flows. Coaches, customers, and dojos must not bypass platform payment, verification, refund, or payout systems."]
      },
      {
        id: "prohibited-activities",
        title: "Prohibited Activities",
        body: ["Harassment, fraud, unsafe training, spam, abusive messages, payment manipulation, fake complaints, fake reviews, and attempts to bypass FitSaathi payments are not allowed."]
      },
      {
        id: "account-suspension",
        title: "Account Suspension",
        body: ["FitSaathi may restrict, suspend, or remove accounts that violate platform rules, create safety risks, manipulate reliability systems, or harm the trust of the marketplace."]
      },
      {
        id: "intellectual-property",
        title: "Intellectual Property",
        body: ["FitSaathi branding, interface design, content, data presentation, and platform materials belong to FitSaathi or its licensors. Users may not copy or misuse them without written permission."]
      },
      {
        id: "liability-limitations",
        title: "Liability Limitations",
        body: ["Fitness activity carries risk. FitSaathi is not responsible for injuries, losses, service disputes, or outcomes arising from independent coach or dojo sessions except where required by applicable law."],
        variant: "warning"
      },
      {
        id: "dispute-handling",
        title: "Dispute Handling",
        body: ["Users should report disputes through official support channels. FitSaathi may review attendance logs, payment status, package rules, messages, and provider records before taking action."]
      },
      {
        id: "modification-rights",
        title: "Modification Rights",
        body: ["FitSaathi may update these terms and require users to accept a new policy version before continuing to use protected services."]
      }
    ]
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "How FitSaathi collects, uses, protects, and processes personal data.",
    lastUpdated: "June 29, 2026",
    sections: [
      {
        id: "data-collection",
        title: "Data Collection",
        body: ["FitSaathi collects information needed to create accounts, operate bookings, process payments, improve safety, prevent abuse, and provide customer support."]
      },
      {
        id: "account-information",
        title: "Account Information",
        body: ["Account data may include name, email, phone number, location, role, fitness interest, coach or dojo details, attendance history, badge status, and support records."]
      },
      {
        id: "payment-information",
        title: "Payment Information",
        body: ["Payments are currently submitted through manual UPI. FitSaathi does not ask users to share UPI PINs, card passwords, or other sensitive payment credentials with coaches or support staff. Transaction references, verification status, refund status, internal commission, and payout tracking may be stored for accounting, safety, and dispute handling."]
      },
      {
        id: "contact-visibility",
        title: "Contact Visibility",
        body: ["Customer and provider phone numbers are hidden before a booking is accepted. After acceptance, relevant contact details may be visible to both sides so the booked session can be coordinated."]
      },
      {
        id: "cookies-analytics",
        title: "Cookies & Analytics",
        body: ["FitSaathi may use cookies, device data, and analytics tools to keep users signed in, understand product usage, detect abuse, and improve marketplace performance."]
      },
      {
        id: "data-protection",
        title: "Data Protection",
        body: ["We use reasonable technical and organizational safeguards to protect account and booking data. No internet system is completely risk-free, so users should keep passwords private."]
      },
      {
        id: "third-party-services",
        title: "Third-Party Services",
        body: ["FitSaathi uses PostgreSQL for application and account data and configured storage services for uploaded files. Manual UPI payments are reviewed by authorized administrators before activation."]
      },
      {
        id: "user-rights",
        title: "User Rights",
        body: ["Users may request correction, export, or deletion of eligible personal data by contacting support. Some records may be retained where needed for legal, payment, safety, or dispute reasons."]
      },
      {
        id: "deletion-requests",
        title: "Data Deletion Requests",
        body: ["Deletion requests are reviewed to confirm identity and determine whether any booking, payment, or safety records must be retained for a lawful period."]
      }
    ]
  },
  {
    slug: "refunds",
    title: "Refund Policy",
    summary: "FitSaathi refund eligibility for home classes, dojo packages, traditional arts, and payment disputes.",
    lastUpdated: "June 29, 2026",
    sections: [
      {
        id: "home-classes",
        title: "Home Classes",
        body: ["Home class purchases are not refundable. A one-time trainer replacement may be available if requested within the first week and approved after review."],
        variant: "danger"
      },
      {
        id: "dojo-training",
        title: "Dojo & Training Classes",
        body: ["Dojo and training class packages may qualify for a partial refund only for the first package or first month. Platform service fees are retained, and eligibility depends on the package rules shown at purchase."],
        variant: "warning"
      },
      {
        id: "traditional-arts",
        title: "Traditional Arts",
        body: ["Traditional arts programs may have a special refund period because evaluation, uniform, initiation, or batch rules can differ by discipline and provider."]
      },
      {
        id: "request-process",
        title: "Refund Request Process",
        body: ["Refund requests must be submitted through official support with booking ID, payment proof, reason, and any relevant communication. FitSaathi may ask for more details before deciding."]
      },
      {
        id: "review-timeline",
        title: "Review Timeline",
        body: ["Eligible refund requests are reviewed within a reasonable support timeline. Approved refunds follow payment processor timelines and may vary by bank, card, UPI, or wallet provider."]
      },
      {
        id: "abuse-prevention",
        title: "Abuse Prevention",
        body: ["Repeated refund abuse, false claims, fake complaints, chargeback misuse, or attempts to receive services without payment may lead to account restrictions."]
      }
    ]
  },
  {
    slug: "coach-conduct",
    title: "Coach Conduct Policy",
    summary: "Professional behavior, attendance, verification, and safety standards for FitSaathi coaches.",
    lastUpdated: "June 29, 2026",
    sections: [
      {
        id: "professionalism",
        title: "Professionalism",
        body: ["Coaches must behave professionally, arrive prepared, communicate clearly, respect customer boundaries, and deliver training appropriate to the customer's stated level and goals."]
      },
      {
        id: "attendance",
        title: "Attendance Expectations",
        body: ["Coaches must be punctual and reliable. Repeated poor attendance may reduce reliability score, lower visibility, affect badge eligibility, or trigger review."]
      },
      {
        id: "respect-safety",
        title: "Respect & Safety",
        body: ["Harassment, intimidation, discriminatory conduct, abusive language, unsafe pressure, or inappropriate physical contact is prohibited."]
      },
      {
        id: "honest-profile",
        title: "Honest Profile Information",
        body: ["Fake certifications, fake experience, fake reviews, manipulated activity, and misleading claims are not allowed and may result in removal."]
      }
    ]
  },
  {
    slug: "customer-conduct",
    title: "Customer Conduct Policy",
    summary: "The conduct standards customers must follow while using FitSaathi.",
    lastUpdated: "June 29, 2026",
    sections: [
      {
        id: "respectful-communication",
        title: "Respectful Communication",
        body: ["Customers must communicate respectfully with coaches, dojo staff, support, and other users. Harassment, threats, or abusive behavior are not allowed."]
      },
      {
        id: "payment-honesty",
        title: "Payment Honesty",
        body: ["Customers must not bypass FitSaathi payments, submit false payment claims, misuse chargebacks, or pressure coaches into off-platform arrangements."]
      },
      {
        id: "complaints",
        title: "Complaints & Reports",
        body: ["Reports should be truthful and supported by relevant details. Fake complaints can harm professionals and may result in account penalties."]
      },
      {
        id: "safety-expectations",
        title: "Safety Expectations",
        body: ["Customers should disclose relevant health limitations, stop unsafe activity, follow reasonable instructions, and avoid training under risky conditions."]
      }
    ]
  },
  {
    slug: "cancellations",
    title: "Cancellation Policy",
    summary: "How cancellations, missed sessions, replacements, and package interruptions are handled.",
    lastUpdated: "June 29, 2026",
    sections: [
      {
        id: "notice",
        title: "Cancellation Notice",
        body: ["Customers and coaches should provide cancellation notice as early as possible. Repeated late cancellations may affect reliability records or package benefits."]
      },
      {
        id: "missed-sessions",
        title: "Missed Sessions",
        body: ["No-shows or missed sessions may be counted as completed unless the package rules or a support review allows rescheduling."]
      },
      {
        id: "trainer-replacement",
        title: "Trainer Replacement",
        body: ["For eligible home classes, a one-time trainer replacement may be requested within the first week. Approval depends on availability and support review."]
      },
      {
        id: "provider-cancellations",
        title: "Provider Cancellations",
        body: ["Coach or dojo cancellations may be tracked for reliability scoring and can affect platform visibility, badge status, and future approvals."]
      }
    ]
  },
  {
    slug: "payments",
    title: "Payment Policy",
    summary: "Payment processing, subscriptions, invoices, failed payments, refunds, and disputes.",
    lastUpdated: "June 29, 2026",
    sections: [
      {
        id: "manual-upi",
        title: "Manual UPI Payments",
        body: ["FitSaathi currently accepts manual UPI payments to the UPI ID shown on the payment screen. Users must enter the matching transaction/reference ID. A booking, order, registration, wallet recharge, verification fee, or membership is activated only after administrator verification."]
      },
      {
        id: "subscriptions",
        title: "Subscriptions & Recurring Billing",
        body: ["If a package supports recurring billing, renewal amount, cycle, and cancellation rules will be shown before payment. Users are responsible for reviewing the terms before confirming."]
      },
      {
        id: "invoices",
        title: "Invoices",
        body: ["Receipts or invoices may be generated based on payment processor data and FitSaathi records. Users should contact support if details need correction."]
      },
      {
        id: "failed-payments",
        title: "Failed Payment Handling",
        body: ["Failed or pending payments may delay booking confirmation. A booking is not guaranteed until FitSaathi records the payment as successful."]
      },
      {
        id: "refunds-disputes",
        title: "Refunds & Payment Disputes",
        body: ["Refund timelines depend on approval and the user's bank or UPI provider. Disputes are reviewed against the submitted transaction reference, booking, package, order, and attendance records."]
      }
    ]
  },
  {
    slug: "fitness-safety",
    title: "Fitness Safety Disclaimer",
    summary: "Important health, injury, and responsibility terms for participating in fitness sessions.",
    lastUpdated: "June 29, 2026",
    sections: [
      {
        id: "physical-risk",
        title: "Exercise Carries Physical Risk",
        body: ["Training, workouts, sports, yoga, martial arts, strength sessions, and mobility activity can cause injury, fatigue, pain, or health complications."],
        variant: "warning"
      },
      {
        id: "medical-advice",
        title: "Consult a Physician",
        body: ["Users should consult a qualified physician before starting any training program, especially if they have medical conditions, injuries, pregnancy, chronic pain, or medication concerns."]
      },
      {
        id: "own-responsibility",
        title: "Own Responsibility",
        body: ["Users participate at their own responsibility and should stop immediately if they feel pain, dizziness, unusual discomfort, or unsafe pressure."]
      },
      {
        id: "independent-professionals",
        title: "Independent Professionals",
        body: ["Coaches and dojos are independent professionals. FitSaathi is not liable for injuries, outcomes, or conduct beyond the responsibilities required by law."],
        variant: "danger"
      }
    ]
  },
  {
    slug: "attendance-reliability",
    title: "Attendance & Reliability Policy",
    summary: "How attendance tracking and the Green, Yellow, and Red reliability system work.",
    lastUpdated: "June 29, 2026",
    sections: [
      {
        id: "green",
        title: "Green Reliability",
        body: ["Green indicates very low absence and strong consistency. It may improve trust signals and visibility."],
        variant: "success"
      },
      {
        id: "yellow",
        title: "Yellow Reliability",
        body: ["Yellow indicates moderate leaves, cancellations, or schedule issues. It may reduce confidence until consistency improves."],
        variant: "warning"
      },
      {
        id: "red",
        title: "Red Reliability",
        body: ["Red indicates high absence, repeated missed sessions, or frequent cancellations. It may reduce platform visibility and trigger review."],
        variant: "danger"
      },
      {
        id: "calculation",
        title: "Score Calculation",
        body: ["Reliability may consider attendance records, customer reports, cancelled sessions, no-shows, accepted replacements, support reviews, and verified platform activity."]
      },
      {
        id: "qr-verification",
        title: "QR Attendance Verification",
        body: ["Active sessions may use a temporary QR code that expires quickly, can be scanned once, and is checked against booking, date, time, coach, and customer details before attendance is marked."]
      },
      {
        id: "penalties",
        title: "Penalties & Visibility",
        body: ["Poor attendance can affect search position, featured placement, coach badge eligibility, booking access, and account review decisions."]
      }
    ]
  },
  {
    slug: "coach-badges",
    title: "Coach Badge Policy",
    summary: "Verification, Elite, and Legendary badge eligibility, benefits, and removal rules.",
    lastUpdated: "June 29, 2026",
    sections: [
      {
        id: "verified",
        title: "Verified Coach",
        body: ["A light blue Verified Coach badge may be assigned after FitSaathi reviews identity, profile quality, skill evidence, and platform requirements."],
        variant: "verified"
      },
      {
        id: "elite",
        title: "Elite Coach",
        body: ["An Elite Coach badge uses a purple status signal and may require 2+ years of strong activity, consistent reliability, strong customer outcomes, and premium visibility eligibility. Eligible coaches may receive a yearly Rs. 10,000 wellness or diet support reward."],
        variant: "royal"
      },
      {
        id: "legendary",
        title: "Legendary Coach",
        body: ["Legendary Coach is a rare crown status with premium recommendation priority. Eligible coaches may receive a yearly Rs. 17,000 wellness or diet support reward."],
        variant: "legendary"
      },
      {
        id: "removal",
        title: "Badge Removal",
        body: ["Badges can be removed for fake activity, manipulated reviews, poor attendance, unsafe conduct, policy violations, or failure to maintain eligibility."]
      },
      {
        id: "fake-activity",
        title: "Fake Activity Penalties",
        body: ["Artificial bookings, fake ratings, duplicate accounts, review trading, or attempts to manipulate status may lead to badge removal and account restrictions."]
      }
    ]
  },
  {
    slug: "community-guidelines",
    title: "Community Guidelines",
    summary: "Rules for a respectful, safe, and healthy FitSaathi community.",
    lastUpdated: "June 29, 2026",
    sections: [
      {
        id: "respect",
        title: "Respectful Environment",
        body: ["FitSaathi expects respectful communication between customers, coaches, dojo owners, staff, and support. Hate speech, harassment, threats, or targeted abuse are prohibited."]
      },
      {
        id: "healthy-behavior",
        title: "Healthy Community Behavior",
        body: ["Encourage safe progress, honest feedback, and constructive communication. Do not shame people for their fitness level, body, disability, background, or training pace."]
      },
      {
        id: "dangerous-activity",
        title: "Dangerous Activity",
        body: ["Do not promote dangerous challenges, unsafe martial arts behavior, extreme training without supervision, doping, or medical misinformation."]
      },
      {
        id: "scams-spam",
        title: "No Scams or Spam",
        body: ["Scams, spam, fake offers, repeated promotional messages, and attempts to move users into unsafe off-platform arrangements are not allowed."]
      },
      {
        id: "safe-martial-arts",
        title: "Safe Martial Arts Environment",
        body: ["Martial arts training should respect skill level, consent, protective rules, instructor supervision, and injury prevention standards."]
      }
    ]
  },
  {
    slug: "medical-consent",
    title: "Medical Consent & Emergency Policy",
    summary: "Additional health disclosure and emergency expectations for safer training decisions.",
    lastUpdated: "June 29, 2026",
    sections: [
      {
        id: "health-disclosure",
        title: "Health Disclosure",
        body: ["Users should disclose relevant health limitations to their coach or dojo before training. This may include injuries, allergies, asthma, heart conditions, pregnancy, surgeries, or doctor restrictions."]
      },
      {
        id: "emergency-action",
        title: "Emergency Action",
        body: ["If a participant appears injured or unwell, the session should stop and emergency medical help should be contacted where appropriate."]
      },
      {
        id: "not-medical-care",
        title: "Not Medical Care",
        body: ["FitSaathi, coaches, and dojos do not replace medical diagnosis or treatment. Users should rely on qualified medical professionals for health decisions."]
      }
    ]
  }
];

export const requiredAgreementPolicies = policies.filter((policy) =>
  ["terms", "privacy", "refunds", "community-guidelines", "fitness-safety", "medical-consent"].includes(policy.slug)
);

export function getPolicy(slug: string) {
  return policies.find((policy) => policy.slug === slug);
}
