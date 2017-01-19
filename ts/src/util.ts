export function replace_lt_gt(text) {
    return text.replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
}

export function replace_amp(text) {
    return text.replace(/&/g, "&amp;");
}

export function replace_lf(text) {
    // We are presumably already stripping out CRs before this
    return text.replace(/\n/g, "<br>");
}

export function raw_to_html(text) {
    return replace_lf(
            replace_lt_gt(
            replace_amp(text)));
}

export function strip_color_tags(text) {
    let rtn = "";
    for (let i = 0; i < text.length; i++) {
        if (text[i] === "{") {
            if (i === text.length - 1) {
                break;
            }
            else if (text[i + 1] === "{") {
                rtn += "{";
                i++;
            }
            else {
                i++;
            }
        }
        else {
            rtn += text[i];
        }
    }

    return rtn;
}
