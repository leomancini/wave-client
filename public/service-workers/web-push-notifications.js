/* eslint-disable no-restricted-globals */
/* global clients */

const SUBSCRIPTION_RENEWAL_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours

async function renewSubscription() {
  try {
    const registration = await self.registration;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return;

    const clients = await self.clients.matchAll();
    const client = clients[0];
    if (!client) return;

    const url = new URL(client.url);
    const [, groupId, userId] = url.pathname.split("/");

    if (!groupId || !userId) return;

    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: subscription.options.applicationServerKey
    });

    const response = await fetch(
      `${self.location.origin}/web-push/renew-subscription/${groupId}/${userId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubscription)
      }
    );

    if (!response.ok) {
      const data = await response.json();
      if (data.isExpired) {
        await subscription.unsubscribe();
      }
      throw new Error(data.error || "Failed to renew subscription");
    }
  } catch (error) {
    console.error("Error renewing push subscription:", error);
  }
}

setInterval(renewSubscription, SUBSCRIPTION_RENEWAL_INTERVAL);

self.addEventListener("activate", (event) => {
  event.waitUntil(renewSubscription());
});

self.addEventListener("push", function (event) {
  if (!event.data) return;

  try {
    let data;
    try {
      data = event.data.json();
    } catch (e) {
      data = { message: event.data.text() };
    }

    const options = {
      body: data.body || data.message || "New notification",
      icon: "/logo192.png",
      badge: "/logo192.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
        url: data.url || "/",
        ...data
      },
      timestamp: Date.now(),
      requireInteraction: true,
      actions: [
        {
          action: "explore",
          title: "View Details"
        },
        {
          action: "close",
          title: "Close"
        }
      ],
      silent: false
    };

    event.waitUntil(
      self.registration
        .showNotification(data.title || "Push Notification", options)
        .catch((error) => {
          console.error("Error showing notification:", error);
          // Try again without optional features
          delete options.actions;
          delete options.badge;
          delete options.vibrate;
          return self.registration.showNotification(
            data.title || "Push Notification",
            options
          );
        })
    );
  } catch (error) {
    console.error("Error processing push event:", error);
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "close") return;

  const url = event.notification.data.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // If a window exists, focus it and navigate if needed
        for (const client of windowClients) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        // If no window exists, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
