import {JsScript} from './jsScript';
import {Message} from './message';
import {TrigAlItem} from './trigAlEditBase';

declare let $;

export class AliasManager{
    private pMessage: Message;
    private pJsScript: JsScript;
    private enabled: boolean = true;
    public aliases: Array<TrigAlItem> = null;

    constructor(pMessage: Message, pJsScript: JsScript) {
        this.pMessage = pMessage;
        this.pJsScript = pJsScript;
        
        this.pMessage.sub('set_aliases_enabled', this.handle_set_aliases_enabled, this);

        $(document).ready(() => {
            var saved_aliases = localStorage.getItem("aliases");
            if (!saved_aliases) {
                this.aliases = [];
            } else {
                this.aliases = JSON.parse(saved_aliases);
            }
        });
    }

    public save_aliases() {
        localStorage.setItem('aliases', JSON.stringify(this.aliases));
    };

    private handle_set_aliases_enabled(value: boolean) {
        this.enabled = value;
    };

    // return the result of the alias if any (string with embedded lines)
    // return true if matched and script ran
    // return null if no match
    public check_alias(cmd: string) {
        if (!this.enabled) return;

        for (var i=0; i < this.aliases.length; i++) {
            var alias = this.aliases[i];

            if (alias.regex) {
                let re = alias.pattern;
                let match = cmd.match(re);
                if (!match) {
                    continue;
                }

                if (alias.is_script) {
                    var script = this.pJsScript.makeScript(alias.value);
                    if (script) {script.RunScript(match)};
                    return true;
                } else {
                    var value = alias.value;

                    value = value.replace(/\$(\d+)/g, function(m, d) {
                        return match[parseInt(d)] || '';
                    });
                    return value;
                }
            } else {
                let re = '^' + alias.pattern + '\\s*(.*)$';
                let match = cmd.match(re);
                if (!match) {
                    continue;
                }

                if (alias.is_script) {
                    var script = this.pJsScript.makeScript(alias.value);
                    if (script) {script()};
                    return true;
                } else {
                    var value = alias.value;

                    var value = alias.value.replace("$1", match[1] || '');
                    return value;
                }
            }
        }
        return null;
    };
}
