import { GlEvent, GlDef } from "./event";

import * as io from "socket.io-client";
import { Mxp } from "./mxp";
import { OutputManager } from "./outputManager";
import { IoEvent } from "../shared/ioevent";
import { TelnetClient } from "./telnetClient";
import { utf8decode, utf8encode } from "./util";
import { UserConfig } from "./userConfig";


declare let configClient: any;


export class Socket {
    private ioConn: SocketIOClient.Socket;
    private ioEvt: IoEvent;
    private telnetClient: TelnetClient;
    private clientIp: string;
    private utf8Enabled: boolean;

    constructor(private outputManager: OutputManager, private mxp: Mxp) {
        GlEvent.sendCommand.handle(this.handleSendCommand, this);
        GlEvent.scriptSendCommand.handle(this.handleSendCommand, this);
        GlEvent.sendPw.handle(this.handleSendPw, this);
        GlEvent.triggerSendCommands.handle(this.handleTriggerSendCommands, this);
        GlEvent.aliasSendCommands.handle(this.handleAliasSendCommands, this);

        this.utf8Enabled = UserConfig.get("utf8Enabled");

        GlEvent.setUtf8Enabled.handle((val) => { this.utf8Enabled = val; }, this);
    }

    public open() {
        this.ioConn = io.connect(
            "http://" +
            (configClient.socketIoHost || document.domain) +
            ":" +
            (configClient.socketIoPort || location.port) +
            "/telnet");

        this.ioConn.on("connect", () => {
            GlEvent.wsConnect.fire(null);
        });

        this.ioConn.on("disconnect", () => {
            GlEvent.wsDisconnect.fire(null);
        });

        this.ioConn.on("error", (msg: any) => {
            GlEvent.wsError.fire(msg);
        });

        this.ioEvt = new IoEvent(this.ioConn);

        this.ioEvt.srvTelnetOpened.handle(() => {
            this.telnetClient = new TelnetClient((data) => {
                this.ioEvt.clReqTelnetWrite.fire(data);
            });
            this.telnetClient.clientIp = this.clientIp;

            this.telnetClient.EvtData.handle((data) => {
                this.handleTelnetData(data);
            });

            this.telnetClient.EvtServerEcho.handle((data) => {
                // Server echo ON means we should have local echo OFF
                GlEvent.setEcho.fire(!data);
            });

            GlEvent.telnetConnect.fire(null);
        });

        this.ioEvt.srvTelnetClosed.handle(() => {
            this.telnetClient = null;
            GlEvent.telnetDisconnect.fire(null);
        });

        this.ioEvt.srvTelnetError.handle((data) => {
            GlEvent.telnetError.fire(data);
        });

        this.ioEvt.srvTelnetData.handle((data) => {
            if (this.telnetClient) {
                this.telnetClient.handleData(data);
            }
        });

        this.ioEvt.srvSetClientIp.handle((ipAddr: string) => {
            let re = /::ffff:(\d+\.\d+\.\d+\.\d+)/;
            let match = re.exec(ipAddr);
            if (match) {
                ipAddr = match[1];
            }

            this.clientIp = ipAddr;
            if (this.telnetClient) {
                this.telnetClient.clientIp = ipAddr;
            }
        });
    }

    public openTelnet(host: string, port: number) {
        this.ioEvt.clReqTelnetOpen.fire([host, port]);
    }

    public closeTelnet() {
        this.ioEvt.clReqTelnetClose.fire(null);
    }

    private sendCmd(cmd: string) {
        cmd += "\r\n";
        let arr: Uint8Array;
        if (this.utf8Enabled) {
            arr = utf8encode(cmd);
        } else {
            arr = new Uint8Array(cmd.length);
            for (let i = 0; i < cmd.length; i++) {
                arr[i] = cmd.charCodeAt(i);
            }
        }
        
        this.ioEvt.clReqTelnetWrite.fire(arr.buffer);
    }

    private handleSendCommand(data: GlDef.SendCommandData) {
        this.sendCmd(data.value);
    }

    private handleSendPw(data: GlDef.SendPwData) {
        this.sendCmd(data);
    }

    private handleTriggerSendCommands(data: GlDef.TriggerSendCommandsData) {
        for (let i = 0; i < data.length; i++) {
            this.sendCmd(data[i]);
        }
    };

    private handleAliasSendCommands(data: GlDef.AliasSendCommandsData) {
        for (let i = 0; i < data.commands.length; i++) {
            this.sendCmd(data.commands[i]);
        }
    };


