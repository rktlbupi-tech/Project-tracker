const EventEmitter = require('events');

class EventBus extends EventEmitter {
    constructor() {
        super();
        // Set higher max listeners if automation engine grows complex
        this.setMaxListeners(50);
    }
}

const eventBus = new EventBus();

module.exports = eventBus;
