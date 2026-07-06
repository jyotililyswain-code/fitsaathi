export const MANUAL_UPI_ID = "7065223868-2@ibl";
export const MANUAL_UPI_METHOD = "upi_manual";
export const MANUAL_PAYMENT_PAID_STATUS = "paid";

export function manualPaymentData(transactionId: string, amountPaid: number, screenshotPath?: string | null) {
  return {
    paymentMethod: MANUAL_UPI_METHOD,
    upiId: MANUAL_UPI_ID,
    transactionId,
    paymentStatus: MANUAL_PAYMENT_PAID_STATUS,
    status: MANUAL_PAYMENT_PAID_STATUS,
    amountPaid,
    paidAt: new Date(),
    provider: "UPI_MANUAL",
    ...(screenshotPath ? { paymentScreenshotPath: screenshotPath } : {})
  };
}
