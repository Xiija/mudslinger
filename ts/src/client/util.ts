export function replaceLtGt(text: string): string {
    return text.replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
}

export function replaceAmp(text: string): string {
    return text.replace(/&/g, "&amp;");
}

export function replaceLf(text: string): string {
    // We are presumably already stripping out CRs before this
    return text.replace(/\n/g, "<br>");
}

export function rawToHtml(text: string): string {
    return replaceLf(
            replaceLtGt(
            replaceAmp(text)));
}

export function stripColorTags(text: string): string {
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

// https://stackoverflow.com/questions/19491336/get-url-parameter-jquery-or-how-to-get-query-string-values-in-js
export function getUrlParameter(sParam: string): string {
    let sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split("&"),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split("=");

        if (sParameterName[0] === sParam) {
            return sParameterName[1];
        }
    }

    return undefined;
}
