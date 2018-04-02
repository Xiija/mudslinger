import { EventHook } from "./event";


export interface IMxpOutput {
    pushElem(elem: HTMLElement): void;
    popElem(): HTMLElement;
    sendCommand(value: string, noPrint?: boolean): void;
};


export class Mxp {
    private outputIf: IMxpOutput;

    private openTags: Array<string> = [];
    private tagHandlers: Array<(tag: string) => void> = [];

    constructor(outputIf: IMxpOutput) {
        this.outputIf = outputIf;

        this.makeTagHandlers();
    }

    private makeTagHandlers() {
        this.tagHandlers.push((tag) => {
            let re = /^<version>$/i;
            let match = re.exec(tag);
            if (match) {
                this.outputIf.sendCommand(
                    "\x1b[1z<VERSION CLIENT=Mudslinger MXP=0.01>", // using closing line tag makes it print twice...
                    true);
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
                let elem: HTMLImageElement = document.createElement("img");
                elem.src = match[2] + match[1];
                this.outputIf.pushElem(elem);
                this.outputIf.popElem();
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

                this.outputIf.pushElem(elem[0]);
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
                    this.outputIf.popElem();
                }
                return true;
            }

            return false;
        });
        this.tagHandlers.push((tag) => {
            let re = /^<([bi])>/i;
            let match = re.exec(tag);
            if (match) {
                this.openTags.push(match[1]);
                let elem = $(tag);
                this.outputIf.pushElem(elem[0]);
                return true;
            }

            re = /^<\/([bi])>/i;
            match = re.exec(tag);
            if (match) {
                if (this.openTags[this.openTags.length - 1] !== match[1]) {
                    console.log("Got closing " + match[1] + " tag with no opening tag.");
                } else {
                    this.openTags.pop();
                    this.outputIf.popElem();
                }
                return true;
            }

            return false;
        });
        this.tagHandlers.push((tag) => {
            let re = /^<s>/i;
            let match = re.exec(tag);
            if (match) {
                this.openTags.push("s");
                let elem: HTMLSpanElement = document.createElement("span");
                elem.style.textDecoration = "line-through";
                this.outputIf.pushElem(elem);
                return true;
            }

            re = /^<\/s>/i;
            match = re.exec(tag);
            if (match) {
                if (this.openTags[this.openTags.length - 1] !== "s") {
                    console.log("Got closing s tag with no opening tag.");
                } else {
                    this.openTags.pop();
                    this.outputIf.popElem();
                }
                return true;
            }

            return false;
        });

        this.tagHandlers.push((tag) => {
            let re = /^<u>/i;
            let match = re.exec(tag);
            if (match) {
                this.openTags.push("u");
                let elem: HTMLSpanElement = document.createElement("span");
                elem.className = "underline";
                this.outputIf.pushElem(elem);
                return true;
            }

            re = /^<\/u>/i;
            match = re.exec(tag);
            if (match) {
                if (this.openTags[this.openTags.length - 1] !== "u") {
                    console.log("Got closing u tag with no opening tag.");
                } else {
                    this.openTags.pop();
                    this.outputIf.popElem();
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
                    let elem: HTMLAnchorElement = document.createElement("a");
                    elem.href = "#";
                    elem.title = cmd;
                    elem.className = "underline";
                    elem.addEventListener("click", () => {
                        this.outputIf.sendCommand(tag_m[1]);
                    });
                    this.openTags.push("send");
                    this.outputIf.pushElem(elem);
                    return true;
                }

                /* just the tag */
                tag_re = /^<send>$/i;
                tag_m = tag_re.exec(tag);
                if (tag_m) {
                    this.openTags.push("send");
                    let elem = document.createElement("a") as HTMLAnchorElement;
                    elem.href = "#";
                    elem.className = "underline";

                    this.outputIf.pushElem(elem);
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
                    let elem = this.outputIf.popElem() as HTMLAnchorElement;
                    if (!elem.hasAttribute("title")) {
                        /* didn't have explicit href so we need to do it here */
                        let txt = elem.innerText;
                        elem.title = txt;
                        elem.addEventListener("click", () => {
                            this.outputIf.sendCommand(txt);
                        });
                    }
                }
                return true;
            }

            return false;
        });
    }

    public handleMxpTag(data: string) {
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
            this.outputIf.popElem();
        }
        this.openTags = [];
    };
}
