// Main entry point for the trading bot application
console.log('Trade Bot starting...');

export default {
  port: 3000,
  fetch() {
    return new Response('Trade Bot API');
  },
};
