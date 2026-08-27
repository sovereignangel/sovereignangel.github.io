//
// Fetch — one GET against /api/exec/orders.
//
// Annotated (:background) because the background service is the primary
// caller; the annotation keeps it in the app scope too, so the manual refresh
// on SELECT reuses exactly this code path rather than a second one that could
// drift.
//
// The glance deliberately cannot reach this. Glances are given a small memory
// budget and a short lifetime, and a radio call inside one is a good way to
// get the whole glance killed mid-draw. It reads whatever the last successful
// fetch left in Storage.
//

using Toybox.Communications as Communications;
using Toybox.Lang as Lang;
using Toybox.PersistedContent as PersistedContent;

(:background)
class OrdersFetcher {

    // Callback invoked as onDone(ok as Boolean, payloadOrMessage).
    private var _onDone;

    function initialize(onDone) {
        _onDone = onDone;
    }

    function start() {
        var url = Orders.setting("serverUrl", "");
        var token = Orders.setting("watchToken", "");

        if (!(url instanceof Lang.String) || url.length() == 0) {
            finish(false, "No endpoint set");
            return;
        }
        if (!(token instanceof Lang.String) || token.length() == 0) {
            finish(false, "No token set");
            return;
        }

        // `p` selects the athlete. Both watches share one token; the payload is
        // a training plan, and the two of them already share the dashboard.
        // The server echoes the resolved person back in `pr`, and the head page
        // prints it, so a mis-set watch is visible rather than silent.
        Communications.makeWebRequest(
            url,
            { "k" => token, "p" => Orders.person() },
            {
                :method => Communications.HTTP_REQUEST_METHOD_GET,
                :responseType => Communications.HTTP_RESPONSE_CONTENT_TYPE_JSON
            },
            method(:onResponse)
        );
    }

    //! The type checker is invariant on callback parameters, so this has to
    //! restate makeWebRequest's declared union exactly — Iterator included,
    //! even though a JSON response type never produces one.
    function onResponse(
        code as Lang.Number,
        data as Lang.Dictionary or Lang.String or PersistedContent.Iterator or Null
    ) as Void {
        if (code == 200 && data instanceof Lang.Dictionary) {
            finish(true, data);
            return;
        }
        finish(false, explain(code));
    }

    //! Turn a Connect IQ response code into something readable on a wrist.
    //! The negative codes are the ones that actually happen in the field, and
    //! "-104" on a watch face tells you nothing about the phone in your pocket.
    private function explain(code) {
        if (code == 401 || code == 403) {
            return "Token rejected";
        }
        if (code == 404) {
            return "Endpoint not found";
        }
        if (code >= 500 && code < 600) {
            return "Server error " + code.toString();
        }
        if (code == -104 || code == -2) {
            return "Phone not connected";
        }
        if (code == -101 || code == -400) {
            return "Bad response body";
        }
        if (code == -403) {
            return "Response too large";
        }
        if (code == -300 || code == -1001) {
            return "Request timed out";
        }
        return "Fetch failed (" + code.toString() + ")";
    }

    private function finish(ok, payload) {
        if (_onDone != null) {
            _onDone.invoke(ok, payload);
        }
    }
}
