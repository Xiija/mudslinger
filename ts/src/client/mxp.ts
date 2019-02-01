import { EventHook } from "./event";

import { OutputManager } from "./outputManager";

export class Mxp {
    public EvtEmitCmd = new EventHook<{value: string, noPrint: boolean}>();

    private openTags: Array<string> = [];
    private tagHandlers: Array<(tag: string) => boolean> = [];

    constructor(private outputManager: OutputManager) {
        this.makeTagHandlers();
    }

    private makeTagHandlers() {
        this.tagHandlers.push((tag) => {
            let re = /^<version>$/i;
            let match = re.exec(tag);
            if (match) {
                this.EvtEmitCmd.fire({
                    value: "\x1b[1z<VERSION CLIENT=Mudslinger MXP=0.01>", // using closing line tag makes it print twice...
                    noPrint: true});
                return true;
            }
            return false;
        });

        this.tagHandlers.push((tag) => {
            /* hande image tags */
            let re = /^<image\s*(\S+)\s*url="(.*)">$/i;
            let match = re.exec(tag);
            if (match) {
                /* push and pop is dirty way to do this, clean it up later */
                let elem = $("<img src=\"" + match[2] + match[1] + "\">");
                this.outputManager.pushMxpElem(elem);
                this.outputManager.popMxpElem();
                return true;
            }

            return false;
        });

        this.tagHandlers.push((tag) => {
            let re = /^<a /i;
            let match = re.exec(tag);
            if (match) {
                this.openTags.push("a");
                let elem = $(tag);
                elem.attr("target", "_blank");
                elem.addClass("underline");

                this.outputManager.pushMxpElem(elem);
                return true;
            }

            re = /^<\/a>/i;
            match = re.exec(tag);
            if (match) {
                if (this.openTags[this.openTags.length - 1] !== "a") {
                    /* We actually expect this to happen because the mud sends newlines inside DEST tags right now... */
                    console.log("Got closing a tag with no opening tag.");
                } else {
                    this.openTags.pop();
                    this.outputManager.popMxpElem();
                }
                return true;
            }

            return false;
        });
        this.tagHandlers.push((tag) => {
            let re = /^<([bius])>/i;
            let match = re.exec(tag);
            if (match) {
                this.openTags.push(match[1]);
                let elem = $(tag);
                this.outputManager.pushMxpElem(elem);
                return true;
            }

            re = /^<\/([bius])>/i;
            match = re.exec(tag);
            if (match) {
                if (this.openTags[this.openTags.length - 1] !== match[1]) {
                    console.log("Got closing " + match[1] + " tag with no opening tag.");
                } else {
                    this.openTags.pop();
                    this.outputManager.popMxpElem();
                }
                return true;
            }

            return false;
        });
        this.tagHandlers.push((tag) => {
            let re = /^<send/i;
            let match = re.exec(tag);
            if (match) {
                /* match with explicit href */
                let tag_re = /^<send (?:href=)?["'](.*)["']>$/i;
                let tag_m = tag_re.exec(tag);
                if (tag_m) {
                    let cmd = tag_m[1];
                    let html_tag = "<a href=\"#\" title=\"" + cmd + "\">";
                    let elem = $(html_tag);

                    elem.addClass("underline");

                    elem.click(() => {
                        this.EvtEmitCmd.fire({value: tag_m[1], noPrint: false});
                    });
                    this.openTags.push("send");
                    this.outputManager.pushMxpElem(elem);
                    return true;
                }

                /* just the tag */
                tag_re = /^<send>$/i;
                tag_m = tag_re.exec(tag);
                if (tag_m) {
                    this.openTags.push("send");
                    let html_tag = "<a href=\"#\">";
                    let elem = $(html_tag);

                    elem.addClass("underline");

                    this.outputManager.pushMxpElem(elem);
                    return true;
                }
            }

            re = /^<\/send>/i;
            match = re.exec(tag);
            if (match) {
                if (this.openTags[this.openTags.length - 1] !== "send") {
                    console.log("Got closing send tag with no opening tag.");
                } else {
                    this.openTags.pop();
                    let elem = this.outputManager.popMxpElem();
                    if (!elem[0].hasAttribute("title")) {
                        /* didn"t have explicit href so we need to do it here */
                        let txt = elem.text();
                        elem[0].setAttribute("title", txt);
                        elem.click(() => {
                            this.EvtEmitCmd.fire({value: txt, noPrint: false});
                        });
                    }
                }
                return true;
            }

            return false;
        });
    }

    handleMxpTag(data: string) {
        let handled = false;
        for (let i = 0; i < this.tagHandlers.length; i++) {
            /* tag handlers will return true if it"s a match */
            if (this.tagHandlers[i](data)) {
                handled = true;
                break;
            }
        }

        if (!handled) {
            console.log("Unsupported MXP tag: " + data);
        }
    };

    // Need to close any remaining open tags whe we get newlines
    public handleNewline() {
        if (this.openTags.length < 1) {
            return;
        }

        for (let i = this.openTags.length - 1; i >= 0; i--) {
                this.outputManager.popMxpElem();
        }
        this.openTags = [];
    };
}
