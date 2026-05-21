"use server";

import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const PUBLIC_VAPID_KEY = "BJ2A8lV0misRVIcJdmivxomgEMfdBLF5lX6IFkGluM4JXy1hrcJdwsaxlp1yVztwnlO6yZTe3dzPOlvU6tX27pA";
const PRIVATE_VAPID_KEY = "twOx0cTf_atLRnysnMhHcDT4sXF14uzKc6kop5XDeyA";

webpush.setVapidDetails(
  "mailto:contato@kinesis.com.br",
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
);

export async function saveSubscription(patientId: string, subscription: any) {
  try {
    // In a real scenario, this subscription should be validated
    await prisma.patient.update({
      where: { id: patientId },
      data: {
        push_subscription: subscription
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Error saving subscription:", error);
    return { success: false, error: "Failed to save subscription" };
  }
}

export async function sendPushNotification(patientIds: string[], payload: { title: string; body: string }) {
  try {
    const patients = await prisma.patient.findMany({
      where: {
        id: { in: patientIds },
        push_subscription: { not: null as any } // Only get patients with a valid subscription
      },
      select: { push_subscription: true, name: true }
    });

    let successCount = 0;

    for (const patient of patients) {
      if (patient.push_subscription) {
        try {
          await webpush.sendNotification(
            patient.push_subscription as any,
            JSON.stringify(payload)
          );
          successCount++;
        } catch (pushError) {
          console.error(`Failed to send push to ${patient.name}:`, pushError);
          // If the subscription is expired (410 Gone), we should ideally remove it from DB here
        }
      }
    }

    return { success: true, count: successCount, total: patients.length };
  } catch (error) {
    console.error("Error sending push notifications:", error);
    return { success: false, error: "Failed to send notifications" };
  }
}
