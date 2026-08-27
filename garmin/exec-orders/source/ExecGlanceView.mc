//
// ExecGlanceView — the whole day in one strip, no radio, no waiting.
//
// This is the view a wrist-raise actually lands on, so it draws from cache
// alone and never blocks. Everything it shows was written by the background
// service the last time it ran inside a review window.
//
// Left-aligned to match Garmin's own glance carousel rather than the page's
// centred cards: a glance that centres its text shifts position every time the
// headline changes length, and stops being recognisable at a flick.
//

using Toybox.Graphics as Graphics;
using Toybox.WatchUi as WatchUi;

(:glance)
class ExecGlanceView extends WatchUi.GlanceView {

    private const MAX_LINES = 2;

    function initialize() {
        GlanceView.initialize();
    }

    function onUpdate(dc) {
        var data = Orders.load();
        var evening = Orders.isEvening(data);
        var accent = evening ? Palette.BURGUNDY : Palette.TEAL;

        var w = dc.getWidth();
        var h = dc.getHeight();
        var left = 6;
        var usable = w - (left * 2);

        dc.setColor(Graphics.COLOR_TRANSPARENT, Palette.BLACK);
        dc.clear();

        var labelFont = Graphics.FONT_XTINY;
        var bodyFont = (Graphics has :FONT_GLANCE) ? Graphics.FONT_GLANCE : Graphics.FONT_TINY;

        // ── Row 1: which half of the day is speaking, and how old it is ────
        dc.setColor(accent, Graphics.COLOR_TRANSPARENT);
        dc.drawText(left, 2, labelFont, evening ? "REVIEW" : "ORDERS", Graphics.TEXT_JUSTIFY_LEFT);

        dc.setColor(staleColour(), Graphics.COLOR_TRANSPARENT);
        dc.drawText(w - left, 2, labelFont, ageLabel(data), Graphics.TEXT_JUSTIFY_RIGHT);

        // ── Row 2+: the headline ───────────────────────────────────────────
        var text = Orders.headline(data);
        if (data == null) {
            var err = Orders.lastError();
            if (err != null) {
                text = err;
            }
        }

        var y = 2 + Graphics.getFontHeight(labelFont) + 2;
        var lineH = Graphics.getFontHeight(bodyFont);
        var lines = TextUtil.wrap(dc, text, bodyFont, usable);

        dc.setColor(Palette.PAPER, Graphics.COLOR_TRANSPARENT);
        for (var i = 0; i < lines.size() && i < MAX_LINES; i += 1) {
            if (y + lineH > h) {
                break;
            }
            var line = lines[i];
            // Anything past the last drawable line is folded into an ellipsis
            // so a truncated headline never looks like a complete one.
            if (i == MAX_LINES - 1 && lines.size() > MAX_LINES) {
                line = TextUtil.fit(dc, line + " ", bodyFont, usable);
            }
            dc.drawText(left, y, bodyFont, line, Graphics.TEXT_JUSTIFY_LEFT);
            y += lineH;
        }
    }

    //! Faint while the cache is current, amber once it is old enough that the
    //! window on screen may already have closed.
    private function staleColour() {
        var age = Orders.ageMinutes();
        if (age == null || age > 720) {
            return Palette.AMBER;
        }
        return Palette.FAINT;
    }

    private function ageLabel(data) {
        var age = Orders.ageMinutes();
        if (age == null) {
            return "no data";
        }
        if (age < 90) {
            return Orders.generatedAt(data);
        }
        if (age < 1440) {
            return (age / 60).toString() + "h old";
        }
        return (age / 1440).toString() + "d old";
    }
}
