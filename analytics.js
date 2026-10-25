/* Small Beats · analytics. Google Analytics 4 is ON, with the Measurement ID below.
 *
 * Every page loads this file, so this is the only place to change.
 *   - To switch it off: empty GA_MEASUREMENT_ID (the file then does nothing at all: no requests, no cookies).
 *   - To use another property: paste its Measurement ID (G-XXXXXXXXXX) in its place.
 *   - If you change what's collected, update privacy.html first, then deploy.
 *
 * What it does:
 *   - Loads Google's gtag.js and counts page views. Pages swapped in without a reload are counted by GA4's enhanced
 *     measurement (leave "page changes based on browser history events" switched on in the data stream settings).
 *   - app.js sends a few events through window.gtag (play, new_tune, sticker_pick, tape_save, tape_send,
 *     tape_open, tape_remix), never in broadcast mode.
 *   - Uses Google Consent Mode: advertising storage is always denied, and in the EEA, the UK and Switzerland
 *     analytics storage is denied too (Google then sends cookieless pings), because there's no consent banner.
 *     If you later add a certified consent banner (needed anyway for AdSense in those regions), let it update consent.
 *   - IP addresses aren't stored by GA4; Google Signals and ad personalisation stay off.
 *   - Not loaded when the browser sends Do Not Track or Global Privacy Control, or on localhost.
 */
(function () {
  var GA_MEASUREMENT_ID = 'G-QY4M7NZD76'; // empty this to switch analytics off

  if (!GA_MEASUREMENT_ID) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl) return; // honour browser privacy signals
  if (/^(localhost|127\.|192\.168\.)/.test(location.hostname)) return; // don't count your own testing

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  var EEA_UK_CH = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LI','LT','LU','MT','NL','NO','PL','PT','RO','SK','SI','ES','SE','GB','CH'];
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', region: EEA_UK_CH });

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, { allow_google_signals: false, allow_ad_personalization_signals: false, send_page_view: true });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
  document.head.appendChild(s);

  // Small Beats is one page; the privacy and terms pages are ordinary page loads.
})();
