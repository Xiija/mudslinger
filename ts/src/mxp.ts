import {ChatWin} from "./chatWin";
import {Message} from "./message";
import {OutputManager} from "./outputManager";

declare let $;

export class Mxp {
    private pMessage: Message;
    private pOutputManager: OutputManager;
    private pChatWin: ChatWin;

    private open_tags = [];
    private tag_handlers = [];

    constructor(pMessage: Message, pOutputManager: OutputManager, pChatWin: ChatWin) {
        this.pMessage = pMessage;
        this.pOutputManager = pOutputManager;
        this.pChatWin = pChatWin;

        this.make_tag_handlers();

        this.pMessage.sub("mxp_tag", this.handle_mxp_tag, this);
    }

    private make_tag_handlers() {
        this.tag_handlers.push((tag) => {
            let re = /^<version>$/i;
            let match = re.exec(tag);
            if (match) {
                this.pMessage.pub("send_command", {
                data: "\x1b[1z<VERSION CLIENT=ArcWeb MXP=0.01>", // using closing line tag makes it print twice...
                no_print: true
                });
                return true;
            }
            return false;
        });

        this.tag_handlers.push((tag) => {
            /* hande image tags */
            let re = /^<image\s*(\S+)\s*url="(.*)">$/i;
            let match = re.exec(tag);
            if (match) {
                /* push and pop is dirty way to do this, clean it up later */
                let elem = $("<img src=\"" + match[2] + match[1] + "\">");
                this.pOutputManager.pushMxpElem(elem);
                this.pOutputManager.popMxpElem();
                return true;
            }
        });

        this.tag_handlers.push((tag) => {
            /* handle dest tags */
            let re = /^<dest comm>$/i;
            let match = re.exec(tag);
            if (match) {
                this.open_tags.push("dest");
                this.pOutputManager.pushTarget(this.pChatWin);
                return true;
            }

            re = /^<\/dest>$/i;
            match = re.exec(tag);
            if (match) {
                if (this.open_tags[this.open_tags.length - 1] !== "dest") {
                    /* We actually expect this to happen because the mud sends newlines inside DEST tags right now... */
                    // console.log("Got closing dest tag with no opening tag.");
                } else {
                    this.open_tags.pop();
                    this.pOutputManager.popTarget();
                }
                return true;
            }
        });
        this.tag_handlers.push((tag) => {
            let re = /^<a /i;
            let match = re.exec(tag);
            if (match) {
                this.open_tags.push("a");
                let elem = $(tag);
                elem.attr("target", "_blank");
                let color = this.pOutputManager.getFgColor();
                elem.css("border-bottom", "1px solid " + color);
                this.pOutputManager.pushMxpElem(elem);
                return true;
            }

            re = /^<\/a>/i;
            match = re.exec(tag);
            if (match) {
                if (this.open_tags[this.open_tags.length - 1] !== "a") {
                    /* We actually expect this to happen because the mud sends newlines inside DEST tags right now... */
                    console.log("Got closing a tag with no opening tag.");
                } else {
                    this.open_tags.pop();
                    this.pOutputManager.popMxpElem();
                }
                return true;
            }
        });
        this.tag_handlers.push((tag) => {
            let re = /^<([bius])>/i;
            let match = re.exec(tag);
            if (match) {
                this.open_tags.push(match[1]);
                let elem = $(tag);
                this.pOutputManager.pushMxpElem(elem);
                return true;
            }

            re = /^<\/([bius])>/i;
            match = re.exec(tag);
            if (match) {
                if (this.open_tags[this.open_tags.length - 1] !== match[1]) {
                    console.log("Got closing " + match[1] + " tag with no opening tag.");
                } else {
                    this.open_tags.pop();
                    this.pOutputManager.popMxpElem();
                }
                return true;
            }
        });
        this.tag_handlers.push((tag) => {
            let re = /^<send/i;
            let match = re.exec(tag);
            if (match) {
                /* match with explicit href */
                let tag_re = /^<send (?:href=)?[""](.*)[""]>$/i;
                let tag_m = tag_re.exec(tag);
                if (tag_m) {
                    let cmd = tag_m[1];
                    let html_tag = "<a href=\"#\" title=\"" + cmd + "\">";
                    let elem = $(html_tag);
                    let color = this.pOutputManager.getFgColor() || elem.css("color");
                    elem.css("border-bottom", "1px solid " + color);
                    elem.click(() => {
                        this.pMessage.pub("send_command", {data: tag_m[1]});
                    });
                    this.open_tags.push("send");
                    this.pOutputManager.pushMxpElem(elem);
                    return true;
                }

                /* just the tag */
                tag_re = /^<send>$/i;
                tag_m = tag_re.exec(tag);
                if (tag_m) {
                    this.open_tags.push("send");
                    let html_tag = "<a href=\"#\">";
                    let elem = $(html_tag);
                    let color = this.pOutputManager.getFgColor() || elem.css("color");
                    elem.css("border-bottom", "1px solid " + color);
                    this.pOutputManager.pushMxpElem(elem);
                    return true;
                }
            }

            re = /^<\/send>/i;
            match = re.exec(tag);
            if (match) {
                if (this.open_tags[this.open_tags.length - 1] !== "send") {
                    console.log("Got closing send tag with no opening tag.");
                } else {
                    this.open_tags.pop();
                    let elem = this.pOutputManager.popMxpElem();
                    if (!elem[0].hasAttribute("title")) {
                        /* didn"t have explicit href so we need to do it here */
                        let txt = elem.text();
                        elem[0].setAttribute("title", txt);
                        elem.click(() => {
                            this.pMessage.pub("send_command", {data: txt});
                        });
                    }
                }
                return true;
            }
        });
    }

    private handle_mxp_tag(msg) {
        let handled = false;
        for (let i = 0; i < this.tag_handlers.length; i++) {
            /* tag handlers will return true if it"s a match */
            if (this.tag_handlers[i](msg.data)) {
                handled = true;
                break;
            }
        }

        if (!handled) {
            console.log("Unsupported MXP tag: " + msg.data);
        }
    };

    // Need to close any remaining open tags whe we get newlines
    public handle_newline() {
        if (this.open_tags.length < 1) {
            return;
        }

        for (let i = this.open_tags.length - 1; i >= 0; i--) {
            if (this.open_tags[i] === "dest") {
                this.pOutputManager.popTarget();
            } else {
                this.pOutputManager.popMxpElem();
            }
        }
        this.open_tags = [];
    };
}
