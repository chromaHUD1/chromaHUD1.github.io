/* Added only to the published site by prepare_pages.py. No account secrets. */
(function () {
  'use strict';
  if (location.hostname !== 'chromahud1.github.io' || window.self !== window.top) return;

  var key = 'portfolio-exclude-visits';
  var url = new URL(location.href);
  var choice = url.searchParams.get('exclude-visits');
  var excluded = false;
  var saved = true;
  try {
    if (choice === '1') localStorage.setItem(key, '1');
    if (choice === '0') localStorage.removeItem(key);
    excluded = localStorage.getItem(key) === '1';
  } catch (_) {
    saved = false;
    // If exclusion cannot persist, skip tracking rather than count the owner.
    excluded = true;
  }
  if (choice === '1' || choice === '0') {
    url.searchParams.delete('exclude-visits');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
    var notice = document.createElement('div');
    notice.setAttribute('role', 'status');
    notice.id = 'portfolio-analytics-status';
    notice.textContent = saved
      ? (excluded ? 'Your visits are excluded in this browser. You can close this message.' : 'Visit counting is enabled in this browser.')
      : 'Browser storage is unavailable. Your visit is excluded for now; enable storage and reopen the exclusion link to save this preference.';
    notice.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;z-index:99999;padding:16px;background:#153033;color:white;border:2px solid #b9ed76;border-radius:8px;font:16px/1.5 system-ui;box-shadow:0 4px 24px #0005';
    var close = document.createElement('button');
    close.textContent = 'Close';
    close.style.cssText = 'margin-left:16px;padding:6px 12px;cursor:pointer';
    close.addEventListener('click', function () { notice.remove(); });
    notice.appendChild(close);
    document.body.appendChild(notice);
  }
  if (excluded) return;

  window.goatcounter = {
    // Root and index.html are the same page in the dashboard.
    path: function () { return location.pathname.replace(/\/index\.html$/, '/') || '/'; }
  };
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.setAttribute('data-goatcounter', 'https://owsheetz.goatcounter.com/count');
  document.head.appendChild(script);
}());
