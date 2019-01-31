import * as Util from "./util";
import { colorIdToHtml } from "./color";
import { UserConfig } from "./userConfig";

export class OutWinBase {
    private colorsEnabled: boolean;

    private lineCount: number = 0;
    private maxLines: number = 5000;

    constructor(rootElem: JQuery) {
        this.$rootElem = rootElem;
        this.$targetElems = [rootElem];
        this.$target = rootElem;

        // direct children of the root will be line containers, let"s push the first one.
        this.pushElem($("<span>").appendTo(rootElem));

        this.$rootElem.bind("scroll", (e: any) => { this.handleScroll(e); });

        this.colorsEnabled = UserConfig.getDef("colorsEnabled", true);
        UserConfig.onSet("colorsEnabled", (val: any) => { this.setColorsEnabled(val); });
    }


    public setMaxLines(count: number) {
        this.maxLines = count;
    }

    private setColorsEnabled(val: boolean) {
        if (val === this.colorsEnabled) {
            return;
        }

        this.colorsEnabled = val;

        for (let colorId in colorIdToHtml) {
            let colorHtml = colorIdToHtml[colorId];

            this.$rootElem.find(".fg-" + colorId).css("color", this.colorsEnabled ? colorHtml : "");
            this.$rootElem.find(".bg-" + colorId).css("background-color", this.colorsEnabled ? colorHtml : "");
            this.$rootElem.find(".bb-" + colorId).css("border-bottom-color", this.colorsEnabled ? colorHtml : "");
        }
    }

    private fgColorId: string;
    private bgColorId: string;

    public setFgColorId(colorId: string) {
        this.fgColorId = colorId;
    }

    public setBgColorId(colorId: string) {
        this.bgColorId = colorId;
    };

    // handling nested elements, always output to last one
    private $targetElems: JQuery[];
    private underlineNest = 0;
    protected $target: JQuery;
    private $rootElem: JQuery;

    private scrollLock = false; // true when we should not scroll to bottom
    private handleScroll(e: any) {
        let scrollHeight = this.$rootElem.prop("scrollHeight");
        let scrollTop = this.$rootElem.scrollTop();
        let outerHeight = this.$rootElem.outerHeight();
        let is_at_bottom = outerHeight + scrollTop >= scrollHeight;

        this.scrollLock = !is_at_bottom;
    }

    // elem is the actual jquery element
    public pushElem(elem: JQuery) {
        this.writeBuffer();

        this.$target.append(elem);
        this.$targetElems.push(elem);
        this.$target = elem;

        if (elem.hasClass("underline")) {
            this.underlineNest += 1;
        }
    }

    public popElem() {
        this.writeBuffer();

        let popped = this.$targetElems.pop();
        this.$target = this.$targetElems[this.$targetElems.length - 1];

        if (popped.hasClass("underline")) {
            this.underlineNest -= 1;
        }

        return popped;
    }

    protected handleLine(line: string) {
        // default to nothing, main output window will send it to trigger manager
    }

    private appendBuffer = "";
    private lineText = ""; // track full text of the line with no escape sequences or tags
    public addText(txt: string) {
        this.lineText += txt;
        let html = Util.rawToHtml(txt);
        let spanText = "<span";

        let classText = "";
        if (this.fgColorId) {
            classText += "fg-" + this.fgColorId + " ";
        }
        if (this.bgColorId) {
            classText += "bg-" + this.bgColorId + " ";
        }
        if (this.underlineNest > 0) {
            classText += "bb-" + this.fgColorId + " ";
        }

        if (classText !== "") {
            spanText += " class=\"" + classText + "\"";
        }

        let styleText = "";

        if (this.underlineNest > 0) {
            styleText += "border-bottom-style:solid;";
            styleText += "border-bottom-width:1px;";
            if (this.colorsEnabled) {
                styleText += "border-bottom-color:" + colorIdToHtml[this.fgColorId] + ";";
            }
        }

        if (this.colorsEnabled) {
            
            if (this.fgColorId) {
                styleText += "color:" + colorIdToHtml[this.fgColorId] + ";";
            }
            if (this.bgColorId) {
                styleText += "background-color:" + colorIdToHtml[this.bgColorId] + ";";
            }
        }

        if (styleText !== "") {
            spanText += " style=\"" + styleText + "\"";
        }

        spanText += ">";
        spanText += html;
        spanText += "</span>";
        this.appendBuffer += spanText;

        if (txt.endsWith("\n")) {
            this.$target.append(this.appendBuffer);
            this.appendBuffer = "";
            this.newLine();
        }
    };

    private newLine() {
        this.popElem(); // pop the old line
        this.pushElem($("<span>").appendTo(this.$target));

        this.handleLine(this.lineText);
        this.lineText = "";

        this.lineCount += 1;
        if (this.lineCount > this.maxLines) {
            this.$rootElem.children(":lt(" +
                (this.maxLines / 2) +
                ")"
            ).remove();
            this.lineCount = (this.maxLines / 2);
        }
    }

    private writeBuffer() {
        this.$target.append(this.appendBuffer);
        this.appendBuffer = "";
    };

    public outputDone() {
        this.writeBuffer();
        this.scrollBottom();
    };

    private scrollRequested = false;
    private privScrolBottom() {
        // console.time("_scroll_bottom");
        let elem = this.$rootElem;
        elem.scrollTop(elem.prop("scrollHeight"));
        this.scrollLock = false;
        this.scrollRequested = false;
        // console.timeEnd("_scroll_bottom");
    };

    protected scrollBottom(force: boolean = false) {
        if (this.scrollLock && force !== true) {
            return;
        }
        if (this.scrollRequested) {
            return;
        }

        requestAnimationFrame(() => this.privScrolBottom());
        this.scrollRequested = true;
    }
}
