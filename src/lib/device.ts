/**
 * Inline script to set initial device mode before first paint.
 * Runs synchronously in <head> to avoid layout shift.
 */
export const DEVICE_INIT_SCRIPT = `
(function() {
  var MOBILE_MAX = 767;
  var TABLET_MAX = 1279;
  var width = window.innerWidth;
  var device = width <= MOBILE_MAX ? 'mobile' : width <= TABLET_MAX ? 'tablet' : 'desktop';
  document.documentElement.setAttribute('data-device', device);
})();
`;
