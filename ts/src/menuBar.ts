import {Client} from "./client";
import {Message} from "./message";
import {Socket} from "./socket";
import {AliasEditor} from "./aliasEditor";
import {TriggerEditor} from "./triggerEditor";
import {JsScriptWin} from "./jsScriptWin";

declare let $;

export class MenuBar {
    private pMessage: Message;
    private pClient: Client;
    private pSocket: Socket;
    private pAliasEditor: AliasEditor;
    private pTriggerEditor: TriggerEditor;
    private pJsScriptWin: JsScriptWin;

    constructor(pMessage: Message, pClient: Client, pSocket: Socket, pAliasEditor: AliasEditor, pTriggerEditor: TriggerEditor, pJsScriptWin: JsScriptWin) {
        this.pMessage = pMessage;
        this.pClient = pClient;
        this.pSocket = pSocket;
        this.pAliasEditor = pAliasEditor;
        this.pTriggerEditor = pTriggerEditor;
        this.pJsScriptWin = pJsScriptWin;

        this.make_click_funcs();

        this.pMessage.sub("prepare_reload_layout", this.prepare_reload_layout, this);
        this.pMessage.sub("load_layout", this.load_layout, this);
    }

    private prepare_reload_layout() {
        // nada
    }

    private load_layout() {
        $("#menu_bar").jqxMenu({ width: "100%", height: "4%"});
        $("#menu_bar").on("itemclick", this.handle_click);

        let o = this;
        $("#chk_enable_trig").change(function() {
            o.pMessage.pub("set_triggers_enabled", this.checked);
        });

        $("#chk_enable_alias").change(function() {
            o.pMessage.pub("set_aliases_enabled", this.checked);
        });
    };

    private click_funcs = {};
    private make_click_funcs() {
        this.click_funcs["Reload Layout"] = () => {
            this.pClient.reload_layout();
        };

        this.click_funcs["Connect"] = () => {
            this.pSocket.open_telnet();
        };

        this.click_funcs["Disconnect"] = () => {
            this.pSocket.close_telnet();
        };

        this.click_funcs["Aliases"] = () => {
            this.pAliasEditor.show();
        };

        this.click_funcs["Triggers"] = () => {
            this.pTriggerEditor.show();
        };

        this.click_funcs["Green"] = () => {
            this.pMessage.pub("change_default_color", "green");
        };

        this.click_funcs["White"] = () => {
            this.pMessage.pub("change_default_color", "white");
        };

        this.click_funcs["Script"] = () => {
            this.pJsScriptWin.show();
        };
    }

    private handle_click(event) {
        let item = event.args;
        let text = $(item).text();
        if (text in this.click_funcs) {
            this.click_funcs[text]();
        }
    };
}
