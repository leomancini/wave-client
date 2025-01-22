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
  event.preventDefault();
  event.notification.close();

  const notificationUrl = event.notification.data.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        if (clients.length > 0) {
          const client = clients[0];
          client.navigate(notificationUrl);
          client.focus();
          return;
        } else event.waitUntil(self.clients.openWindow(notificationUrl));
      })
  );
});
