"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { saveSubscription } from "../actions/push";

const PUBLIC_VAPID_KEY = "BJ2A8lV0misRVIcJdmivxomgEMfdBLF5lX6IFkGluM4JXy1hrcJdwsaxlp1yVztwnlO6yZTe3dzPOlvU6tX27pA";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushManager({ patientId }: { patientId: string }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      
      // Register service worker
      navigator.serviceWorker.register("/sw.js")
        .then(registration => {
          // Check if already subscribed
          return registration.pushManager.getSubscription();
        })
        .then(subscription => {
          setIsSubscribed(subscription !== null);
        })
        .catch(err => console.error("Service Worker registration failed: ", err));
    }
  }, []);

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });

      // Send to server
      await saveSubscription(patientId, JSON.parse(JSON.stringify(subscription)));
      setIsSubscribed(true);
      alert("Notificações ativadas com sucesso!");
    } catch (error) {
      console.error("Error subscribing to push:", error);
      alert("Não foi possível ativar as notificações. Verifique as permissões do navegador.");
    }
  };

  if (!isSupported || isSubscribed) {
    return null; // Hide if not supported or already subscribed
  }

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 mb-6">
      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
        <Bell className="text-blue-600" size={24} />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <h4 className="font-bold text-blue-900">Ative os Alertas!</h4>
        <p className="text-sm text-blue-700">Receba mensagens importantes do seu fisioterapeuta direto na tela do celular.</p>
      </div>
      <button 
        onClick={subscribeToPush}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl transition-colors"
      >
        Ativar Agora
      </button>
    </div>
  );
}
