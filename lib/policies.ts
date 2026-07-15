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

export const POLICY_VERSION = "2026-07-12";

export const policies: Policy[] = [
  {
    slug: "terms",
    title: "Terms & Conditions",
    summary: "The core rules for using TheFitSaathi, including free registrations, identity verification, and coach or dojo bookings.",
    lastUpdated: "July 12, 2026",
    sections: [
      {
        id: "platform-overview",
        title: "Platform Overview",
        body: ["TheFitSaathi acts as a platform connecting customers with fitness professionals, martial arts coaches, trainers, and dojos. Coaches and dojos are independent service providers, not employees of TheFitSaathi."]
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
        body: ["Creating and confirming a coach or dojo booking request on TheFitSaathi is free. TheFitSaathi does not add a booking fee, platform commission, checkout charge, or hidden charge to these bookings. Scheduling, cancellations, replacements, and attendance records must still follow the applicable platform rules."]
      },
      {
        id: "free-platform-services",
        title: "Free Platform Services",
        body: ["Account registration, coach registration, dojo or gym registration, seller registration, identity verification, and coach or dojo booking are free. These services do not require a payment, wallet recharge, transaction reference, or payment screenshot. Marketplace product purchases are separate, and their product and delivery total must be shown before an order is placed."]
      },
      {
        id: "prohibited-activities",
        title: "Prohibited Activities",
        body: ["Harassment, fraud, unsafe training, spam, abusive messages, marketplace order manipulation, fake complaints, fake reviews, and attempts to misuse TheFitSaathi systems are not allowed."]
      },
      {
        id: "account-suspension",
        title: "Account Suspension",
        body: ["TheFitSaathi may restrict, suspend, or remove accounts that violate platform rules, create safety risks, manipulate reliability systems, or harm the trust of the marketplace."]
      },
      {
        id: "intellectual-property",
        title: "Intellectual Property",
        body: ["TheFitSaathi branding, interface design, content, data presentation, and platform materials belong to TheFitSaathi or its licensors. Users may not copy or misuse them without written permission."]
      },
      {
        id: "liability-limitations",
        title: "Liability Limitations",
        body: ["Fitness activity carries risk. TheFitSaathi is not responsible for injuries, losses, service disputes, or outcomes arising from independent coach or dojo sessions except where required by applicable law."],
        variant: "warning"
      },
      {
        id: "dispute-handling",
        title: "Dispute Handling",
        body: ["Users should report disputes through official support channels. TheFitSaathi may review attendance logs, booking details, marketplace order records, messages, and provider records before taking action."]
      },
      {
        id: "modification-rights",
        title: "Modification Rights",
        body: ["TheFitSaathi may update these terms and require users to accept a new policy version before continuing to use protected services."]
      }
    ]
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "How TheFitSaathi collects, uses, protects, and processes personal data.",
    lastUpdated: "July 12, 2026",
    sections: [
      {
        id: "data-collection",
        title: "Data Collection",
        body: ["TheFitSaathi collects information needed to create accounts, review identities, operate bookings, process marketplace orders, improve safety, prevent abuse, and provide customer support."]
      },
      {
        id: "account-information",
        title: "Account Information",
        body: ["Account data may include name, email, phone number, location, role, fitness interest, coach or dojo details, attendance history, badge status, and support records."]
      },
      {
        id: "marketplace-purchase-information",
        title: "Marketplace Purchase Information",
        body: ["TheFitSaathi does not collect payment details or payment evidence for account or provider registration, identity verification, or coach and dojo booking because those services are free. For shop purchases, TheFitSaathi may store the clearly shown product total, delivery total, order status, receipt details, and any refund status needed to fulfil the order and handle disputes."]
      },
      {
        id: "contact-visibility",
        title: "Contact Visibility",
        body: ["Customer and provider phone numbers are hidden before a booking is accepted. After acceptance, relevant contact details may be visible to both sides so the booked session can be coordinated."]
      },
      {
        id: "cookies-analytics",
        title: "Cookies & Analytics",
        body: ["TheFitSaathi may use cookies, device data, and analytics tools to keep users signed in, understand product usage, detect abuse, and improve marketplace performance."]
      },
      {
        id: "data-protection",
        title: "Data Protection",
        body: ["We use reasonable technical and organizational safeguards to protect account and booking data. No internet system is completely risk-free, so users should keep passwords private."]
      },
      {
        id: "third-party-services",
        title: "Third-Party Services",
        body: ["TheFitSaathi uses PostgreSQL for application and account data and configured storage services for uploaded files. Account registration, provider registration, identity verification, and coach or dojo booking are never activated or delayed based on payment."]
      },
      {
        id: "user-rights",
        title: "User Rights",
        body: ["Users may request correction, export, or deletion of eligible personal data by contacting support. Some records may be retained where needed for legal, marketplace order, safety, or dispute reasons."]
      },
      {
        id: "deletion-requests",
        title: "Data Deletion Requests",
        body: ["Deletion requests are reviewed to confirm identity and determine whether any booking, marketplace order, or safety records must be retained for a lawful period."]
      }
    ]
  },
  {
    slug: "refunds",
    title: "Refund Policy",
    summary: "Free TheFitSaathi services need no refund; this policy covers marketplace product purchase refunds and disputes.",
    lastUpdated: "July 12, 2026",
    sections: [
      {
        id: "free-platform-services",
        title: "Free Platform Services",
        body: ["TheFitSaathi does not collect payment for account or provider registration, identity verification, or coach and dojo booking. There is no platform fee to refund and no non-refundable charge for these services."],
        variant: "success"
      },
      {
        id: "marketplace-products",
        title: "Marketplace Product Purchases",
        body: ["Refund or return eligibility for a shop product depends on the seller's clearly disclosed return policy, the product condition, and applicable consumer law. The product and delivery total is shown before the order is placed."],
        variant: "warning"
      },
      {
        id: "delivery-charges",
        title: "Delivery Charges",
        body: ["Any delivery charge is included in the total shown before a shop order is placed. Whether a delivery charge can be refunded depends on fulfilment status, the disclosed return terms, and applicable law; it is never hidden as a registration, verification, or booking fee."]
      },
      {
        id: "request-process",
        title: "Refund Request Process",
        body: ["Marketplace refund requests must be submitted through official support with the order ID, reason, and any relevant product photos or seller communication. TheFitSaathi may ask for more details before deciding."]
      },
      {
        id: "review-timeline",
        title: "Review Timeline",
        body: ["Eligible marketplace refund requests are reviewed within a reasonable support timeline. After approval, completion time may depend on the original shop payment method and the customer's bank or payment provider."]
      },
      {
        id: "abuse-prevention",
        title: "Abuse Prevention",
        body: ["Repeated marketplace refund abuse, false product claims, fake complaints, chargeback misuse, or attempts to keep products without valid payment may lead to account restrictions."]
      }
    ]
  },
  {
    slug: "coach-conduct",
    title: "Coach Conduct Policy",
    summary: "Professional behavior, attendance, verification, and safety standards for TheFitSaathi coaches.",
    lastUpdated: "July 12, 2026",
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
    summary: "The conduct standards customers must follow while using TheFitSaathi.",
    lastUpdated: "June 29, 2026",
    sections: [
      {
        id: "respectful-communication",
        title: "Respectful Communication",
        body: ["Customers must communicate respectfully with coaches, dojo staff, support, and other users. Harassment, threats, or abusive behavior are not allowed."]
      },
      {
        id: "marketplace-purchase-honesty",
        title: "Marketplace Purchase Honesty",
        body: ["Registration, identity verification, and coach or dojo booking are free, so customers should never be asked for payment to unlock them. For shop purchases, customers must provide truthful order information and must not submit false payment or refund claims or misuse chargebacks."]
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
    title: "Free Services & Marketplace Purchase Policy",
    summary: "No-charge registration, verification, and booking rules, plus transparent totals for marketplace product purchases.",
    lastUpdated: "July 12, 2026",
    sections: [
      {
        id: "free-services",
        title: "Registration, Verification & Booking Are Free",
        body: ["TheFitSaathi charges nothing for account registration, coach registration, dojo or gym registration, seller registration, identity verification, or coach and dojo booking. No payment, paid membership, wallet recharge, transaction ID, or payment screenshot is required for these services."]
      },
      {
        id: "no-hidden-charges",
        title: "No Platform or Hidden Charges",
        body: ["TheFitSaathi does not add a platform fee, booking fee, registration fee, verification fee, commission, or hidden charge to its free service flows. A user must not be sent to checkout or asked for payment evidence to complete them."]
      },
      {
        id: "marketplace-product-totals",
        title: "Marketplace Product Totals",
        body: ["Shop product purchases are separate from TheFitSaathi's free services. Before an order is placed, the customer must see the product total, delivery total, and any other mandatory order amount. A shop charge must never be presented as a registration, verification, or booking fee."]
      },
      {
        id: "marketplace-receipts",
        title: "Marketplace Receipts",
        body: ["Receipts or invoices for marketplace product orders may be generated from the clearly shown order total and TheFitSaathi records. Customers should contact support if shop order details need correction."]
      },
      {
        id: "marketplace-payment-problems",
        title: "Marketplace Payment Problems",
        body: ["A failed or pending shop payment may delay only the related product order. It must not block account or provider registration, identity verification, or coach and dojo booking."]
      },
      {
        id: "marketplace-refunds-disputes",
        title: "Marketplace Refunds & Disputes",
        body: ["Marketplace product disputes are reviewed against the order total, delivery status, product condition, seller return terms, and applicable law. They do not affect the free status of registration, verification, or coach and dojo booking."]
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
        body: ["Coaches and dojos are independent professionals. TheFitSaathi is not liable for injuries, outcomes, or conduct beyond the responsibilities required by law."],
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
        body: ["A light blue Verified Coach badge may be assigned after TheFitSaathi reviews identity, profile quality, skill evidence, and platform requirements."],
        variant: "verified"
      },
      {
        id: "elite",
        title: "Elite Coach",
        body: ["An Elite Coach badge uses a purple status signal and may require 2+ years of strong activity, consistent reliability, and strong customer outcomes. Eligible coaches may receive a yearly Rs. 10,000 wellness or diet support reward."],
        variant: "royal"
      },
      {
        id: "legendary",
        title: "Legendary Coach",
        body: ["Legendary Coach is a rare crown status based on exceptional verified activity and reliability. Eligible coaches may receive a yearly Rs. 17,000 wellness or diet support reward."],
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
    summary: "Rules for a respectful, safe, and healthy TheFitSaathi community.",
    lastUpdated: "June 29, 2026",
    sections: [
      {
        id: "respect",
        title: "Respectful Environment",
        body: ["TheFitSaathi expects respectful communication between customers, coaches, dojo owners, staff, and support. Hate speech, harassment, threats, or targeted abuse are prohibited."]
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
        body: ["TheFitSaathi, coaches, and dojos do not replace medical diagnosis or treatment. Users should rely on qualified medical professionals for health decisions."]
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
