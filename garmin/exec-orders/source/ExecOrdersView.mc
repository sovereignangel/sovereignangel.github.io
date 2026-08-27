//
// ExecOrdersView — the paged detail behind the glance.
//
// One page per question: what now, where is the wind, what is the session,
// what is the day's focus, which drills, and the four-spot ledger. UP and
// DOWN move between them; a page taller than the screen scrolls first and
// turns at the end, so nothing is ever silently cut off.
//
// Font sizes are chosen per page rather than fixed: the layout is measured at
// the largest tier and steps down until it fits. A 60-minute Z2 session and a
// brick with two paragraphs of detail should not be rendered at the same size
// just because they are the same kind of page.
//

using Toybox.Graphics as Graphics;
using Toybox.Lang as Lang;
using Toybox.WatchUi as WatchUi;

class ExecOrdersView extends WatchUi.View {

    // hero / body / label font for each tier, largest first.
    private var _tiers;

    private const ROW_GAP = 4;
    private const SCROLL_STEP = 40;

    private var _pages;
    private var _index = 0;
    private var _scroll = 0;
    private var _fetching = false;
    private var _fetcher;
    private var _contentHeight = 0;
    private var _viewportHeight = 0;

    function initialize() {
        View.initialize();
        _tiers = [
            [ Graphics.FONT_MEDIUM, Graphics.FONT_SMALL, Graphics.FONT_XTINY ],
            [ Graphics.FONT_SMALL, Graphics.FONT_TINY, Graphics.FONT_XTINY ],
            [ Graphics.FONT_TINY, Graphics.FONT_XTINY, Graphics.FONT_XTINY ]
        ];
        _pages = Pages.build(null);
    }

    function onShow() {
        reload();
        // Opening the app is itself a request for the current answer, so a
        // cache older than one refresh interval is refreshed on the way in.
        var age = Orders.ageMinutes();
        var limit = Orders.setting("refreshMinutes", 30);
        if (!(limit instanceof Lang.Number)) {
            limit = 30;
        }
        if (age == null || age >= limit) {
            refresh();
        }
    }

    //! Rebuild the page list from whatever is in Storage now.
    function reload() {
        var previous = _index;
        _pages = Pages.build(Orders.load());
        _index = (previous < _pages.size()) ? previous : 0;
        _scroll = 0;
    }

    // ── Navigation ───────────────────────────────────────────────────────

    function next() {
        if (_scroll + _viewportHeight < _contentHeight) {
            _scroll += SCROLL_STEP;
        } else {
            _index = (_index + 1) % _pages.size();
            _scroll = 0;
        }
        WatchUi.requestUpdate();
    }

    function previous() {
        if (_scroll > 0) {
            _scroll -= SCROLL_STEP;
            if (_scroll < 0) {
                _scroll = 0;
            }
        } else {
            _index = (_index == 0) ? _pages.size() - 1 : _index - 1;
            _scroll = 0;
        }
        WatchUi.requestUpdate();
    }

    // ── Refresh ──────────────────────────────────────────────────────────

    function refresh() {
        if (_fetching) {
            return;
        }
        _fetching = true;
        WatchUi.requestUpdate();
        _fetcher = new OrdersFetcher(method(:onFetched));
        _fetcher.start();
    }

    function onFetched(ok, payload) as Void {
        _fetching = false;
        if (ok) {
            Orders.save(payload);
        } else {
            Orders.saveError(payload);
        }
        reload();
        WatchUi.requestUpdate();
    }

    // ── Drawing ──────────────────────────────────────────────────────────

    function onUpdate(dc) {
        var w = dc.getWidth();
        var h = dc.getHeight();

        dc.setColor(Graphics.COLOR_TRANSPARENT, Palette.BLACK);
        dc.clear();

        var page = _pages[_index];
        var titleFont = Graphics.FONT_XTINY;
        var titleH = Graphics.getFontHeight(titleFont);
        var footH = Graphics.getFontHeight(Graphics.FONT_XTINY);

        // Round screen: keep the text inside the widest safe chord rather
        // than the bounding box, or the first and last lines clip on the bezel.
        var contentWidth = (w * 78) / 100;
        var top = (h * 12) / 100;
        var bottom = h - footH - 6;

        // ── Title ──────────────────────────────────────────────────────────
        dc.setColor(page.accent, Graphics.COLOR_TRANSPARENT);
        dc.drawText(w / 2, top, titleFont, page.title, Graphics.TEXT_JUSTIFY_CENTER);

        var contentTop = top + titleH + 6;
        _viewportHeight = bottom - contentTop;

        // ── Body, at the largest tier that fits ────────────────────────────
        var tier = chooseTier(dc, page, contentWidth, _viewportHeight);
        var fonts = _tiers[tier];
        _contentHeight = measure(dc, page, fonts, contentWidth);

        if (_scroll > _contentHeight - _viewportHeight) {
            _scroll = _contentHeight - _viewportHeight;
        }
        if (_scroll < 0) {
            _scroll = 0;
        }

        var y = contentTop - _scroll;
        for (var i = 0; i < page.rows.size(); i += 1) {
            var row = page.rows[i];
            var font = fonts[row.kind];
            var lineH = Graphics.getFontHeight(font);
            var lines = TextUtil.wrap(dc, row.text, font, contentWidth);

            for (var j = 0; j < lines.size(); j += 1) {
                if (y + lineH > contentTop && y < bottom) {
                    dc.setColor(row.colour, Graphics.COLOR_TRANSPARENT);
                    dc.drawText(w / 2, y, font, lines[j], Graphics.TEXT_JUSTIFY_CENTER);
                }
                y += lineH;
            }
            y += ROW_GAP;
        }

        drawFooter(dc, w, h, footH, page.accent);
    }

    //! Page position, or the refresh state while the radio is busy.
    private function drawFooter(dc, w, h, footH, accent) {
        var text;
        var colour;
        if (_fetching) {
            text = "refreshing";
            colour = accent;
        } else {
            text = (_index + 1).toString() + "/" + _pages.size().toString();
            colour = Palette.FAINT;
        }
        dc.setColor(colour, Graphics.COLOR_TRANSPARENT);
        dc.drawText(w / 2, h - footH - 4, Graphics.FONT_XTINY, text, Graphics.TEXT_JUSTIFY_CENTER);
    }

    private function chooseTier(dc, page, width, available) {
        for (var t = 0; t < _tiers.size(); t += 1) {
            if (measure(dc, page, _tiers[t], width) <= available) {
                return t;
            }
        }
        return _tiers.size() - 1;   // Still too tall — the smallest tier scrolls.
    }

    private function measure(dc, page, fonts, width) {
        var total = 0;
        for (var i = 0; i < page.rows.size(); i += 1) {
            var row = page.rows[i];
            var font = fonts[row.kind];
            var lines = TextUtil.wrap(dc, row.text, font, width);
            total += lines.size() * Graphics.getFontHeight(font) + ROW_GAP;
        }
        return total;
    }
}
