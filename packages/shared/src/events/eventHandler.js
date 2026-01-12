export const createEventSystem = () => {
    const listeners = {};
    return {
        on(event, callback) {
            if (!listeners[event]) {
                listeners[event] = new Set();
            }
            listeners[event].add(callback);
            // Return unsubscribe function
            return () => {
                listeners[event]?.delete(callback);
            };
        },
        off(event, callback) {
            listeners[event]?.delete(callback);
        },
        emit(event, payload) {
            listeners[event]?.forEach(cb => cb(payload));
        },
    };
};
