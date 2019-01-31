export class EventHook<TData> {
    private handlers: Array<[(data: TData) => void, any]> = [];

    public handle(callback: (data: TData) => void, context?: any) {
        this.handlers.push([callback, context]);
    }

    public fire(data: TData): boolean {
        if (this.handlers.length < 1) {
            return false;
        }

        for (let [cb, context] of this.handlers) {
            cb.call(context, data);
        }

        return true;
    }
}

export namespace GlEvent {
}

export namespace GlDef {
    export type TelnetConnectData = void;
    export type TelnetDisconnectData = void;
    export type WsErrorData = void;
    export type WsConnectData = void;
    export type WsDisconnectData = void;
    export type ScriptSendData = string;
    export interface MsdpVarData {
        varName: string;
        value: any;
    }
    export type SetEchoData = boolean;
    export type SetAliasesEnabledData = boolean;
    export type SetTriggersEnabledData = boolean;
    export type SendPwData = string;
    export interface SendCommandData {
        value: string;
        noPrint?: boolean;
    }
    export interface AliasSendCommandsData {
        orig: string;
        commands: string[];
    }
    export interface ScriptSendCommandData {
        value: string;
        noPrint?: boolean;
    }
    export type TriggerSendCommandsData = string[];
    export type ScriptPrintData = string;
    export type ScriptEvalErrorData = {};
    export type ScriptExecErrorData = {};
    export type ChangeDefaultColorData = [string, string];
    export type ChangeDefaultBgColorData = [string, string];
    export type MxpTagData = string;
    export type TelnetErrorData = string;
}