import { GlEvent, GlDef } from "./event";

import { OutWinBase } from "./outWinBase";
import { TriggerManager } from "./triggerManager";
import * as Util from "./util";

export class OutputWin extends OutWinBase {
    constructor(private triggerManager: TriggerManager) {
        super($("#winOutput"));

        GlEvent.wsDisconnect.handle(this.handleWsDisconnect, this);

        $(document).ready(() => {
            window.onerror = this.handleWindowError.bind(this);
        });
    }

    handleScriptPrint(data: string) {
        let message = data;
        let output = JSON.stringify(message);
        this.$target.append(
            "<span style=\"color:orange\">"
            + Util.rawToHtml(output)
            + "<br>"
            + "</span>");
        this.scrollBottom(true);
    }

    echoStars(count: number) {
        let stars = Array(count + 1).join("*");

        this.$target.append(
            "<span style=\"color:yellow\">"
            + stars
            + "<br>"
            + "</span>");
        this.scrollBottom(true);
    }

    handleSendCommand(cmd: string) {
        this.$target.append(
            "<span style=\"color:yellow\">"
            + Util.rawToHtml(cmd)
            + "<br>"
            + "</span>");
        this.scrollBottom(true);
    }

    handleScriptSendCommand(cmd: string) {
        this.$target.append(
            "<span style=\"color:cyan\">"
            + Util.rawToHtml(cmd)
            + "<br>"
            + "</span>");
        this.scrollBottom(true);
    }

    handleTriggerSendCommands(data: string[]) {
        let html = "<span style=\"color:cyan\">";

        for (let i = 0; i < data.length; i++) {
            if (i >= 5) {
                html += "...<br>";
                break;
            } else {
                html += Util.rawToHtml(data[i]) + "<br>";
            }
        }
        this.$target.append(html);
        this.scrollBottom(false);
    }

    handleAliasSendCommands(orig: string, cmds: string[]) {
        let html = "<span style=\"color:yellow\">";
        html += Util.rawToHtml(orig);
        html += "</span><span style=\"color:cyan\"> --> ";

        for (let i = 0; i < cmds.length; i++) {
            if (i >= 5) {
                html += "...<br>";
                break;
            } else {
                html += Util.rawToHtml(cmds[i]) + "<br>";
            }
        }

        this.$target.append(html);
        this.scrollBottom(true);
    }

    handleTelnetConnect(): void {
        this.$target.append(
            "<span style=\"color:cyan\">"
            + "[[Telnet connected]]"
            + "<br>"
            + "</span>");
        this.scrollBottom(true);
    }

    handleTelnetDisconnect() {
        this.$target.append(
            "<span style=\"color:cyan\">"
            + "[[Telnet disconnected]]"
            + "<br>"
            + "</span>");
        this.scrollBottom(true);
    }

    handleWsConnect() {
        this.$target.append(
            "<span style=\"color:cyan\">"
            + "[[Websocket connected]]"
            + "<br>"
            + "</span>");
        this.scrollBottom(false);
    }

    private handleWsDisconnect() {
        this.$target.append(
            "<span style=\"color:cyan\">"
            + "[[Websocket disconnected]]"
            + "<br>"
            + "</span>");
        this.scrollBottom(false);
    }

    handleTelnetError(data: string) {
        this.$target.append(
            "<span style=\"color:red\">"
            + "[[Telnet error" + "<br>"
            + data + "<br>"
            + "]]"
            + "<br>"
            + "</span>");
        this.scrollBottom(true);
    }

    handleWsError() {
        this.$target.append(
            "<span style=\"color:red\">"
            + "[[Websocket error]]"
            + "<br>"
            + "</span>");
        this.scrollBottom(true);
    }

    private handleWindowError(message: any, source: any, lineno: any, colno: any, error: any) {
        this.$target.append(
            "<span style=\"color:red\">"
            + "[[Web Client Error<br>"
            + message + "<br>"
            + source + "<br>"
            + lineno + "<br>"
            + colno + "<br>"
            + "]]"
            + "<br>"
            + "</span>"
        );
        this.scrollBottom(true);
    }

    handleScriptEvalError(data: {stack: any}) {
        let stack = Util.rawToHtml(data.stack);

        this.$target.append(
            "<span style=\"color:red\">"
            + "[[Script eval error<br>"
            + stack + "<br>"
            + "]]"
            + "<br>"
            + "</span>"
        );
        this.scrollBottom(true);
    }

    protected handleLine(line: string) {
        this.triggerManager.handleLine(line);
    }
}
