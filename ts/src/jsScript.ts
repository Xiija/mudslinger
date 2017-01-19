import {Message} from './message';

function makeScript(text, pMessage) {
    let script_func;
    /* Scripting API section */
    let send = function(cmd) {
        pMessage.pub('script_send_command', {data: cmd});
    };

    let print = function(message) {
        pMessage.pub('script_print', {data: message});
    };
    /* end Scripting API section */

    try {
        eval('script_func = function(match) {"use strict";' + text + '}');
    }
    catch (err) {
        pMessage.pub('script_eval_error', {data: err});
        return null;
    }

    script_func.bind(this);

    return script_func;
}

export class JsScript {
    private pMessage: Message;
    private _script_this = {}; /* this used for all scripts */

    constructor(pMessage: Message) {
        this.pMessage = pMessage;
    }

    public makeScript(text) {
        return makeScript.call(this._script_this, text, this.pMessage);
    }
}