//
// Exec Orders — /exec on the wrist.
//
// Three scopes, one payload:
//   glance      reads the cached headline, draws, exits. No radio.
//   app         pages through the full orders; refreshes on demand.
//   background  pulls on a timer inside the two review windows.
//
// Everything the watch shows is assembled server-side by lib/exec/orders.ts,
// so the wind rules, the readiness adaptation and the drill ladder can only be
// changed in one place.
//

using Toybox.Application as Application;
using Toybox.Background as Background;
using Toybox.Lang as Lang;
using Toybox.Time as Time;
using Toybox.WatchUi as WatchUi;

class ExecOrdersApp extends Application.AppBase {

    function initialize() {
        AppBase.initialize();
    }

    function onStart(state as Lang.Dictionary or Null) as Void {
        scheduleBackground();
    }

    function onStop(state as Lang.Dictionary or Null) as Void {
    }

    function getInitialView() {
        var view = new ExecOrdersView();
        return [ view, new ExecOrdersDelegate(view) ];
    }

    (:glance)
    function getGlanceView() {
        return [ new ExecGlanceView() ];
    }

    (:background)
    function getServiceDelegate() {
        return [ new ExecServiceDelegate() ];
    }

    //! The service normally already wrote the full payload to Storage, so this
    //! is mostly the nudge telling a visible glance or view to redraw. The stub
    //! is only taken up if that write did not land — see Orders.saveStub.
    function onBackgroundData(data as Application.PersistableType) as Void {
        Orders.saveStub(data);
        WatchUi.requestUpdate();
    }

    //! Settings changed on the phone: the interval or the windows may have
    //! moved, so re-arm before redrawing.
    function onSettingsChanged() as Void {
        scheduleBackground();
        WatchUi.requestUpdate();
    }

    //! Re-registering an already-registered temporal event is harmless and is
    //! how a dropped registration heals — so this runs on every app start.
    function scheduleBackground() as Void {
        if (!(Toybox has :Background)) {
            return;
        }
        var minutes = Orders.setting("refreshMinutes", 30);
        if (!(minutes instanceof Lang.Number) || minutes < 5) {
            minutes = 5;   // Garmin's floor for temporal events.
        }
        try {
            Background.registerForTemporalEvent(new Time.Duration(minutes * 60));
        } catch (e) {
            // Denied permission or no background slot free — the app still
            // works, it just refreshes when opened.
        }
    }
}
