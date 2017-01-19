import {JsScript} from './jsScript';
import {Message} from './message';
import {TrigAlItem} from './trigAlEditBase';

declare let $;

export class TriggerManager {
    private pMessage: Message;
    private pJsScript: JsScript;
    private enabled: boolean = true;
    public triggers: Array<TrigAlItem> = null;

    constructor(pMessage: Message, pJsScript: JsScript) {
        this.pMessage = pMessage;
        this.pJsScript = pJsScript;

        $(document).ready(() => {
            var saved_triggers = localStorage.getItem("triggers");
            if (!saved_triggers) {
                this.triggers = [];
            } else {
                this.triggers = JSON.parse(saved_triggers);
            }
        });

        this.pMessage.sub('set_triggers_enabled', this.handle_set_triggers_enabled, this);
    }

    public save_triggers() {
        localStorage.setItem('triggers', JSON.stringify(this.triggers));
    };

    private handle_set_triggers_enabled(value) {
        this.enabled = value;
    };

    public handle_line(line) {
        if (!this.enabled) return;
//        console.log("TRIGGER: " + line);
        for (var i=0; i < this.triggers.length; i++) {
            var trig = this.triggers[i];
            if (trig.regex) {
                var match = line.match(trig.pattern);
                if (!match) {
                    continue;
                }

                if (trig.is_script) {
                    var script = this.pJsScript.makeScript(trig.value);
                    if (script) {script()};
                } else {
                    var value = trig.value;

                    value = value.replace(/\$(\d+)/g, function(m, d) {
                        return match[parseInt(d)] || '';
                    });

                    var cmds = value.replace('\r', '').split('\n');
                    this.pMessage.pub('trigger_send_commands', {cmds: cmds});
                }
            } else {
                if (line.includes(trig.pattern)) {
                    if (trig.is_script) {
                        var script = this.pJsScript.makeScript(trig.value);
                        if (script) {script()};
                    } else {
                        var cmds = trig.value.replace('\r', '').split('\n');
                        this.pMessage.pub('trigger_send_commands', {cmds: cmds});
                    }
                }
            }
        }
    };
}

