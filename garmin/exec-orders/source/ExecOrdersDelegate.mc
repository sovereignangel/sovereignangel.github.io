//
// ExecOrdersDelegate — UP/DOWN page, START refreshes, BACK exits.
//
// BehaviorDelegate rather than InputDelegate so the same handlers serve the
// physical buttons on the Forerunner and the swipe gestures on a touch screen,
// without mapping key codes by hand.
//

using Toybox.WatchUi as WatchUi;

class ExecOrdersDelegate extends WatchUi.BehaviorDelegate {

    private var _view;

    function initialize(view) {
        BehaviorDelegate.initialize();
        _view = view;
    }

    function onNextPage() {
        _view.next();
        return true;
    }

    function onPreviousPage() {
        _view.previous();
        return true;
    }

    //! START pulls a fresh set of orders — the one thing worth a manual radio
    //! call, e.g. standing at the beach deciding whether the window still holds.
    function onSelect() {
        _view.refresh();
        return true;
    }
}
