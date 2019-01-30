import { GlEvent, GlDef, EventHook } from "./event";

import {AliasManager} from "./aliasManager";

export class CommandInput {
    public EvtEmitCmd = new EventHook<string>();

    private cmd_history: string[] = [];
    private cmd_index: number = -1;
    private cmd_entered: string = "";

    private $cmdInput: JQuery;
    private $cmdInputPw: JQuery;

    private chkCmdStack: HTMLInputElement;

    constructor(private aliasManager: AliasManager) {
        this.$cmdInput = $("#cmdInput");
        this.$cmdInputPw = $("#cmdInputPw");

        this.chkCmdStack = $("#chkCmdStack")[0] as HTMLInputElement;

        this.$cmdInput.keydown((event: KeyboardEvent) => { return this.keydown(event); });
        this.$cmdInput.bind("input propertychange", () => { return this.inputChange(); });
        this.$cmdInputPw.keydown((event: KeyboardEvent) => { return this.pwKeydown(event); });

        $(document).ready(() => {
            this.loadHistory();
            this.inputChange(); // Force a resize
        });
    }

    private echo: boolean = true;
    setEcho(value: boolean): void {
        this.echo = value;

        if (this.echo) {
            this.$cmdInputPw.hide();
            this.$cmdInput.show();
            this.$cmdInput.val("");
            this.inputChange();
            this.$cmdInput.focus();
        } else {
            this.$cmdInput.hide();
            this.$cmdInputPw.show();
            this.$cmdInputPw.focus();

            let current = this.$cmdInput.val();
            if (this.cmd_history.length > 0
                && current !== this.cmd_history[this.cmd_history.length - 1]) {
                /* If they already started typing password before getting echo command*/
                this.$cmdInputPw.val(current);
                (<HTMLInputElement>this.$cmdInputPw[0]).setSelectionRange(current.length, current.length);
            } else {
                this.$cmdInputPw.val("");
            }
        }
    }

    handleTelnetConnect(): void {
        this.setEcho(true);
    }

    private sendPw(): void {
        let pw = this.$cmdInputPw.val();
        GlEvent.sendPw.fire(pw);
    }

    private sendCmd(): void {
        let cmd: string = this.$cmdInput.val();
        let result = this.aliasManager.checkAlias(cmd);
        if (!result) {
            if (this.chkCmdStack.checked) {
                let cmds = cmd.split(";");
                for (let i = 0; i < cmds.length; i++) {
                    this.EvtEmitCmd.fire(cmds[i]);
                }
            } else {
                this.EvtEmitCmd.fire(cmd);
            }
        } else if (result !== true) {
            let cmds: string[] = [];
            let lines: string[] = (<string>result).replace("\r", "").split("\n");
            for (let i = 0; i < lines.length; i++) {
                cmds = cmds.concat(lines[i].split(";"));
            }
            GlEvent.aliasSendCommands.fire({orig: cmd, commands: cmds});
        } /* else the script ran already */

        this.$cmdInput.select();

        if (cmd.trim() === "") {
            return;
        }
        if (this.cmd_history.length > 0
            && cmd === this.cmd_history[this.cmd_history.length - 1]) {
            return;
        }

        if (this.echo) {
            this.cmd_history.push(cmd);
            this.cmd_history = this.cmd_history.slice(-20);
            this.saveHistory();
        }
        else {
            this.$cmdInput.val("");
            this.inputChange();
        }
        this.cmd_index = -1;
    };

    private pwKeydown(event: KeyboardEvent): boolean {
        switch (event.which) {
            case 13: // enter
                this.sendPw();
                this.$cmdInputPw.val("");
                return false;
            default:
                return true;
        }
    }

    private keydown(event: KeyboardEvent): boolean {
        switch (event.which) {
            case 13: // enter
                if (event.shiftKey) {
                    return true;
                } else {
                    this.sendCmd();
                    return false;
                }
            case 38: // up
                if (this.cmd_index === -1) {
                    this.cmd_entered = this.$cmdInput.val();
                    this.cmd_index = this.cmd_history.length - 1;
                } else {
                    this.cmd_index -= 1;
                    this.cmd_index = Math.max(this.cmd_index, 0);
                }
                this.$cmdInput.val(this.cmd_history[this.cmd_index]);
                this.inputChange();
                this.$cmdInput.select();
                return false;
            case 40: // down
                if (this.cmd_index === -1) {
                    break;
                }

                if (this.cmd_index === (this.cmd_history.length - 1)) {
                    // Already at latest, grab entered but unsent value
                    this.cmd_index = -1;
                    this.$cmdInput.val(this.cmd_entered);
                } else {
                    this.cmd_index += 1;
                    this.$cmdInput.val(this.cmd_history[this.cmd_index]);
                }
                this.$cmdInput.val(this.cmd_history[this.cmd_index]);
                this.inputChange();
                this.$cmdInput.select();
                return false;
            case 97:
                this.$cmdInput.val("southwest");
                this.sendCmd();
                return false;
            case 98:
                this.$cmdInput.val("south");
                this.sendCmd()
                return false;
            case 99:
                this.$cmdInput.val("southeast");
                this.sendCmd();
                return false;
            case 100:
                this.$cmdInput.val("west");
                this.sendCmd();
                return false;
            case 101:
                this.$cmdInput.val("look");
                this.sendCmd();
                return false;
            case 102:
                this.$cmdInput.val("east");
                this.sendCmd();
                return false;
            case 103:
                this.$cmdInput.val("northwest");
                this.sendCmd();
                return false;
            case 104:
                this.$cmdInput.val("north");
                this.sendCmd();
                return false;
            case 105:
                this.$cmdInput.val("northeast");
                this.sendCmd();
                return false;
            case 107:
                this.$cmdInput.val("down");
                this.sendCmd();
                return false;
            case 109:
                this.$cmdInput.val("up");
                this.sendCmd();
                return false;
            default:
                this.cmd_index = -1;
                return true;
        }
        return false;
    }

    private inputChange(): void {
        let input = this.$cmdInput;
        input.height("1px");
        let scrollHeight = Math.max(input[0].scrollHeight, 20);
        let new_height = scrollHeight;
        input.height(new_height + "px");
    }

    private saveHistory(): void {
        localStorage.setItem("cmd_history", JSON.stringify(this.cmd_history));
    }

    private loadHistory(): void {
        let cmds = localStorage.getItem("cmd_history");
        if (cmds) {
            this.cmd_history = JSON.parse(cmds);
        }
    }
}
