/** Alpha AORE GA4 funnel events — fires only on real user actions. No PII. */
(function () {
  function utmParams() {
    var page = new URL(window.location.href);
    var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    var out = {};
    keys.forEach(function (key) {
      var value = page.searchParams.get(key);
      if (value) {
        out[key] = value;
      }
    });
    return out;
  }

  function pageName() {
    var parts = window.location.pathname.split("/");
    var file = parts[parts.length - 1] || "index.html";
    if (file === "" || file === "alpha" || file === "alpha/") {
      return "index";
    }
    return file.replace(/\.html$/, "") || "index";
  }

  function sendEvent(name, extra) {
    if (typeof gtag !== "function") {
      return;
    }
    var params = Object.assign({ page: pageName() }, utmParams(), extra || {});
    gtag("event", name, params);
  }

  function wirePolarLink(link) {
    link.addEventListener("click", function () {
      var content = link.id || link.getAttribute("data-utm-content") || "polar-link";
      sendEvent("polar_checkout_click", { content: content });
    });
  }

  function wire() {
    var cta = document.getElementById("pe01-cta");
    if (cta) {
      cta.addEventListener("click", function () {
        sendEvent("pe01_cta_click", { content: "pe01-cta" });
        sendEvent("polar_checkout_click", { content: "pe01-cta" });
      });
    }

    document.querySelectorAll('a[href*="buy.polar.sh"]').forEach(function (link) {
      if (link.id === "pe01-cta") {
        return;
      }
      wirePolarLink(link);
    });

    document.querySelectorAll('a[href*="t.me/AlphaAORE"], a[href*="t.me/alphaAORE"]').forEach(
      function (link) {
        link.addEventListener("click", function () {
          sendEvent("telegram_click", { content: link.getAttribute("href") || "telegram" });
        });
      }
    );

    var calcBtn = document.getElementById("calc-btn");
    if (calcBtn) {
      calcBtn.addEventListener("click", function () {
        sendEvent("calculator_use", { content: "calc-btn" });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
