//
// TextUtil — word wrapping and truncation against real glyph widths.
//
// Annotated (:glance) so the glance can use it, which also makes it available
// to the app scope. One implementation for both: a glance that wraps text
// differently from the view it opens into reads as two different apps.
//

using Toybox.Lang as Lang;

(:glance)
module TextUtil {

    //! Split on a single-character separator. Empty fields are dropped, which
    //! is what we want for whitespace splitting.
    function split(text, sep) {
        var out = [];
        if (!(text instanceof Lang.String)) {
            return out;
        }
        var start = 0;
        var len = text.length();
        var sepLen = sep.length();
        while (start < len) {
            var rest = text.substring(start, len);
            var at = rest.find(sep);
            if (at == null) {
                out.add(rest);
                break;
            }
            if (at > 0) {
                out.add(rest.substring(0, at));
            }
            start += at + sepLen;
        }
        return out;
    }

    //! Greedy word wrap. Returns every line; the caller decides how many fit.
    //! A single word wider than `width` is left on its own line to clip rather
    //! than being broken mid-word.
    function wrap(dc, text, font, width) {
        var out = [];
        if (!(text instanceof Lang.String) || text.length() == 0) {
            return out;
        }
        var words = split(text, " ");
        var line = "";
        for (var i = 0; i < words.size(); i += 1) {
            var candidate = line.equals("") ? words[i] : line + " " + words[i];
            if (dc.getTextWidthInPixels(candidate, font) <= width) {
                line = candidate;
            } else if (line.equals("")) {
                out.add(words[i]);
            } else {
                out.add(line);
                line = words[i];
            }
        }
        if (!line.equals("")) {
            out.add(line);
        }
        return out;
    }

    //! Shorten a single line until it fits, with a trailing ellipsis.
    function fit(dc, text, font, width) {
        if (!(text instanceof Lang.String) || dc.getTextWidthInPixels(text, font) <= width) {
            return text;
        }
        var cut = text;
        while (cut.length() > 1 && dc.getTextWidthInPixels(cut + "...", font) > width) {
            cut = cut.substring(0, cut.length() - 1);
        }
        return cut + "...";
    }
}