    private partialUtf8: Uint8Array;
    private partialSeq: string;
    private handleTelnetData(data: ArrayBuffer) {
        // console.timeEnd("command_resp");
        // console.time("_handle_telnet_data");

        let rx = this.partialSeq || "";
        this.partialSeq = null;

        if (this.utf8Enabled) {
            let utf8Data: Uint8Array;
            if (this.partialUtf8) {
                utf8Data = new Uint8Array(data.byteLength + this.partialUtf8.length);
                utf8Data.set(this.partialUtf8, 0);
                utf8Data.set(new Uint8Array(data), this.partialUtf8.length);
                this.partialUtf8 = null;
            } else {
                utf8Data = new Uint8Array(data);
            }

            let result = utf8decode(utf8Data);
            this.partialUtf8 = result.partial;
            rx += result.result;
        } else {
            rx += String.fromCharCode.apply(String, new Uint8Array(data));
        }

        let output = "";
        let rx_len = rx.length;
        let max_i = rx.length - 1;

        for (let i = 0; i < rx_len; ) {
            let char = rx[i];

            /* strip carriage returns while we"re at it */
            if (char === "\r") {
                i++; continue;
            }

            /* Always snip at a newline so other modules can more easily handle logic based on line boundaries */
            if (char === "\n") {
                output += char;
                i++;

                this.outputManager.handleText(output);
                output = "";

                // MXP needs to force close any open tags on newline
                this.mxp.handleNewline();

                continue;
            }

            if (char !== "\x1b") {
                output += char;
                i++;
                continue;
            }

            /* so we have an escape sequence ... */
            /* we only expect these to be color codes or MXP tags */
            let substr = rx.slice(i);
            let re;
            let match;

            /* ansi default, equivalent to [0m */
            re = /^\x1b\[m/;
            match = re.exec(substr);
            if (match) {
                this.outputManager.handleText(output);
                output = "";

                i += match[0].length;
                this.outputManager.handleAnsiGraphicCodes(["0"]);
                continue;
            }

            /* ansi escapes (including 256 color) */
            re = /^\x1b\[([0-9]+(?:;[0-9]+)*)m/;
            match = re.exec(substr);
            if (match) {
                this.outputManager.handleText(output);
                output = "";

                i += match[0].length;
                let codes = match[1].split(";");
                this.outputManager.handleAnsiGraphicCodes(codes);
                continue;
            }

            /* MXP escapes */
            re = /^\x1b\[1z(<.*?>)\x1b\[7z/;
            match = re.exec(substr);
            if (match) {
                // MXP tag. no discerning what it is or if it"s opening/closing tag here
                i += match[0].length;
                this.outputManager.handleText(output);
                output = "";
                GlEvent.mxpTag.fire(match[1]);
                continue;
            }

            re = /^\x1b\[7z/;
            match = re.exec(substr);
            if (match) {
                /* this gets sent once at the beginning to set the line mode. We don"t need to do anything with it */
                i += match[0].length;
                continue;
            }

            /* need to account for malformed or unsupported tags or sequences somehow... so treat start of another sequence and new lines as boundaries */
            let esc_ind = substr.slice(1).indexOf("\x1b");
            let nl_ind = substr.indexOf("\n");
            let bound_ind = null;

            /* Use whichever boundary appears first */
            if (esc_ind !== -1) {
                bound_ind = esc_ind;
            }
            if (nl_ind !== -1) {
                bound_ind = (bound_ind === null) ? nl_ind : Math.min(bound_ind, nl_ind);
            }

            if (bound_ind !== null) {
                let bad_stuff = substr.slice(0, bound_ind + 1);
                i += bad_stuff.length;
                console.log("Malformed sequence or tag");
                console.log(bad_stuff);
                continue;
            }

            /* If we get here, must be a partial sequence
                Send away everything up to the sequence start and assume it will get completed next time
                we receive data...
             */
            if (i !== 0) {
                this.outputManager.handleText(output);
            }
            this.partialSeq = rx.slice(i);
            console.log("Got partial:");
            console.log(this.partialSeq);
            break;
        }
        if (!this.partialSeq) {
            /* if partial we already outputed, if not let"s hit it */
            this.outputManager.handleText(output);
        }
        this.outputManager.outputDone();
        // console.timeEnd("_handle_telnet_data");
    }
}
