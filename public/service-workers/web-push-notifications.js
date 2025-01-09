/* eslint-disable no-restricted-globals */
/* global clients */

// Check and renew subscription periodically
const SUBSCRIPTION_RENEWAL_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours

async function renewSubscription() {
  try {
    const registration = await self.registration;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return;

    // Extract groupId and userId from the current URL path
    const clients = await self.clients.matchAll();
    const client = clients[0];
    if (!client) return;

    const url = new URL(client.url);
    const [, groupId, userId] = url.pathname.split("/");

    if (!groupId || !userId) return;

    // Renew the subscription
    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: subscription.options.applicationServerKey
    });

    // Update the subscription on the server
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
        // If subscription is expired, remove it
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
  if (!event.data) {
    return;
  }

  try {
    let data;
    try {
      data = event.data.json();
    } catch (e) {
      data = { message: event.data.text() };
    }

    const options = {
      body: data.body || data.message || "New notification",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
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
      ]
    };

    event.waitUntil(
      self.registration
        .showNotification(data.title || "Push Notification", options)
        .catch((error) => console.error("Error showing notification:", error))
    );
  } catch (error) {
    console.error("Error processing push event:", error);
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        if (windowClients.length > 0) {
          const client = windowClients[0];
          client.focus();
          if (event.action === "explore") {
            return client.navigate("/");
          }
        } else if (event.action === "explore") {
          return clients.openWindow("/");
        }
      })
  );
});
