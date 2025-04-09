const isLocalhost = Boolean(
  window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

export function register(config) {
  if ("serviceWorker" in navigator) {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
    window.addEventListener("load", () => {
      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) return;
        installingWorker.onstatechange = () => {
          if (
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.log("New content is available; please refresh.");
            if (config && config.onUpdate) config.onUpdate(registration);
          }
        };
      };
      // Request notification permission
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          registration.pushManager
            .subscribe({ userVisibleOnly: true })
            .then(() => {
              console.log("Push subscription successful");
            });
        }
      });
    })
    .catch((error) => {
      console.error("Error during service worker registration:", error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { "Service-Worker": "script" } })
    .then((response) => {
      const contentType = response.headers.get("content-type");
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf("javascript") === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log(
        "No internet connection found. App is running in offline mode."
      );
    });
}

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

export function refreshTokenPeriodically(
  refreshTokenFunction,
  interval = 15 * 60 * 1000
) {
  if (typeof refreshTokenFunction === "function") {
    setInterval(async () => {
      try {
        await refreshTokenFunction();
      } catch (error) {
        console.error("Error refreshing token:", error);
      }
    }, interval);
  }
}
