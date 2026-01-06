// Suppress ResizeObserver errors that don't affect functionality
if (typeof window !== 'undefined') {
  const originalError = window.console.error;
  window.console.error = (...args) => {
    // Filter out ResizeObserver errors
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ResizeObserver loop') ||
       args[0].includes('ResizeObserver loop completed'))
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  // Handle uncaught errors
  window.addEventListener('error', (e) => {
    if (
      e.message &&
      (e.message.includes('ResizeObserver loop') ||
       e.message.includes('ResizeObserver loop completed'))
    ) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    }
  });
}

export default {};
