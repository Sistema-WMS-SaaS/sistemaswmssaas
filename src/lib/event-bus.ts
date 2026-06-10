/**
 * Lightweight in-app Event Bus.
 *
 * This is the integration seam between modules. Today it's an in-memory
 * pub/sub. Tomorrow the same API can be backed by WebSockets, a REST
 * polling layer or a message broker (RabbitMQ / Kafka) without changing
 * the call sites in modules.
 */
export type WmsEvent =
  | { type: "module.opened"; moduleId: string; tenantId: string }
  | { type: "search.performed"; query: string; tenantId: string }
  | { type: string; [key: string]: unknown };

type Handler = (event: WmsEvent) => void;

class EventBus {
  private handlers = new Set<Handler>();

  subscribe(handler: Handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  publish(event: WmsEvent) {
    this.handlers.forEach((h) => {
      try {
        h(event);
      } catch (err) {
        console.error("[event-bus] handler error", err);
      }
    });
    if (import.meta.env.DEV) {
      console.debug("[event-bus]", event);
    }
  }
}

export const eventBus = new EventBus();
