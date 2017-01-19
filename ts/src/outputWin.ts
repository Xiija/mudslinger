import {Message} from "./message";
import {OutWinBase} from "./outWinBase";
import {TriggerManager} from "./triggerManager";
import * as Util from "./util";

declare let $;

export class OutputWin extends OutWinBase {
    private pMessage: Message;
    private pTriggerManager: TriggerManager;
    private html;

    constructor(pMessage: Message, pTriggerManager: TriggerManager) {
        super();

        this.pMessage = pMessage;
        this.pTriggerManager = pTriggerManager;

        this.pMessage.sub("prepare_reload_layout", this.prepare_reload_layout, this);
        this.pMessage.sub("load_layout", this.load_layout, this);
        this.pMessage.sub("telnet_connect", this.handle_telnet_connect, this);
        this.pMessage.sub("telnet_disconnect", this.handle_telnet_disconnect, this);
        this.pMessage.sub("telnet_error", this.handle_telnet_error, this);
        this.pMessage.sub("ws_error", this.handle_ws_error, this);
        this.pMessage.sub("ws_connect", this.handle_ws_connect, this);
        this.pMessage.sub("ws_disconnect", this.handle_ws_disconnect, this);
        this.pMessage.sub("send_command", this.handle_send_command, this);
        this.pMessage.sub("script_send_command", this.handle_script_send_command, this);
        this.pMessage.sub("send_pw", this.handle_send_pw, this);
        this.pMessage.sub("trigger_send_commands", this.handle_trigger_send_commands, this);
        this.pMessage.sub("alias_send_commands", this.handle_alias_send_commands, this);
        this.pMessage.sub("script_print", this.handle_script_print, this);
        this.pMessage.sub("script_eval_error", this.handle_script_eval_error, this);
        this.pMessage.sub("script_exec_error", this.handle_script_exec_error, this);

        $(document).ready(() => {
            window.onerror = this.handle_window_error;
        });
    }

    private prepare_reload_layout() {
        this.html = $("#win_output").html();
    }

    private load_layout() {
        this.set_root_elem($("#win_output"));
        if (this.html) {
            // it"s a reload
            $("#win_output").html(this.html);
            this.scroll_bottom(true);
            this.html = null;
        }
    }

    private handle_script_print(msg) {
        let message = msg.data;
        let output = JSON.stringify(message);
        this.target.append(
            "<span style=\"color:orange\">"
            + Util.raw_to_html(output)
            + "<br>"
            + "</span>");
        this.scroll_bottom(true);
    };

    private handle_send_pw(msg) {
        // let stars = ("*".repeat(msg.data.length);
        let stars = Array(msg.data.length + 1).join("*");

        this.target.append(
            "<span style=\"color:yellow\">"
            + stars
            + "<br>"
            + "</span>");
        this.scroll_bottom(true);
    };

    private handle_send_command(msg) {
        if (msg.no_print) {
            return;
        }
        let cmd = msg.data;
        this.target.append(
            "<span style=\"color:yellow\">"
            + Util.raw_to_html(cmd)
            + "<br>"
            + "</span>");
        this.scroll_bottom(true);
    };

    private handle_script_send_command(msg) {
        if (msg.no_print) {
            return;
        }
        let cmd = msg.data;
        this.target.append(
            "<span style=\"color:cyan\">"
            + Util.raw_to_html(cmd)
            + "<br>"
            + "</span>");
        this.scroll_bottom(true);
    };

    private handle_trigger_send_commands(msg) {
        let html = "<span style=\"color:cyan\">";

        for (let i = 0; i < msg.cmds.length; i++) {
            if (i >= 5) {
                html += "...<br>";
                break;
            } else {
                html += Util.raw_to_html(msg.cmds[i]) + "<br>";
            }
        }
        this.target.append(html);
        this.scroll_bottom(false);
    };

    private handle_alias_send_commands(msg) {
        let html = "<span style=\"color:yellow\">";
        html += Util.raw_to_html(msg.orig);
        html += "</span><span style=\"color:cyan\"> --> ";

        for (let i = 0; i < msg.cmds.length; i++) {
            if (i >= 5) {
                html += "...<br>";
                break;
            } else {
                html += Util.raw_to_html(msg.cmds[i]) + "<br>";
            }
        }

        this.target.append(html);
        this.scroll_bottom(true);
    };

    private handle_telnet_connect(msg) {
        this.target.append(
            "<span style=\"color:cyan\">"
            + "[[Telnet connected]]"
            + "<br>"
            + "</span>");
        this.scroll_bottom(true);
    };
    private handle_telnet_disconnect(msg) {
        this.target.append(
            "<span style=\"color:cyan\">"
            + "[[Telnet disconnected]]"
            + "<br>"
            + "</span>");
        this.scroll_bottom(true);
    };
    private handle_ws_connect(msg) {
        this.target.append(
            "<span style=\"color:cyan\">"
            + "[[Websocket connected]]"
            + "<br>"
            + "</span>");
        this.scroll_bottom(false);
    };

    private handle_ws_disconnect(msg) {
        this.target.append(
            "<span style=\"color:cyan\">"
            + "[[Websocket disconnected]]"
            + "<br>"
            + "</span>");
        this.scroll_bottom(false);
    };

    private handle_telnet_error(msg) {
        this.target.append(
            "<span style=\"color:red\">"
            + "[[Telnet error" + "<br>"
            + msg.data + "<br>"
            + "]]"
            + "<br>"
            + "</span>");
        this.scroll_bottom(true);
    };

    private handle_ws_error(msg) {
        this.target.append(
            "<span style=\"color:red\">"
            + "[[Websocket error]]"
            + "<br>"
            + "</span>");
        this.scroll_bottom(true);
    };

    private handle_window_error(message, source, lineno, colno, error) {
        this.target.append(
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
        this.scroll_bottom(true);
    };

    private handle_script_eval_error(msg) {
        let err = msg.data;
        let stack = Util.raw_to_html(err.stack);

        this.target.append(
            "<span style=\"color:red\">"
            + "[[Script eval error<br>"
            + stack + "<br>"
            + "]]"
            + "<br>"
            + "</span>"
        );
        this.scroll_bottom(true);
    };

    private handle_script_exec_error(msg) {
        let err = msg.data;
        let stack = Util.raw_to_html(err.stack);

        this.target.append(
            "<span style=\"color:red\">"
            + "[[Script execution error<br>"
            + stack + "<br>"
            + "]]"
            + "<br>"
            + "</span>"
        );
        this.scroll_bottom(true);
    };

    protected handle_line(line) {
        this.pTriggerManager.handle_line(line);
    };

}
