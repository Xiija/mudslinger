import { GlEvent, GlDef, EventHook } from "./event";

import { UserConfig } from "./userConfig";

import { JsScript } from "./jsScript";
import { TrigAlItem } from "./trigAlEditBase";


export class TriggerManager {
    public evtTriggersChanged = new EventHook<void>();

    public triggers: Array<TrigAlItem> = null;

    constructor(private jsScript: JsScript) {
        /* backward compatibility */
        let savedTriggers = localStorage.getItem("triggers");
        if (savedTriggers) {
            UserConfig.set("triggers", JSON.parse(savedTriggers));
            localStorage.removeItem("triggers");
        }

        this.loadTriggers();

        UserConfig.evtConfigImport.handle(this.handleConfigImport, this);
    }

    public saveTriggers() {
        UserConfig.set("triggers", this.triggers);
    }

    private loadTriggers() {
        this.triggers = UserConfig.get("triggers") || [];
    }

    private handleConfigImport(imp: {[k: string]: any}) {
        this.triggers = this.triggers.concat(imp["triggers"] || []);
        this.saveTriggers();
        this.evtTriggersChanged.fire(null);
    }

    public handleLine(line: string) {
        if (UserConfig.getDef("triggersEnabled", true) !== true) return;
//        console.log("TRIGGER: " + line);
        for (let i = 0; i < this.triggers.length; i++) {
            let trig = this.triggers[i];
            if (trig.regex) {
                let match = line.match(trig.pattern);
                if (!match) {
                    continue;
                }

                if (trig.is_script) {
                    let script = this.jsScript.makeScript(trig.value, "match, line");
                    if (script) { script(match, line); };
                } else {
                    let value = trig.value;

                    value = value.replace(/\$(\d+)/g, function(m, d) {
                        return match[parseInt(d)] || "";
                    });

                    let cmds = value.replace("\r", "").split("\n");
                    GlEvent.triggerSendCommands.fire(cmds);
                }
            } else {
                if (line.includes(trig.pattern)) {
                    if (trig.is_script) {
                        let script = this.jsScript.makeScript(trig.value, "line");
                        if (script) { script(line); };
                    } else {
                        let cmds = trig.value.replace("\r", "").split("\n");
                        GlEvent.triggerSendCommands.fire(cmds);
                    }
                }
            }
        }
    }
}

