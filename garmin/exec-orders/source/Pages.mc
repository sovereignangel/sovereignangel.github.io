//
// Pages — the payload turned into what the wrist actually pages through.
//
// App scope only. The glance never gets here, which is the point: the glance
// answers "what now", the pages answer "why, and with what".
//
// The two phases are different documents, not one document with things hidden:
//
//   morning  BODY first, then today's kite windows and the session that was
//            promised last night. Anything that moved overnight is called out
//            on the page it moved on, not buried in a summary.
//   evening  DONE first — what the day actually was — then how the body took
//            it, then tomorrow's full plan so the morning has nothing to
//            decide.
//
// Wire keys are documented in garmin/exec-orders/README.md and produced only
// by compactOrders() in lib/exec/orders.ts.
//

using Toybox.Lang as Lang;

class Row {
    var text;
    var kind;
    var colour;

    function initialize(rowText, rowKind, rowColour) {
        text = rowText;
        kind = rowKind;
        colour = rowColour;
    }
}

class Page {
    var title;
    var accent;
    var rows;

    function initialize(pageTitle, pageAccent) {
        title = pageTitle;
        accent = pageAccent;
        rows = [];
    }

    function hero(text, colour) {
        add(text, Pages.KIND_HERO, colour);
    }

    function body(text, colour) {
        add(text, Pages.KIND_BODY, colour);
    }

    function label(text, colour) {
        add(text, Pages.KIND_LABEL, colour);
    }

    //! Empty and null rows are dropped here rather than at each call site, so
    //! a payload missing a field simply shows one row fewer.
    private function add(text, kind, colour) {
        if (!(text instanceof Lang.String) || text.length() == 0) {
            return;
        }
        rows.add(new Row(text, kind, colour));
    }
}

module Pages {

    const KIND_HERO = 0;
    const KIND_BODY = 1;
    const KIND_LABEL = 2;

    function build(data) {
        if (data == null) {
            return [ emptyPage() ];
        }

        var pages = [];
        if (Orders.isEvening(data)) {
            var plan = Orders.dict(data, "tm");
            pages.add(headPage(data, true));
            addIf(pages, donePage(data));
            pages.add(bodyPage(data, false));
            addIf(pages, kitePage(plan, null, "TOMORROW · KITE"));
            addIf(pages, trainPage(plan, null, "TOMORROW · TRAIN"));
            addIf(pages, drillsPage(plan));
        } else {
            var today = Orders.dict(data, "td");
            pages.add(headPage(data, false));
            pages.add(bodyPage(data, true));
            addIf(pages, kitePage(today, Orders.str(data, "ck", null), "KITE"));
            addIf(pages, trainPage(today, Orders.str(data, "ct", null), "TRAIN"));
            addIf(pages, drillsPage(today));
        }
        addIf(pages, spotsPage(data));
        return pages;
    }

    function addIf(pages, page) {
        if (page != null) {
            pages.add(page);
        }
    }

    function emptyPage() {
        var p = new Page("EXEC", Palette.TEAL);
        p.hero("No orders yet", Palette.PAPER);
        p.body("Set the endpoint, token and athlete in Garmin Connect, then press START.", Palette.MUTED);
        var err = Orders.lastError();
        if (err != null) {
            p.label(err, Palette.AMBER);
        }
        return p;
    }

    // ── Head ─────────────────────────────────────────────────────────────

    function headPage(data, evening) {
        var p = new Page(evening ? "TONIGHT" : "TODAY", evening ? Palette.BURGUNDY : Palette.TEAL);
        p.hero(Orders.headline(data), Palette.PAPER);

        var race = Orders.dict(data, "rc");
        if (race != null) {
            var days = Orders.num(race, "d", -1);
            if (days >= 0) {
                p.label(days.toString() + "d to " + Orders.str(race, "n", "race"), Palette.BURGUNDY);
            }
        }

        p.label(Orders.date(data) + " · " + Orders.str(data, "pr", "") + " · built " + Orders.generatedAt(data), Palette.FAINT);

        if (Orders.num(data, "ws", 0) == 1) {
            p.label("Wind service was down — kite call may be stale", Palette.AMBER);
        }
        var err = Orders.lastError();
        if (err != null) {
            p.label("Last refresh: " + err, Palette.AMBER);
        }
        return p;
    }

