// Vite needs a module entry; importing the consumer CSS pulls the whole
// @lyra-ds/styles @import graph through Vite's real CSS pipeline so the build
// emits a bundled stylesheet the smoke test can assert against.
import './entry.css';
