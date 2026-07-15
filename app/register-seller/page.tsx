import SellerRegistrationPage from "@/app/seller/register/page";
import { generateSeoMetadata } from "@/lib/seo";

export const metadata = generateSeoMetadata({
  title: "Register as a Fitness Seller - TheFitSaathi",
  description:
    "Join TheFitSaathi as a seller and list fitness products, sports equipment, and training essentials for customers.",
  path: "/register-seller",
  keywords: [
    "fitness seller registration",
    "sell fitness products",
    "sports equipment seller",
    "TheFitSaathi seller",
  ],
  noIndex: true,
});

export default SellerRegistrationPage;
