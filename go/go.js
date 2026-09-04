/**
 * Merist owned /go measurement — pre-affiliate mode.
 * Fires GA4 commercial-interest events, then redirects to a public vendor URL.
 * Does not claim affiliate, partner, sponsored, or commission relationships.
 */
(function () {
  "use strict";

  var GA_ID = "G-SP5417P9L1";
  var EVENT_REAL = "merist_go_click";
  var EVENT_TEST = "merist_go_click_test";
  var REDIRECT_MS = 900;

  function qs() {
    try {
      return new URL(window.location.href).searchParams;
    } catch (_) {
      return new URLSearchParams(window.location.search || "");
    }
  }

  function pathParts() {
    var path = window.location.pathname || "";
    var marker = "/go/";
    var idx = path.toLowerCase().indexOf(marker);
    if (idx < 0) {
      return [];
    }
    return path
      .slice(idx + marker.length)
      .split("/")
      .filter(function (p) {
        return p && p.toLowerCase() !== "index.html";
      });
  }

  function first(params, keys) {
    for (var i = 0; i < keys.length; i++) {
      var v = params.get(keys[i]);
      if (v) {
        return String(v).trim();
      }
    }
    return "";
  }

  function isTestTraffic(params) {
    var test = first(params, ["test", "traffic", "traffic_class"]).toLowerCase();
    if (test === "1" || test === "true" || test === "operator" || test === "operator_test") {
      return true;
    }
    var medium = first(params, ["utm_medium", "platform"]).toLowerCase();
    return medium === "operator_test" || medium === "test";
  }

  function setStatus(title, body, kind) {
    var titleEl = document.getElementById("go-title");
    var bodyEl = document.getElementById("go-body");
    var box = document.getElementById("go-status");
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = body;
    if (box) {
      box.className = "go-status" + (kind ? " go-status--" + kind : "");
    }
  }

  function appendUtm(destUrl, attrs) {
    var url;
    try {
      url = new URL(destUrl);
    } catch (_) {
      return destUrl;
    }
    if (!url.searchParams.get("utm_source")) {
      url.searchParams.set("utm_source", "merist");
    }
    if (attrs.platform && !url.searchParams.get("utm_medium")) {
      url.searchParams.set("utm_medium", attrs.platform);
    }
    if (attrs.vendor && !url.searchParams.get("utm_campaign")) {
      url.searchParams.set("utm_campaign", attrs.vendor);
    }
    if (attrs.content_id && !url.searchParams.get("utm_content")) {
      url.searchParams.set("utm_content", attrs.content_id);
    }
    if (attrs.placement && !url.searchParams.get("utm_term")) {
      url.searchParams.set("utm_term", attrs.placement);
    }
    return url.toString();
  }

  function sendEvent(name, params, done) {
    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      done();
    }
    if (typeof gtag !== "function") {
      finish();
      return;
    }
    try {
      gtag("event", name, Object.assign({}, params, { event_callback: finish }));
    } catch (_) {
      finish();
      return;
    }
    setTimeout(finish, REDIRECT_MS);
  }

  function resolveAttrs(vendorHint, registry) {
    var params = qs();
    var parts = pathParts();
    var vendor =
      vendorHint ||
      first(params, ["vendor", "v", "utm_campaign"]) ||
      (parts[0] || "");
    vendor = String(vendor || "").toLowerCase();

    var contentId =
      first(params, ["content_id", "c", "utm_content"]) ||
      (parts[1] || "") ||
      "unknown";

    var placement =
      first(params, ["placement", "p", "utm_term"]) || "unspecified";

    var platform =
      first(params, ["platform", "utm_medium"]) || "web";

    var campaign =
      first(params, ["campaign", "utm_campaign"]) || vendor || "unspecified";

    var destMap = {};
    (registry.destinations || []).forEach(function (d) {
      destMap[String(d.vendor).toLowerCase()] = d;
    });

    return {
      vendor: vendor,
      content_id: contentId,
      placement: placement,
      platform: platform,
      campaign: campaign,
      entry: destMap[vendor] || null,
      test: isTestTraffic(params),
    };
  }

  function run(options) {
    options = options || {};
    var vendorHint = options.vendorHint || null;
    var destPath = options.destinationsUrl || "./destinations.json";

    setStatus(
      "Preparing link…",
      "Owned Merist measurement path. Independent editorial — no affiliate relationship is claimed on this redirect.",
      "info"
    );

    fetch(destPath, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) {
          throw new Error("destination_registry_unavailable");
        }
        return res.json();
      })
      .then(function (registry) {
        var attrs = resolveAttrs(vendorHint, registry);
        if (!attrs.entry) {
          setStatus(
            "Unknown destination",
            "This Merist /go link is missing a recognized vendor. No redirect was performed.",
            "error"
          );
          return;
        }

        var finalUrl = appendUtm(attrs.entry.destination_url, attrs);
        var eventName = attrs.test ? EVENT_TEST : EVENT_REAL;
        var eventParams = {
          vendor: attrs.vendor,
          content_id: attrs.content_id,
          placement: attrs.placement,
          platform: attrs.platform,
          campaign: attrs.campaign,
          destination: attrs.entry.destination_url,
          mode: "owned_non_affiliate",
          traffic_class: attrs.test ? "operator_test" : "stranger_or_unknown",
          send_to: GA_ID,
        };

        setStatus(
          "Continuing to " + attrs.entry.label,
          "You are leaving Merist for <strong>" +
            attrs.entry.label +
            "</strong> (" +
            attrs.entry.destination_url +
            "). Independent editorial measurement only — Merist is not claiming an affiliate, partner, or sponsored relationship on this click." +
            (attrs.test
              ? "<br /><br /><em>Operator/test traffic flag detected — this click must not count as market validation.</em>"
              : ""),
          attrs.test ? "warn" : "ok"
        );

        sendEvent(eventName, eventParams, function () {
          window.location.replace(finalUrl);
        });
      })
      .catch(function () {
        setStatus(
          "Measurement path unavailable",
          "Could not load the Merist destination registry. No redirect was performed.",
          "error"
        );
      });
  }

  window.MeristGo = { run: run };
})();
