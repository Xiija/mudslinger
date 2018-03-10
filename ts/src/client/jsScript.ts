import { GlEvent, GlDef } from "./event";

function makeScript(text: string, argsSig: string) {
    let _scriptFunc_: any;
    /* Scripting API section */
    let send = function(cmd: string) {
        GlEvent.scriptSendCommand.fire({value: cmd});
    };

    let print = function(message: string) {
       GlEvent.scriptPrint.fire(message);
    };
    /* end Scripting API section */

    try {
        eval("_scriptFunc_ = function(" + argsSig + ") {\"use strict\";" + text + "}");
    }
    catch (err) {
        GlEvent.scriptEvalError.fire({value: err});
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