//
// Palette — the /exec accents translated for an AMOLED screen.
//
// The web page reads on cream; the watch reads on black, so the surf teal and
// the ironman burgundy are both lifted until they hold their identity against
// a dark ground. Same two-accent rule as the page: kite wears teal, training
// wears burgundy, and nothing else gets a colour of its own.
//
// Annotated (:glance) so the glance can reach it; that also keeps it in the
// app scope.
//

(:glance)
module Palette {
    const TEAL = 0x1E8A93;
    const BURGUNDY = 0xB54A4A;
    const PAPER = 0xF2ECDF;
    const MUTED = 0x9A928A;
    const FAINT = 0x6B6560;
    const GREEN = 0x4FA37A;
    const AMBER = 0xC9A227;
    const RED = 0xD9614C;
    const BLACK = 0x000000;

    //! Readiness band code ("green"/"amber"/"red") to its ink.
    function band(code) {
        if (code == null) {
            return MUTED;
        }
        if (code.equals("green")) {
            return GREEN;
        }
        if (code.equals("amber")) {
            return AMBER;
        }
        if (code.equals("red")) {
            return RED;
        }
        return MUTED;
    }
}
