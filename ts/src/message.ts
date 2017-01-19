export class Message {
    private subs: {[t: string]: Array<Callback>} = {};

    public pub(t: string, data: Object) {
        let callbacks: Array<Callback> = this.subs[t] || [];
        for (let cb of callbacks) {
            cb.call(data);
        }
    }

    public sub(t: string, func: (data: Object) => void, context: Object) {
        this.subs[t] = this.subs[t] || [];
        let callback = new Callback(func, context);
        this.subs[t].push(callback);
    }
}

class Callback {
    private pFunc: (f: Object) => void;
    private pContext: Object;

    constructor(func: (data: Object) => void, context: Object) {
        this.pFunc = func;
        this.pContext = context;
    }

    public call(data: Object) {
        this.pFunc.call(this.pContext, data);
    }
}

export namespace MsgDef {
    export interface msdp_var {
        varname: string;
        value: string;
    }

    export interface set_echo {
        value: boolean;
    }
}

