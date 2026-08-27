//
// ExecBackground — the periodic pull.
//
// Connect IQ has no server push, so "tell me when I wake up" has to be the
// watch asking ahead of time. A single Duration registration is used rather
// than scheduling exact Moments: a Duration re-arms itself, while a Moment
// has to be re-registered after every fire and fails silently and permanently
// if one registration is ever missed. The clock check then does the actual
// gating, so outside the morning and evening windows the process wakes, reads
// System.getClockTime(), and exits without opening the radio.
//
// The full payload goes to Storage. Background.exit() carries only a stub —
// exit data is size-limited, and everything the app needs is already stored.
//

using Toybox.Background as Background;
using Toybox.System as System;

(:background)
class ExecServiceDelegate extends System.ServiceDelegate {

    private var _fetcher;

    function initialize() {
        ServiceDelegate.initialize();
    }

    function onTemporalEvent() as Void {
        if (!Orders.inReviewWindow()) {
            Background.exit(null);
            return;
        }
        // Held on the delegate so it survives until the callback fires.
        _fetcher = new OrdersFetcher(method(:onFetched));
        _fetcher.start();
    }

    function onFetched(ok, payload) as Void {
        if (ok) {
            Orders.save(payload);
            Background.exit({
                "d" => Orders.date(payload),
                "hl" => Orders.headline(payload)
            });
            return;
        }
        // Keep the last good orders; only record why the refresh failed.
        Orders.saveError(payload);
        Background.exit(null);
    }
}
