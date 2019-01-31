import { GlEvent, GlDef } from "./event";

import { UserConfig } from "./userConfig";

import {OutputWin} from "./outputWin";
import {OutWinBase} from "./outWinBase";

import { ansiColorTuple, copyAnsiColorTuple, colorIdToHtml,
         ansiFgLookup, ansiBgLookup, ansiName, ansiLevel } from "./color";


export class OutputManager {
    private target: OutWinBase;
    private targetWindows: Array<OutWinBase>;

    private ansiReverse = false;
    private ansiBold = false;

    private ansiFg: ansiColorTuple;
    private ansiBg: ansiColorTuple;

    private fgColorId: string;
    private bgColorId: string;

    private defaultAnsiFg: ansiColorTuple;
    private defaultFgId: string;
    private defaultAnsiBg: ansiColorTuple;
    private defaultBgId: string;

    constructor(private outputWin: OutputWin) {
        this.targetWindows = [this.outputWin];
        this.target = this.outputWin;

        this.loadConfig();

        UserConfig.evtConfigImport.handle(this.handleConfigImport, this);
    }

    private loadConfig() {
        let defaultAnsiFg = UserConfig.get("defaultAnsiFg");
        if (defaultAnsiFg) {
            this.setDefaultAnsiFg(defaultAnsiFg[0], defaultAnsiFg[1]);
        } else {
            this.setDefaultAnsiFg("green", "low");
        }
        let defaultAnsiBg = UserConfig.get("defaultAnsiBg");
        if (defaultAnsiBg) {
            this.setDefaultAnsiBg(defaultAnsiBg[0], defaultAnsiBg[1]);
        } else {
            this.setDefaultAnsiBg("black", "low");
        }
    }

    private handleConfigImport(imp: {[k: string]: any}) {
        let defaultAnsiFg = imp["defaultAnsiFg"];
        if (defaultAnsiFg) {
            this.setDefaultAnsiFg(defaultAnsiFg[0], defaultAnsiFg[1]);
        }
        this.saveColorCfg();
    }

    public outputDone () {
        this.target.outputDone();
    }

    // Redirect output to another OutWinBase until it"s popped
    public pushTarget(tgt: OutWinBase) {
        this.targetWindows.push(tgt);
        this.target = tgt;
    }

    public popTarget() {
        this.target.outputDone();
        this.targetWindows.pop();
        this.target = this.targetWindows[this.targetWindows.length - 1];
    }

    // propagate MXP elements to target
    public pushMxpElem(elem: JQuery) {
        this.target.pushElem(elem);
    }

    public popMxpElem() {
        return this.target.popElem();
    }

    public handleText(data: string) {
        this.target.addText(data);
    }

    private setFgColorId(colorId: string) {
        this.fgColorId = colorId;
        this.pushFgColorIdToTarget();
    }

    private pushFgColorIdToTarget() {
        if (this.ansiReverse) {
            this.target.setBgColorId(this.fgColorId || this.defaultFgId);
        } else {
            this.target.setFgColorId(this.fgColorId);
        }
    }

    private setAnsiFg(color: ansiColorTuple) {
        this.ansiFg = color;
        if (color) {
            this.setFgColorId(color[0] + "-" + color[1]);
        } else {
            this.setFgColorId(null);
        }
    }

    private setBgColorId(color: string) {
        this.bgColorId = color;
        this.pushBgColorIdToTarget();
    }

    private pushBgColorIdToTarget() {
        if (!this.ansiReverse) {
            this.target.setBgColorId(this.bgColorId);
        } else {
            this.target.setFgColorId(this.bgColorId || this.defaultBgId);
        }
    }

    private setAnsiBg(color: ansiColorTuple) {
        this.ansiBg = color;
        if (color) {
            this.setBgColorId(color[0] + "-" + color[1]);
        } else {
            this.setBgColorId(null);
        }
    }

    private handleXtermEscape(color_code: number, is_bg: boolean ) {
        if (is_bg) {
            this.ansiBg = null;
            this.setBgColorId(color_code.toString());
        } else {
            this.ansiFg = null;
            this.setFgColorId(color_code.toString());
        }
    }

