export type EventCallback<Payload> = (payload: Payload) => void;
export type Unsubscribe = () => void;
export declare const createEventSystem: <Events extends Record<string, any>>() => {
    on<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): Unsubscribe;
    off<K extends keyof Events>(event: K, callback: EventCallback<Events[K]>): void;
    emit<K extends keyof Events>(event: K, payload: Events[K]): void;
};
