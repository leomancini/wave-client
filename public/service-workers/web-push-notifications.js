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

  const url = event.notification.data.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === url && "focus" in client) {
            return client.focus().then(() => {
              // Post a message to the focused client with additional data
              client.postMessage({
                type: "NOTIFICATION_CLICKED",
                data: event.notification.data
              });
              return client;
            });
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data.type === "NOTIFICATION_CLICKED") {
    // Handle the notification data here
    alert("Notification data:", event.data.data);
    // You can now use this data to update your UI or trigger other actions
  }
});
