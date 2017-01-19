import {AffWin} from "./affWin";
import {AliasEditor} from "./aliasEditor";
import {AliasManager} from "./aliasManager";
import {ChatWin} from "./chatWin";
import {CommandInput} from "./commandInput";
import {GaugeWin} from "./gaugeWin";
import {JsScript} from "./jsScript";
import {JsScriptWin} from "./jsScriptWin";
import {MapWin} from "./mapWin";
import {MenuBar} from "./menuBar";
import {Message} from "./message";
import {Mxp} from "./mxp";
import {OutputManager} from "./outputManager";
import {OutputWin} from "./outputWin";
import {Socket} from "./socket";
import {StatWin} from "./statWin";
import {TriggerEditor} from "./triggerEditor";
import {TriggerManager} from "./triggerManager";

declare let $;

export class Client {
    private pAffWin: AffWin;
    private pAliasEditor: AliasEditor;
    private pAliasManager: AliasManager;
    private pChatWin: ChatWin;
    private pCommandInput: CommandInput;
    private pGaugeWin: GaugeWin;
    private pJsScript: JsScript;
    private pJsScriptWin: JsScriptWin;
    private pMapWin: MapWin;
    private pMenuBar: MenuBar;
    private pMessage: Message;
    private pMxp: Mxp;
    private pOutputManager: OutputManager;
    private pOutputWin: OutputWin;
    private pSocket: Socket;
    private pStatWin: StatWin;
    private pTriggerEditor: TriggerEditor;
    private pTriggerManager: TriggerManager;

    constructor() {
        this.pMessage = new Message();
        this.pAffWin = new AffWin(this.pMessage);
        this.pJsScript = new JsScript(this.pMessage);
        this.pChatWin = new ChatWin(this.pMessage);
        this.pGaugeWin = new GaugeWin(this.pMessage);
        this.pMapWin = new MapWin(this.pMessage);
        this.pStatWin = new StatWin(this.pMessage);

        this.pJsScriptWin = new JsScriptWin(this.pJsScript);
        this.pTriggerManager = new TriggerManager(this.pMessage, this.pJsScript);
        this.pAliasManager = new AliasManager(this.pMessage, this.pJsScript);

        this.pCommandInput = new CommandInput(this.pMessage, this.pAliasManager);

        this.pOutputWin = new OutputWin(this.pMessage, this.pTriggerManager);

        this.pAliasEditor = new AliasEditor(this.pAliasManager);
        this.pTriggerEditor = new TriggerEditor(this.pTriggerManager);

        this.pOutputManager = new OutputManager(this.pMessage, this.pOutputWin);

        this.pMxp = new Mxp(this.pMessage, this.pOutputManager, this.pChatWin);
        this.pSocket = new Socket(this.pMessage, this.pOutputManager, this.pMxp);
        this.pMenuBar = new MenuBar(this.pMessage, this, this.pSocket, this.pAliasEditor, this.pTriggerEditor, this.pJsScriptWin);

        $(document).ready(() => {
            this.pSocket.open();
            this.pSocket.open_telnet();

        //    $(window).resize(Client.reload_layout);
            this.load_layout();
        });

        // Prevent navigating away accidentally
        window.onbeforeunload = () => {
            return "";
        };
    }

    private html_base;

    private load_layout() {
        // If it"s the first load, grab the base html so we can
        // use it for reloads
        if (!this.html_base) {
            this.html_base = $("#client").html();
//            console.log(html_base);
        } else {
            // it"s a reload
            $("#client").html(this.html_base);
        };

        // do the high level layout
        $("#main_vert_split").jqxSplitter({
            width: "100%",
            height: "100%",
            orientation: "vertical",
            panels: [{size: "75%"}, {size: "25%"}]
        });

        // let the other guys do their thing
        this.pMessage.pub("load_layout", null);

    }

    public reload_layout() {
        // Let the other guys prepare
        this.pMessage.pub("prepare_reload_layout", {});
        this.load_layout();
    }
}
