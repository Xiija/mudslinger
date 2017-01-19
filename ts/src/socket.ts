import {Message, MsgDef} from "./message";
import {Mxp} from './mxp';
import {OutputManager} from './outputManager';

declare let io: any; // socketio

export class Socket {
    private _socket;
    private pMessage: Message;
    private pOutputManager: OutputManager;
    private pMxp: Mxp;

    constructor(pMessage: Message, pOutputManager: OutputManager, pMxp: Mxp) {
        this.pMessage = pMessage;
        this.pOutputManager = pOutputManager;
        this.pMxp = pMxp;

        this.pMessage.sub('send_command', this.handle_send_command, this);
        this.pMessage.sub('script_send_command', this.handle_send_command, this);
        this.pMessage.sub('send_pw', this.handle_send_command, this);
        this.pMessage.sub('trigger_send_commands', this.handle_trigger_send_commands, this);
        this.pMessage.sub('alias_send_commands', this.handle_alias_send_commands, this);
    }

    public open() {
        let o = this;

        this._socket = io.connect('http://' + document.domain + ':' + location.port + '/telnet');

        this._socket.on('connect', (msg) => {
            this.pMessage.pub('ws_connect', {});
        });

        this._socket.on('disconnect', (msg) => {
            this.pMessage.pub('ws_disconnect', {});
        });

        this._socket.on('server_echo', (msg) => {
            /* server echo true means we should NOT echo */
            this.pMessage.pub('set_echo', {value: !msg.data});
        });

        this._socket.on("telnet_connect", (msg) => {
            this.pMessage.pub('telnet_connect', msg);
        });

        this._socket.on("telnet_disconnect", (msg) => {
            this.pMessage.pub('telnet_disconnect', msg);
        });

        this._socket.on("telnet_error", (msg) => {
            this.pMessage.pub('telnet_error', msg);
        });

        this._socket.on("msdp_var", (msg: MsgDef.msdp_var) => {
            this.pMessage.pub('msdp_var', msg);
        });

        this._socket.on("telnet_data", (data) => {
            this._handle_telnet_data(data);
        });

        this._socket.onerror = (msg) => {
            this.pMessage.pub("ws_error", msg);
        };
    };

    public open_telnet() {
        this._socket.emit("open_telnet", {});
    };

    public close_telnet() {
        this._socket.emit("close_telnet", {});
    };

    private handle_send_command(msg) {
        console.time('send_command');
        console.time('command_resp');
        this._socket.emit("send_command", msg, () => {
            console.timeEnd('send_command');
        });
    };

    private handle_trigger_send_commands(msg) {
        for (var i=0; i < msg.cmds.length; i++) {
            this._socket.emit("send_command", {data: msg.cmds[i]});
        }
    };

    private handle_alias_send_commands(msg) {
        for (var i=0; i < msg.cmds.length; i++) {
            this._socket.emit("send_command", {data: msg.cmds[i]});
        }
    };

    private partial_seq;
    private _handle_telnet_data(msg) {
        console.timeEnd('command_resp');
        console.time("_handle_telnet_data");

        var rx = this.partial_seq || '';
        this.partial_seq = null;
        rx += msg.data;

        var output = '';
        var rx_len = rx.length;
        var max_i = rx.length-1;

        for (var i=0; i < rx_len; ) {
            var char = rx[i];

            /* strip carriage returns while we're at it */
            if (char == '\r') {
                i++; continue;
            }

            /* Always snip at a newline so other modules can more easily handle logic based on line boundaries */
            if (char == '\n') {
                output += char;
                i++;

                this.pOutputManager.handleText(output);
                output = '';

                // MXP needs to force close any open tags on newline
                this.pMxp.handle_newline();

                continue;
            }

            if (char != '\x1b') {
                output += char;
                i++;
                continue;
            }

            /* so we have an escape sequence ... */
            /* we only expect these to be color codes or MXP tags */
            var substr = rx.slice(i);
            var re;
            var match;

            /* ansi escapes */
            re = /^\x1b\[(\d+(?:;\d+)?)m/;
            match = re.exec(substr);
            if (match) {
                this.pOutputManager.handleText(output);
                output = '';

                i += match[0].length;
                var codes = match[1].split(';');
                this.pOutputManager.handleAnsiGraphicCodes(codes);
                continue;
            }

            /* xterm 256 color */
            re = /^\x1b\[[34]8;5;\d+m/;
            match = re.exec(substr);
            if (match) {
                this.pOutputManager.handleText(output);
                output = '';

                i += match[0].length;
                this.pOutputManager.handle_xterm_escape(match[0]);
                continue;
            }

            /* MXP escapes */
            re = /^\x1b\[1z(<.*?>)\x1b\[7z/;
            match = re.exec(substr);
            if (match) {
                // MXP tag. no discerning what it is or if it's opening/closing tag here
                i += match[0].length;
                this.pOutputManager.handleText(output);
                output = '';
                this.pMessage.pub('mxp_tag', {data: match[1]});
                continue;
            }

            re = /^\x1b\[7z/;
            match = re.exec(substr);
            if (match) {
                /* this gets sent once at the beginning to set the line mode. We don't need to do anything with it */
                i += match[0].length;
                continue;
            }

            /* need to account for malformed tags or sequences somehow... for now just treat a newline as a boundary */
            var nl_ind = substr.indexOf('\n');
            if (nl_ind != -1) {
                var bad_stuff = substr.slice(0, nl_ind+1);
                i += bad_stuff.length;
                console.log("Malformed sequence or tag");
                console.log(bad_stuff);
                continue;
            }

            /* If we get here, must be a partial sequence
                Send away everything up to the sequence start and assume it will get completed next time
                we receive data...
             */
            if (i != 0) {
                this.pOutputManager.handleText(output);
            }
            this.partial_seq = rx.slice(i);
            console.log("Got partial:");
            console.log(this.partial_seq);
            break;
        }
        if (!this.partial_seq) {
            /* if partial we already outputed, if not let's hit it */
            this.pOutputManager.handleText(output);
        }
        this.pOutputManager.output_done();
//        console.timeEnd("_handle_telnet_data");
//        requestAnimationFrame(function() {
            console.timeEnd("_handle_telnet_data");
//        });
    };

    private test_socket_response() {
        console.time('test_socket_response');
        this._socket.emit('request_test_socket_response', {}, () => {
            console.timeEnd('test_socket_response');
        });
    };
}