    // ── Body ─────────────────────────────────────────────────────────────

    //! Sleep, recovery, loading, endurance. The morning leads with sleep
    //! because it is the input that most often overrides the printed plan;
    //! the evening drops it, having nothing new to say about last night.
    function bodyPage(data, morning) {
        var b = Orders.dict(data, "b");
        var page = new Page("BODY", Palette.BURGUNDY);
        if (b == null) {
            page.body("No Garmin data — self-assess.", Palette.MUTED);
            return page;
        }

        var band = Orders.str(b, "bd", "unknown");
        var bandInk = Palette.band(band);

        if (morning) {
            var sleep = Orders.num(b, "sl", -1);
            if (sleep >= 0) {
                page.label("SLEEP", Palette.MUTED);
                page.hero(sleep.toString(), sleepInk(sleep));
            }
        }

        var readiness = Orders.num(b, "rd", -1);
        if (readiness >= 0) {
            page.label("RECOVERY", Palette.MUTED);
            page.hero(readiness.toString() + " · " + band.toUpper(), bandInk);
        }

        var factors = Orders.list(b, "fx");
        if (factors != null) {
            for (var i = 0; i < factors.size(); i += 1) {
                page.label(factors[i], Palette.FAINT);
            }
        }

        var load = Orders.num(b, "la", -1);
        if (load >= 0) {
            page.label("LOADING", Palette.MUTED);
            var trend = Orders.str(b, "lt", "");
            var line = load.toString() + " acute";
            var ratio = Orders.str(b, "lr", null);
            if (ratio != null) {
                line = line + " · " + ratio + "x";
            }
            page.body(line, Palette.PAPER);
            page.label(trend, trendInk(trend));
        }

        var endurance = Orders.num(b, "en", -1);
        if (endurance >= 0) {
            page.label("ENDURANCE", Palette.MUTED);
            var delta = Orders.num(b, "ed", 0);
            var deltaText = "";
            if (delta > 0) {
                deltaText = "  +" + delta.toString() + " wk";
            } else if (delta < 0) {
                deltaText = "  " + delta.toString() + " wk";
            }
            page.body(endurance.toString() + deltaText, deltaInk(delta));
        }
        return page;
    }

    function sleepInk(score) {
        if (score >= 75) {
            return Palette.GREEN;
        }
        if (score >= 60) {
            return Palette.AMBER;
        }
        return Palette.RED;
    }

    //! Ramping is not a failure — it is the point of a build block — so it is
    //! amber rather than red. Detraining is the one worth flinching at here.
    function trendInk(trend) {
        if (trend.equals("steady")) {
            return Palette.GREEN;
        }
        if (trend.equals("ramping")) {
            return Palette.AMBER;
        }
        if (trend.equals("detraining")) {
            return Palette.RED;
        }
        return Palette.MUTED;
    }

    function deltaInk(delta) {
        if (delta > 0) {
            return Palette.GREEN;
        }
        if (delta < 0) {
            return Palette.AMBER;
        }
        return Palette.PAPER;
    }

    // ── Done today ───────────────────────────────────────────────────────

    function donePage(data) {
        var items = Orders.list(data, "dn");
        if (items == null || items.size() == 0) {
            var empty = new Page("DONE", Palette.BURGUNDY);
            empty.body("Nothing recorded today.", Palette.MUTED);
            return empty;
        }
        var page = new Page("DONE", Palette.BURGUNDY);
        for (var i = 0; i < items.size(); i += 1) {
            var a = items[i];
            if (!(a instanceof Lang.Dictionary)) {
                continue;
            }
            page.hero(Orders.str(a, "l", ""), Palette.PAPER);
            page.label(Orders.str(a, "d", ""), Palette.MUTED);
        }
        return page;
    }

    // ── Kite ─────────────────────────────────────────────────────────────