    /* handles graphics mode codes http://ascii-table.com/ansi-escape-sequences.php*/
    public handleAnsiGraphicCodes(codes: Array<string>) {
        /* Special case XTERM 256 color format */
        if (codes.length === 3)
        {
            if (codes[0] === "38" && codes[1] === "5") {
                this.handleXtermEscape(parseInt(codes[2]), false);
                return;
            } else if (codes[0] === "48" && codes[1] === "5") {
                this.handleXtermEscape(parseInt(codes[2]), true);
                return;
            }
        }

        /* Standard ANSI color sequence */
        let new_fg: ansiColorTuple;
        let new_bg: ansiColorTuple;

        for (let i = 0; i < codes.length; i++) {

            let code = parseInt(codes[i]);

            /* all off */
            if (code === 0) {
                new_fg = null;
                new_bg = null;
                this.ansiReverse = false;
                this.ansiBold = false;
                continue;
            }

            /* bold on */
            if (code === 1) {
                this.ansiBold = true;

                // On the chance that we have xterm colors, just ignore bold
                if (new_fg || this.ansiFg || !this.fgColorId) {
                    new_fg = new_fg || this.ansiFg || copyAnsiColorTuple(this.defaultAnsiFg);
                    new_fg[1] = "high";
                }
                continue;
            }

            /* reverse */
            if (code === 7) {
                /* TODO: handle xterm reversing */
                this.ansiReverse = !this.ansiReverse;
                this.pushFgColorIdToTarget();
                this.pushBgColorIdToTarget();
                continue;
            }

            /* foreground colors */
            if (code >= 30 && code <= 37) {
                let color_name = ansiFgLookup[code];
                new_fg = new_fg || copyAnsiColorTuple(this.defaultAnsiFg);
                new_fg[0] = color_name;
                if (this.ansiBold) {
                    new_fg[1] = "high";
                }
                continue;
            }

            /* background colors */
            if (code >= 40 && code <= 47) {
                let color_name = ansiBgLookup[code];
                new_bg = new_bg || copyAnsiColorTuple(this.defaultAnsiBg);
                new_bg[0] = color_name;
                continue;
            }

            /* Default foreground color */
            if (code === 39) {
                new_fg = null;
                continue;
            }

            /* Normal color or intensity */
            if (code === 22) {
                this.ansiBold = false;
                if (!new_fg) {
                    if (this.ansiFg) {
                        new_fg = copyAnsiColorTuple(this.ansiFg);
                    } else {
                        new_fg = copyAnsiColorTuple(this.defaultAnsiFg);
                    }
                }
                new_fg[1] = "low";
                continue;
            }

            console.log("Unsupported ANSI code:", code);
        }

        if (new_fg !== undefined) {
            this.setAnsiFg(new_fg);
        }
        if (new_bg !== undefined) {
            this.setAnsiBg(new_bg);
        }
    }

    private setDefaultAnsiFg(colorName: ansiName, level: ansiLevel) {
        // if ( !(colorName in ansiColors) ) {
        //     console.log("Invalid colorName: " + colorName);
        //     return;
        // }

        if ( (["low", "high"]).indexOf(level) === -1) {
            console.log("Invalid level: " + level);
            return;
        }

        this.defaultAnsiFg = [colorName, level];
        this.defaultFgId = colorName + "-" + level;
        $(".outputText").css("color", colorIdToHtml[this.defaultFgId]);
    }

    private setDefaultAnsiBg(colorName: ansiName, level: ansiLevel) {
        // if ( !(colorName in ansiColors) ) {
        //     console.log("Invalid colorName: " + colorName);
        //     return;
        // }

        if ( (["low", "high"]).indexOf(level) === -1) {
            console.log("Invalid level: " + level);
            return;
        }

        this.defaultAnsiBg = [colorName, level];
        this.defaultBgId = colorName + "-" + level;
        $(".outputText").css("background-color", colorIdToHtml[this.defaultBgId]);
    }

    handleChangeDefaultColor(name: string, level: string) {
        this.setDefaultAnsiFg(<ansiName>name, <ansiLevel>level);
        this.saveColorCfg();
    }

    handleChangeDefaultBgColor(name: string, level: string) {
        this.setDefaultAnsiBg(<ansiName>name, <ansiLevel>level);
        this.saveColorCfg();
    }

    private saveColorCfg() {
        UserConfig.set("defaultAnsiFg", this.defaultAnsiFg);
        UserConfig.set("defaultAnsiBg", this.defaultAnsiBg);
    }
}
