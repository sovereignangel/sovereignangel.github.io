//
// Orders — the cached day, and the few accessors every scope needs.
//
// Annotated for both glance and background because all three scopes read it:
// the background service writes the fetch result here, the glance reads the
// headline, and the app reads the whole dictionary. Monkey C gives glances no
// access to unannotated symbols, so anything the glance touches has to live
// in here and stay small — glance code loads from the head of the PRG and is
// charged against the glance memory budget.
//
// The wire format is the short-keyed projection from lib/exec/orders.ts.
// Keys are documented next to each accessor so the two halves can be read
// against each other.
//

using Toybox.Application.Storage as Storage;
using Toybox.Application.Properties as Properties;
using Toybox.Lang as Lang;
using Toybox.Time as Time;
using Toybox.System as System;

(:glance :background)
module Orders {

    // Keys carry the wire-format version. A payload written by an older build
    // is not upgraded in place — it is simply not found, so the app refetches
    // instead of rendering v2 pages from a v1 body it half-understands.
    // Bump these whenever compactOrders() changes shape.
    const KEY_DATA = "orders_v2";
    const KEY_AT = "ordersAt_v2";
    const KEY_ERR = "ordersErr_v2";

    // ── Storage ──────────────────────────────────────────────────────────

    //! The last payload the watch successfully fetched, or null.
    function load() {
        try {
            return Storage.getValue(KEY_DATA);
        } catch (e) {
            return null;
        }
    }

    //! Persist a payload and stamp it. Clears any standing error.
    function save(data) {
        try {
            Storage.setValue(KEY_DATA, data);
            Storage.setValue(KEY_AT, Time.now().value());
            Storage.setValue(KEY_ERR, null);
        } catch (e) {
            // A full filesystem is not worth crashing a glance over.
        }
    }

    //! Accept a Background.exit() stub, but only when it would not overwrite a
    //! richer payload. Storage is shared with the background process, so the
    //! full orders are normally already here and the stub is redundant. This
    //! is the fallback for the case where that write did not land: better a
    //! correct headline than yesterday's orders.
    function saveStub(stub) {
        if (stub == null || !(stub instanceof Lang.Dictionary)) {
            return;
        }
        var existing = load();
        if (existing != null && date(existing).equals(date(stub))) {
            return;
        }
        save(stub);
    }

    //! Record why the last fetch failed, without discarding the good payload.
    function saveError(message) {
        try {
            Storage.setValue(KEY_ERR, message);
        } catch (e) {
        }
    }

    function lastError() {
        try {
            return Storage.getValue(KEY_ERR);
        } catch (e) {
            return null;
        }
    }

    //! Minutes since the last successful fetch, or null if there never was one.
    function ageMinutes() {
        try {
            var at = Storage.getValue(KEY_AT);
            if (at == null) {
                return null;
            }
            var delta = Time.now().value() - at;
            if (delta < 0) {
                return 0;
            }
            return delta / 60;
        } catch (e) {
            return null;
        }
    }

    // ── Settings ─────────────────────────────────────────────────────────

    function setting(key, fallback) {
        try {
            var v = Properties.getValue(key);
            // A declared property always has a value; an undeclared key throws
            // and is caught below. Only "cleared in Garmin Connect" needs a guard.
            if (v instanceof Lang.String && v.length() == 0) {
                return fallback;
            }
            return v;
        } catch (e) {
            return fallback;
        }
    }

    //! Which athlete this watch is set to. Stored as an index so the settings
    //! list can be a picker rather than a free-text field.
    function person() {
        return setting("person", 0) == 1 ? "aidas" : "lori";
    }

    //! True while the local clock sits inside the morning or evening window.
    //! The background process checks this before touching the radio, so a
    //! wake outside both windows costs a clock read and nothing else.
    function inReviewWindow() {
        var hour = System.getClockTime().hour;
        var amFrom = setting("morningStart", 5);
        var amTo = setting("morningEnd", 11);
        var pmFrom = setting("eveningStart", 19);
        var pmTo = setting("eveningEnd", 23);
        return (hour >= amFrom && hour < amTo) || (hour >= pmFrom && hour < pmTo);
    }

    // ── Payload accessors ────────────────────────────────────────────────
    // Every one tolerates a null or half-built dictionary: the watch may be
    // holding a payload written by an older build of the server.

    function str(data, key, fallback) {
        if (data == null || !(data instanceof Lang.Dictionary)) {
            return fallback;
        }
        var v = data[key];
        if (v == null) {
            return fallback;
        }
        if (v instanceof Lang.String) {
            return v;
        }
        return v.toString();
    }

    function num(data, key, fallback) {
        if (data == null || !(data instanceof Lang.Dictionary)) {
            return fallback;
        }
        var v = data[key];
        if (v == null || !(v instanceof Lang.Number)) {
            return fallback;
        }
        return v;
    }

    function dict(data, key) {
        if (data == null || !(data instanceof Lang.Dictionary)) {
            return null;
        }
        var v = data[key];
        if (v instanceof Lang.Dictionary) {
            return v;
        }
        return null;
    }

    function list(data, key) {
        if (data == null || !(data instanceof Lang.Dictionary)) {
            return null;
        }
        var v = data[key];
        if (v instanceof Lang.Array) {
            return v;
        }
        return null;
    }

    //! "hl" — the whole day in one wrist-width line.
    function headline(data) {
        return str(data, "hl", "No orders yet");
    }

    //! "ph" — "m" morning orders, "e" evening review.
    function isEvening(data) {
        return str(data, "ph", "m").equals("e");
    }

    //! "gen" — Palanga-local HH:MM the server assembled this.
    function generatedAt(data) {
        return str(data, "gen", "--:--");
    }

    //! "d" — the Palanga-local date the orders are for.
    function date(data) {
        return str(data, "d", "");
    }
}
