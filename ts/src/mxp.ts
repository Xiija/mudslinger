import {ChatWin} from './chatWin';
import {Message} from './message';
import {OutputManager} from './outputManager';

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

        this.pMessage.sub('mxp_tag', this.handle_mxp_tag, this);
    }

    private make_tag_handlers() {
        this.tag_handlers.push((tag) => {
            var re = /^<version>$/i;
            var match = re.exec(tag);
            if (match) {
                this.pMessage.pub('send_command', {
                data: '\x1b[1z<VERSION CLIENT=ArcWeb MXP=0.01>', // using closing line tag makes it print twice...
                no_print: true
                });
                return true;
            }
            return false;
        });

        this.tag_handlers.push((tag) => {
            /* hande image tags */
            var re = /^<image\s*(\S+)\s*url="(.*)">$/i;
            var match = re.exec(tag);
            if (match) {
                /* push and pop is dirty way to do this, clean it up later */
                var elem = $('<img src="' + match[2] + match[1] + '">');
                this.pOutputManager.pushMxpElem(elem);
                this.pOutputManager.popMxpElem();
                return true;
            }
        });

        this.tag_handlers.push((tag) => {
            /* handle dest tags */
            var re = /^<dest comm>$/i;
            var match = re.exec(tag);
            if (match) {
                this.open_tags.push('dest');
                this.pOutputManager.pushTarget(this.pChatWin);
                return true;
            }

            re = /^<\/dest>$/i;
            match = re.exec(tag);
            if (match) {
                if (this.open_tags[this.open_tags.length - 1] != 'dest') {
                    /* We actually expect this to happen because the mud sends newlines inside DEST tags right now... */
                    //console.log("Got closing dest tag with no opening tag.");
                } else {
                    this.open_tags.pop();
                    this.pOutputManager.popTarget();
                }
                return true;
            }
        });
        this.tag_handlers.push((tag) => {
            var re = /^<a /i;
            var match = re.exec(tag);
            if (match) {
                this.open_tags.push('a');
                var elem = $(tag);
                elem.attr('target', '_blank');
                var color = this.pOutputManager.getFgColor();
                elem.css('border-bottom', '1px solid ' + color);
                this.pOutputManager.pushMxpElem(elem);
                return true;
            }

            re = /^<\/a>/i;
            match = re.exec(tag);
            if (match) {
                if (this.open_tags[this.open_tags.length - 1] != 'a') {
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
            var re = /^<([bius])>/i;
            var match = re.exec(tag);
            if (match) {
                this.open_tags.push(match[1]);
                var elem = $(tag);
                this.pOutputManager.pushMxpElem(elem);
                return true;
            }

            re = /^<\/([bius])>/i;
            match = re.exec(tag);
            if (match) {
                if (this.open_tags[this.open_tags.length - 1] != match[1]) {
                    console.log("Got closing " + match[1] + " tag with no opening tag.");
                } else {
                    this.open_tags.pop();
                    this.pOutputManager.popMxpElem();
                }
                return true;
            }
        });
        this.tag_handlers.push((tag) => {
            var re = /^<send/i;
            var match = re.exec(tag);
            if (match) {
                /* match with explicit href */
                var tag_re = /^<send (?:href=)?['"](.*)['"]>$/i;
                var tag_m = tag_re.exec(tag);
                if (tag_m) {
                    var cmd = tag_m[1];
                    var html_tag = '<a href="#" title="' + cmd + '">';
                    var elem = $(html_tag);
                    var color = this.pOutputManager.getFgColor() || elem.css('color');
                    elem.css('border-bottom', '1px solid ' + color);
                    elem.click(() => {
                        this.pMessage.pub('send_command', {data: tag_m[1]});
                    });
                    this.open_tags.push('send');
                    this.pOutputManager.pushMxpElem(elem);
                    return true;
                }

                /* just the tag */
                tag_re = /^<send>$/i;
                tag_m = tag_re.exec(tag);
                if (tag_m) {
                    this.open_tags.push('send');
                    var html_tag = '<a href="#">';
                    var elem = $(html_tag);
                    var color = this.pOutputManager.getFgColor() || elem.css('color');
                    elem.css('border-bottom', '1px solid ' + color);
                    this.pOutputManager.pushMxpElem(elem);
                    return true;
                }
            }

            re = /^<\/send>/i;
            match = re.exec(tag);
            if (match) {
                if (this.open_tags[this.open_tags.length - 1] != 'send') {
                    console.log("Got closing send tag with no opening tag.");
                } else {
                    this.open_tags.pop();
                    var elem = this.pOutputManager.popMxpElem();
                    if (!elem[0].hasAttribute('title')) {
                        /* didn't have explicit href so we need to do it here */
                        var txt = elem.text();
                        elem[0].setAttribute('title', txt);
                        elem.click(() => {
                            this.pMessage.pub('send_command', {data: txt});
                        })
                    }
                }
                return true;
            }
        });
    }

    private handle_mxp_tag(msg) {
        var handled = false;
        for (var i=0; i < this.tag_handlers.length; i++) {
            /* tag handlers will return true if it's a match */
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
        if (this.open_tags.length<1) {
            return;
        }

        for (var i=this.open_tags.length-1; i >= 0; i--) {
            if (this.open_tags[i] == 'dest') {
                this.pOutputManager.popTarget();
            } else {
                this.pOutputManager.popMxpElem();
            }
        }
        this.open_tags = [];
    };
}
