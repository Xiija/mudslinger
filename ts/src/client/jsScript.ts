import { GlEvent, EventHook } from "./event";

export let EvtScriptEmitCmd = new EventHook<string>();
export let EvtScriptEmitPrint = new EventHook<string>();
export let EvtScriptEmitEvalError = new EventHook<{}>();

function makeScript(text: string, argsSig: string) {
    let _scriptFunc_: any;
    /* Scripting API section */
    let send = function(cmd: string) {
        EvtScriptEmitCmd.fire(cmd);
    };

    let print = function(message: string) {
       EvtScriptEmitPrint.fire(message);
    };
    /* end Scripting API section */

    try {
        eval("_scriptFunc_ = function(" + argsSig + ") {\"use strict\";" + text + "}");
    }
    catch (err) {
        EvtScriptEmitEvalError.fire(err);
        return null;
    }

    return _scriptFunc_.bind(this);;
}

export class JsScript {
    private scriptThis = {}; /* the 'this' used for all scripts */

    public makeScript(text: string, argsSig: string) {
        return makeScript.call(this.scriptThis, text, argsSig);
    }
}