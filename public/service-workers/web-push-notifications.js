/* eslint-disable no-restricted-globals */
/* global clients */

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
      self.registration.showNotification(
        data.title || "Push Notification",
        options
      )
    );
  } catch (error) {
    // Silent error handling
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "close") return;

  const notificationUrl = event.notification.data.url || "/";
  const fullUrl = new URL(notificationUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (fullUrl.startsWith(client.url) && "focus" in client) {
            return Promise.all([client.navigate(fullUrl), client.focus()]);
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(fullUrl);
        }
      })
  );
});
