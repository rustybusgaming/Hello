/**
 * Storage bridge injected into every sandboxed game frame.
 *
 * Game frames run without `allow-same-origin`, which walls them off from the hub's session
 * but also leaves them in an opaque origin where `localStorage` throws. That would silently
 * destroy Flash SharedObjects (Ruffle keeps saves in localStorage) and any HTML5 game that
 * stores progress.
 *
 * So the frame gets a synchronous in-memory Storage that is seeded from, and written back
 * to, the hub page over postMessage. The hub decides where it lands: the player's account
 * when signed in, the hub's own localStorage when not.
 */
/** Marker used to detect an already-injected bridge; must not appear in host pages. */
export const FRAME_STORAGE_MARKER = 'flashhub-storage-bridge-v1';

export const FRAME_STORAGE_SCRIPT = `/* ${'flashhub-storage-bridge-v1'} */
(function () {
  'use strict';
  if (window.__flashhubStorage) return;

  var SYNC_DEBOUNCE_MS = 1200;
  var SEED_TIMEOUT_MS = 4000; // generous: better a slow start than a lost save

  function makeStorage(onWrite) {
    var map = Object.create(null);

    var storage = {
      getItem: function (key) {
        key = String(key);
        return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : null;
      },
      setItem: function (key, value) {
        map[String(key)] = String(value);
        onWrite();
      },
      removeItem: function (key) {
        delete map[String(key)];
        onWrite();
      },
      clear: function () {
        map = Object.create(null);
        onWrite();
      },
      key: function (index) {
        var keys = Object.keys(map);
        return index >= 0 && index < keys.length ? keys[index] : null;
      }
    };

    // Must stay configurable: a Proxy whose ownKeys trap omits a non-configurable own
    // property of the target throws, and ownKeys below deliberately reports only entries.
    Object.defineProperty(storage, 'length', {
      configurable: true,
      get: function () { return Object.keys(map).length; }
    });

    // Ruffle enumerates storage with Object.keys(localStorage), so the entries have to be
    // visible as plain properties, not just through the Storage methods.
    return new Proxy(storage, {
      get: function (target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop === 'string' && Object.prototype.hasOwnProperty.call(map, prop)) return map[prop];
        return undefined;
      },
      set: function (target, prop, value) {
        if (typeof prop === 'string' && !(prop in target)) {
          map[prop] = String(value);
          onWrite();
        }
        return true;
      },
      deleteProperty: function (target, prop) {
        if (typeof prop === 'string') { delete map[prop]; onWrite(); }
        return true;
      },
      has: function (target, prop) {
        return (prop in target) || (typeof prop === 'string' && Object.prototype.hasOwnProperty.call(map, prop));
      },
      ownKeys: function () { return Object.keys(map); },
      getOwnPropertyDescriptor: function (target, prop) {
        if (typeof prop === 'string' && Object.prototype.hasOwnProperty.call(map, prop)) {
          return { value: map[prop], writable: true, enumerable: true, configurable: true };
        }
        return Object.getOwnPropertyDescriptor(target, prop);
      }
    });
  }

  var syncTimer = null;
  var bridge = {
    ready: false,
    read: function () {
      var out = {};
      Object.keys(local).forEach(function (k) { out[k] = local.getItem(k); });
      return out;
    }
  };

  function scheduleSync() {
    if (!bridge.ready) return; // still seeding; do not echo the seed back
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function () {
      try {
        parent.postMessage({ type: 'flashhub:storage-changed', data: bridge.read() }, '*');
      } catch (e) { /* hub went away */ }
    }, SYNC_DEBOUNCE_MS);
  }

  var local = makeStorage(scheduleSync);

  // Replace the real Storage objects. In an opaque origin touching the originals throws,
  // so they are only ever redefined, never read.
  try {
    Object.defineProperty(window, 'localStorage', { value: local, configurable: true });
    Object.defineProperty(window, 'sessionStorage', { value: makeStorage(function () {}), configurable: true });
  } catch (e) {
    console.warn('[FlashHub] Could not install the storage bridge:', e);
  }

  function finishSeeding() {
    if (bridge.ready) return;
    bridge.ready = true;
    window.dispatchEvent(new Event('flashhub:storage-ready'));
  }

  window.addEventListener('message', function (event) {
    var msg = event.data;
    if (!msg || msg.type !== 'flashhub:storage-data') return;
    var data = msg.data || {};
    Object.keys(data).forEach(function (key) { local.setItem(key, data[key]); });
    finishSeeding();
  });

  window.__flashhubStorage = bridge;

  try {
    parent.postMessage({ type: 'flashhub:storage-request' }, '*');
  } catch (e) {
    finishSeeding();
  }

  // Never block a game because the hub did not answer
  setTimeout(finishSeeding, SEED_TIMEOUT_MS);
})();
`;
