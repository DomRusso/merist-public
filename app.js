/**
 * Merist Content Intelligence — public reviewer shell.
 * Honest demo mode: no live TikTok API, no secrets, no fake production approval.
 */
(function () {
  "use strict";

  var EVIDENCE = {
    draft: {
      status: "sent_to_inbox",
      publish_id: "v_inbox_file~v2.7678174022768592926",
    },
    direct: {
      status: "published_private",
      privacy: "SELF_ONLY",
      publish_id: "v_pub_file~v2-1.7678176552919648287",
    },
  };

  function $(id) {
    return document.getElementById(id);
  }

  function showView(name) {
    document.querySelectorAll("[data-view-panel]").forEach(function (el) {
      el.classList.toggle("is-active", el.getAttribute("data-view-panel") === name);
    });
    document.querySelectorAll(".app-nav [data-view]").forEach(function (el) {
      el.classList.toggle("is-active", el.getAttribute("data-view") === name);
    });
    var panel = document.querySelector('[data-view-panel="' + name + '"]');
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    try {
      history.replaceState(null, "", "#" + name);
    } catch (_) {}
  }

  function setNotice(el, html, kind) {
    if (!el) return;
    el.hidden = false;
    el.className = "notice" + (kind ? " notice--" + kind : "");
    el.innerHTML = html;
  }

  function wireNav() {
    document.querySelectorAll("[data-view]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        showView(link.getAttribute("data-view"));
      });
    });
    document.querySelectorAll("[data-goto]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        showView(btn.getAttribute("data-goto"));
      });
    });
    var hash = (location.hash || "").replace(/^#/, "");
    if (hash && document.querySelector('[data-view-panel="' + hash + '"]')) {
      showView(hash);
    }
  }

  function wireTikTokConnect() {
    var connect = $("btn-connect-tiktok");
    var disconnect = $("btn-disconnect-tiktok");
    var notice = $("tiktok-connect-notice");
    if (connect) {
      connect.addEventListener("click", function () {
        setNotice(
          notice,
          "<strong>Login Kit workflow (operator-hosted app):</strong> Merist redirects the account owner to TikTok’s official authorization screen requesting <code>user.info.basic</code>, <code>user.info.stats</code>, <code>video.list</code>, and — when Content Posting is in scope — <code>video.upload</code> / <code>video.publish</code>. This public GitHub Pages site does not start a live OAuth session (no client secrets, no token exchange). Reviewers: the UI and confirmation model match the real Merist Content Intelligence product.",
          "warn"
        );
      });
    }
    if (disconnect) {
      disconnect.addEventListener("click", function () {
        setNotice(
          notice,
          "<strong>Revocation:</strong> In Merist, the operator can Disconnect the TikTok connection. Independently, the account owner can revoke Merist in TikTok account settings. After revocation, analytics and posting actions for that account stop.",
          "ok"
        );
      });
    }
  }

  function wirePosting() {
    var confirmDraft = $("confirm-draft");
    var btnDraft = $("btn-draft");
    var draftResult = $("draft-result");
    var confirmDirect = $("confirm-direct");
    var btnDirect = $("btn-direct");
    var directResult = $("direct-result");

    function sync() {
      if (btnDraft) btnDraft.disabled = !(confirmDraft && confirmDraft.checked);
      if (btnDirect) btnDirect.disabled = !(confirmDirect && confirmDirect.checked);
    }

    if (confirmDraft) confirmDraft.addEventListener("change", sync);
    if (confirmDirect) confirmDirect.addEventListener("change", sync);
    sync();

    if (btnDraft) {
      btnDraft.addEventListener("click", function () {
        if (!confirmDraft || !confirmDraft.checked) return;
        setNotice(
          draftResult,
          "<strong>Public reviewer mode — live Draft Upload is not executed from this website.</strong><br />" +
            "In the operator-hosted Merist Content Intelligence app, confirmed Draft Upload calls TikTok <code>video.upload</code> and records status + publish_id.<br />" +
            "<strong>Real Sandbox evidence (already completed):</strong> status <code>" +
            EVIDENCE.draft.status +
            "</code> · publish_id <code>" +
            EVIDENCE.draft.publish_id +
            "</code>",
          "ok"
        );
      });
    }

    if (btnDirect) {
      btnDirect.addEventListener("click", function () {
        if (!confirmDirect || !confirmDirect.checked) return;
        var privacy = ($("direct-privacy") && $("direct-privacy").value) || "SELF_ONLY";
        var title = ($("direct-title") && $("direct-title").value) || "";
        setNotice(
          directResult,
          "<strong>Public reviewer mode — live Direct Post is not executed from this website.</strong><br />" +
            "Operator app requires the confirmation checkbox, then calls TikTok <code>video.publish</code> with creator settings (privacy, comment/duet/stitch).<br />" +
            "Requested privacy in this panel: <code>" +
            privacy +
            "</code>. Caption length: " +
            title.length +
            " chars.<br />" +
            "<strong>Real Sandbox evidence (already completed):</strong> status <code>" +
            EVIDENCE.direct.status +
            "</code> · <code>" +
            EVIDENCE.direct.privacy +
            "</code> · publish_id <code>" +
            EVIDENCE.direct.publish_id +
            "</code>. Autonomous unrestricted publishing remains disabled.",
          "ok"
        );
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireNav();
    wireTikTokConnect();
    wirePosting();
    window.addEventListener("hashchange", function () {
      var hash = (location.hash || "").replace(/^#/, "");
      if (hash && document.querySelector('[data-view-panel="' + hash + '"]')) {
        showView(hash);
      }
    });
  });
})();
