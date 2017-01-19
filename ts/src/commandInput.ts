import {AliasManager} from './aliasManager';
import {Message, MsgDef} from './message';

declare let $;

export class CommandInput {
    private pMessage: Message;
    private pAliasManager: AliasManager;

    private cmd_history = [];
    private cmd_index = -1;

    constructor(pMessage: Message, pAliasManager: AliasManager) {
        this.pMessage = pMessage;
        this.pAliasManager = pAliasManager;

        this.pMessage.sub('prepare_reload_layout', this.prepare_reload_layout, this);
        this.pMessage.sub('load_layout', this.load_layout, this);
        this.pMessage.sub('set_echo', this.handle_set_echo, this);
        this.pMessage.sub('telnet_connect', this.handle_telnet_connect, this);

        $(document).ready(() => {this.load_history();});
    }
    

    private prepare_reload_layout() {
        // nada
    }

    private load_layout() {
        $('#cmd_input').keydown((event) => {return this.keydown(event);});
        $('#cmd_input').bind('input propertychange', () => {return this.input_change();});
        $('#cmd_input_pw').keydown((event) => {return this.pw_keydown(event);});
    };

    private echo: boolean = true;
    private handle_set_echo(data: MsgDef.set_echo) {
        this.echo = data.value;

        if (this.echo) {
            $('#cmd_input_pw').hide();
            $('#cmd_input').show();
            $('#cmd_input').val('');
            $('#cmd_input').focus();
        } else {
            $('#cmd_input').hide();
            $('#cmd_input_pw').show();
            $('#cmd_input_pw').focus();

            var current = $('#cmd_input').val();
            if (this.cmd_history.length > 0
                && current != this.cmd_history[this.cmd_history.length-1]) {
                /* If they already started typing password before getting echo command*/
                $('#cmd_input_pw').val(current);
                $('#cmd_input_pw')[0].setSelectionRange(current.length, current.length);
            } else {
                $('#cmd_input_pw').val('');
            }
        }
    };

    private handle_telnet_connect () {
        this.handle_set_echo({value: true});
    };

    private send_pw () {
        var pw = $('#cmd_input_pw').val();
        this.pMessage.pub('send_pw', {data: pw});
    }

    private send_cmd () {
        var cmd = $("#cmd_input").val();
        var alias = this.pAliasManager.check_alias(cmd);
        if (!alias) {
            let cmds = cmd.split(';');
            for (var i=0; i < cmds.length; i++) {
                this.pMessage.pub('send_command', {data: cmds[i]});
            }
        } else if (alias !== true) {
            let cmds = [];
            var lines = alias.replace('\r', '').split('\n');
            for (var i=0; i < lines.length; i++) {
                cmds = cmds.concat(lines[i].split(';'));
            }
            this.pMessage.pub('alias_send_commands', {orig: cmd, cmds: cmds});
        } /* else the script ran already */

        $('#cmd_input').select();

        if (cmd.trim() == '') {
            return;
        }
        if (this.cmd_history.length > 0
            && cmd == this.cmd_history[this.cmd_history.length-1]) {
            return;
        }

        if (this.echo) {
            this.cmd_history.push(cmd);
            this.cmd_history = this.cmd_history.slice(-20);
            this.save_history();
        }
        else {
            $('#cmd_input').val('');
        }
        this.cmd_index = -1;
    };

    private pw_keydown(event) {
        switch (event.which) {
            case 13: // enter
                this.send_pw();
                $('#cmd_input_pw').val('');
                return false;
            default:
                return true;
        }
    }

    private keydown(event) {
        switch (event.which) {
            case 13: // enter
                if (event.shiftKey) {
                    return true;
                } else {
                    this.send_cmd();
                    return false;
                }
            case 38: // up
                if (this.cmd_index == -1) {
                    this.cmd_index = this.cmd_history.length-1;
                } else {
                    this.cmd_index -= 1;
                    this.cmd_index = Math.max(this.cmd_index, 0);
                }
                $('#cmd_input').val(this.cmd_history[this.cmd_index]);
                $('#cmd_input').select();
                return false;
            case 40: //down
                if (this.cmd_index == -1) {
                    break;
                }
                this.cmd_index += 1;
                this.cmd_index = Math.min(this.cmd_index, this.cmd_history.length-1);
                $('#cmd_input').val(this.cmd_history[this.cmd_index]);
                $('#cmd_input').select();
                return false;
            default:
                this.cmd_index = -1;
                return true;
        }
    }

    private input_change() {
        var input = $('#cmd_input');
        input.height('1px');
        var scrollHeight = input[0].scrollHeight;
        var new_height = 10 + scrollHeight;
        input.height(new_height + "px");
    }

    private save_history() {
        localStorage.setItem('cmd_history', JSON.stringify(this.cmd_history));
    };

    private load_history() {
        var cmds = localStorage.getItem('cmd_history');
        if (cmds) {
            this.cmd_history = JSON.parse(cmds);
        }
    };

}
