import webPush from "web-push";

let configuredFor = "";

export function webPushConfiguration() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  const privateKey = process.env.VAPID_PRIVATE_KEY || "";
  const subject = process.env.VAPID_SUBJECT || "";
  const subjectValid = subject.startsWith("mailto:") || subject.startsWith("https://");
  let available = Boolean(publicKey && privateKey && subjectValid);
  if (available) {
    const signature = `${subject}:${publicKey}`;
    if (configuredFor !== signature) {
      try {
        webPush.setVapidDetails(subject, publicKey, privateKey);
        configuredFor = signature;
      } catch {
        available = false;
      }
    }
  }
  return { available, publicKey: available ? publicKey : "" };
}

export { webPush };
