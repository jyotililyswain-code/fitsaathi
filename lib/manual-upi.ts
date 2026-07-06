export const MANUAL_UPI_ID = "7065223868-2@ibl";
export const MANUAL_UPI_METHOD = "upi_manual";
export const MANUAL_PAYMENT_PENDING_STATUS = "pending_verification";

export function manualPaymentData(transactionId: string, screenshotPath?: string | null) {
  return {
    paymentMethod: MANUAL_UPI_METHOD,
    upiId: MANUAL_UPI_ID,
    transactionId,
    paymentStatus: MANUAL_PAYMENT_PENDING_STATUS,
    status: MANUAL_PAYMENT_PENDING_STATUS,
    provider: "UPI_MANUAL",
    ...(screenshotPath ? { paymentScreenshotPath: screenshotPath } : {})
  };
}
