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