    //! `changed` is the one line that makes a restated plan worth restating:
    //! without it, a forecast that moved overnight looks exactly like one that
    //! never moved.
    function kitePage(plan, changed, title) {
        var k = (plan == null) ? null : Orders.dict(plan, "k");
        var page = new Page(title, Palette.TEAL);

        if (k == null) {
            page.hero("No window", Palette.MUTED);
            page.body("Nothing rideable. Train, study, recover.", Palette.MUTED);
            if (changed != null) {
                page.label(changed, Palette.AMBER);
            }
            return page;
        }

        page.hero(Orders.str(k, "s", "Spot"), Palette.PAPER);

        var windows = Orders.list(k, "w");
        if (windows != null && windows.size() > 0) {
            for (var i = 0; i < windows.size(); i += 1) {
                page.body(windows[i], Palette.TEAL);
            }
        } else {
            page.body(Orders.str(k, "fw", ""), Palette.TEAL);
        }

        page.label(
            Orders.num(k, "kn", 0).toString() + " kn · gusts " + Orders.num(k, "g", 0).toString()
                + " · " + Orders.str(k, "dr", "-") + " · " + Orders.str(k, "sz", "-"),
            Palette.MUTED
        );
        page.label(Orders.str(k, "a", ""), Palette.FAINT);

        if (Orders.num(k, "p", 0) == 1) {
            page.body("Possible only — EU model alone saw this. Recheck before rigging.", Palette.AMBER);
        }
        page.body(Orders.str(k, "n", ""), Palette.MUTED);
        if (changed != null) {
            page.label("CHANGED", Palette.AMBER);
            page.body(changed, Palette.AMBER);
        }
        return page;
    }

    // ── Train ────────────────────────────────────────────────────────────

    function trainPage(plan, changed, title) {
        var t = (plan == null) ? null : Orders.dict(plan, "t");
        if (t == null) {
            return null;
        }

        var page = new Page(title, Palette.BURGUNDY);
        page.hero(Orders.str(t, "ti", "Session"), Palette.PAPER);

        var slot = Orders.str(t, "sl", null);
        if (slot != null) {
            var line = slot + " · " + Orders.num(t, "du", 0).toString() + " min";
            var zone = Orders.str(t, "z", "-");
            if (!zone.equals("-")) {
                line = line + " · " + zone;
            }
            page.body(line, Palette.BURGUNDY);
        } else {
            page.body("Rest — nothing to schedule.", Palette.MUTED);
        }

        var pace = Orders.str(t, "pc", null);
        if (pace != null) {
            page.label("target " + pace, Palette.PAPER);
        }

        var together = Orders.num(t, "tg", 0);
        if (together > 0) {
            page.label(together.toString() + " min together", Palette.FAINT);
        }

        page.body(Orders.str(t, "ah", ""), Palette.MUTED);
        page.label(Orders.str(t, "dt", ""), Palette.MUTED);

        if (changed != null) {
            page.label("CHANGED", Palette.AMBER);
            page.body(changed, Palette.AMBER);
        }
        return page;
    }

    // ── Drills ───────────────────────────────────────────────────────────

    function drillsPage(plan) {
        var drills = (plan == null) ? null : Orders.list(plan, "dl");
        if (drills == null || drills.size() == 0) {
            return null;
        }
        var page = new Page("DRILLS", Palette.TEAL);
        for (var i = 0; i < drills.size(); i += 1) {
            var d = drills[i];
            if (!(d instanceof Lang.Dictionary)) {
                continue;
            }
            page.body((i + 1).toString() + ". " + Orders.str(d, "l", ""), Palette.PAPER);
            page.label(Orders.str(d, "d", ""), Palette.MUTED);
        }
        return page;
    }

    // ── Spot ledger ──────────────────────────────────────────────────────

    function spotsPage(data) {
        var spots = Orders.list(data, "sp");
        if (spots == null || spots.size() == 0) {
            return null;
        }
        var page = new Page("SPOTS", Palette.TEAL);
        for (var i = 0; i < spots.size(); i += 1) {
            var s = spots[i];
            if (!(s instanceof Lang.Dictionary)) {
                continue;
            }
            page.body(Orders.str(s, "n", ""), Palette.PAPER);
            page.label(Orders.str(s, "l", ""), stateColour(Orders.str(s, "s", "f")));
        }
        return page;
    }

    //! Same four states the /wind grid uses, so the ledger on the wrist can
    //! never look like it is contradicting the forecast page.
    function stateColour(state) {
        if (state.equals("r")) {
            return Palette.GREEN;
        }
        if (state.equals("p")) {
            return Palette.AMBER;
        }
        if (state.equals("h")) {
            return Palette.RED;
        }
        return Palette.FAINT;
    }
}
