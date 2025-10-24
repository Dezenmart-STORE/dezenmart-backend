




export type EventListenerr = (...args: any[]) => void;

export class EventEmitterClass {
  private events: { [key: string]: EventListenerr[] } = {};

  // Register a listener for a specific event
  on(event: string, listener: EventListenerr): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }



  // Emit an event to all listeners
  emit(event: string, ...args: any[]): void {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args));
    }
  }

  // Remove a listener for a specific event
  off(event: string, listener?: EventListenerr): void {
    if (this.events[event]) {

      if(listener){

        this.events[event] = this.events[event].filter(l => l !== listener);
      }else{
        // this.events[event] = this.events[event].filter(l => l !== listener);
        delete this.events[event]

      }
    }
  }
  overideon(event: string, listener: EventListenerr): void {

      this.events[event] = [listener];
  
  }

  uniqueon(event: string, listener: EventListener): void {
    if (!this.events[event] || this.events[event].length === 0) {
      this.events[event] = [listener]; // Only set if no listener exists
    }
  }
  
}
