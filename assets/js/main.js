// OTAKE KEI official site — motion & interactions

(function () {
  "use strict";

  // 常にフルモーションで再生する（OSの「アニメーション効果オフ」設定は無視）。
  // 動きを抑えたい閲覧者向けに ?calm 付きURLでのみ簡易表示にする。
  var reduced = new URLSearchParams(window.location.search).has("calm");
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ---------- Header / mobile nav (always on) ----------
  var header = document.getElementById("siteHeader");
  var onScroll = function () {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("globalNav");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  nav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  // ---------- Fallback mode (no GSAP or reduced motion) ----------
  if (!hasGsap || reduced) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      revealObserver.observe(el);
    });

    var countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var target = parseInt(el.dataset.count, 10);
          var start = performance.now();
          var step = function (now) {
            var p = Math.min((now - start) / 1600, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          countObserver.unobserve(el);
        });
      },
      { threshold: 0.6 }
    );
    document.querySelectorAll(".count").forEach(function (el) {
      countObserver.observe(el);
    });
    return;
  }

  // ====================================================
  //  FULL MOTION MODE
  // ====================================================
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("gsap");

  // ---------- Smooth scroll (Lenis) ----------
  var lenis = null;
  if (typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -60, duration: 1.4 });
      });
    });
  }

  // ---------- Helpers ----------
  function splitChars(el) {
    var text = el.textContent;
    el.textContent = "";
    var frag = document.createDocumentFragment();
    Array.from(text).forEach(function (ch) {
      var s = document.createElement("span");
      s.className = "char";
      s.textContent = ch;
      frag.appendChild(s);
    });
    el.appendChild(frag);
    return el.querySelectorAll(".char");
  }

  // ---------- Hero particle canvas ----------
  (function particles() {
    var heroBg = document.querySelector(".hero-bg");
    var hero = document.querySelector(".hero");
    if (!heroBg) return;
    var canvas = document.createElement("canvas");
    canvas.className = "hero-canvas";
    heroBg.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var W, H, dots = [];
    var COLORS = ["133,183,235", "170,215,255", "250,199,117"];

    function resize() {
      W = canvas.width = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // 海中: 浮遊するプランクトンの粒
    var N = Math.min(60, Math.floor(W / 22));
    for (var i = 0; i < N; i++) {
      dots.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.5 + Math.random() * 1.8,
        vx: 0.015 + Math.random() * 0.05,
        vy: -(0.005 + Math.random() * 0.02),
        c: COLORS[(Math.random() * COLORS.length) | 0],
        ph: Math.random() * Math.PI * 2,
        sp: 0.3 + Math.random() * 1.0
      });
    }

    // 海中: 立ち昇る泡
    var bubbles = [];
    var NB = Math.min(26, Math.floor(W / 56));
    function spawnBubble(b, first) {
      b.x = Math.random();
      b.y = first ? Math.random() : 1.04;
      b.r = 1.5 + Math.random() * 3.5;
      b.vy = 0.06 + Math.random() * 0.12;
      b.wob = 0.004 + Math.random() * 0.012;
      b.ph = Math.random() * Math.PI * 2;
      return b;
    }
    for (var j = 0; j < NB; j++) bubbles.push(spawnBubble({}, true));

    var running = true, t = 0;
    function frame() {
      if (running) {
        t += 0.016;
        ctx.clearRect(0, 0, W, H);

        for (var i = 0; i < dots.length; i++) {
          var d = dots[i];
          d.x += d.vx / 100;
          d.y += d.vy / 100;
          if (d.x > 1.02) d.x = -0.02;
          if (d.y < -0.02) d.y = 1.02;
          var a = 0.10 + 0.38 * Math.abs(Math.sin(d.ph + t * d.sp));
          ctx.beginPath();
          ctx.fillStyle = "rgba(" + d.c + "," + a.toFixed(3) + ")";
          ctx.shadowColor = "rgba(" + d.c + ",0.9)";
          ctx.shadowBlur = 6;
          ctx.arc(d.x * W, d.y * H, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;

        for (var k = 0; k < bubbles.length; k++) {
          var b = bubbles[k];
          b.y -= b.vy / 100;
          var bx = b.x + Math.sin(b.ph + t * 1.4) * b.wob;
          if (b.y < -0.04) spawnBubble(b, false);
          var px = bx * W, py = b.y * H;
          ctx.beginPath();
          ctx.strokeStyle = "rgba(190,225,255,0.5)";
          ctx.lineWidth = 1;
          ctx.fillStyle = "rgba(190,225,255,0.08)";
          ctx.arc(px, py, b.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.arc(px - b.r * 0.35, py - b.r * 0.35, b.r * 0.22, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      requestAnimationFrame(frame);
    }
    frame();
    ScrollTrigger.create({
      trigger: hero,
      start: "top bottom",
      end: "bottom top",
      onToggle: function (self) { running = self.isActive; }
    });
  })();

  // ---------- Loader + hero intro ----------
  var loader = document.createElement("div");
  loader.id = "loader";
  loader.setAttribute("aria-hidden", "true");
  loader.innerHTML =
    '<div class="loader-inner">' +
    '<p class="loader-name">OTAKE KEI</p>' +
    '<p class="loader-sub">ITO CITY COUNCIL MEMBER</p>' +
    '<div class="loader-bar"><span></span></div>' +
    "</div>";
  document.body.appendChild(loader);
  document.documentElement.classList.add("is-loading");

  var heroChars = [];
  document.querySelectorAll(".hero-title .line > span").forEach(function (el) {
    heroChars.push(splitChars(el));
  });

  var INTRO_TARGETS =
    ".hero-eyebrow, .hero-eyebrow .tick, .hero-title .char, .hero-sub, " +
    ".hero-actions .btn, .sun-disc, .hero-portrait img, .hero-watermark, .hero-news, .scroll-cue";

  var introDone = false;
  var intro = gsap.timeline({
    defaults: { ease: "power4.out" },
    onComplete: function () {
      introDone = true;
      loader.remove();
      document.documentElement.classList.remove("is-loading");
      document.body.style.overflow = "";
      gsap.set(INTRO_TARGETS, { clearProps: "transform,opacity,visibility" });
      ScrollTrigger.refresh();
    }
  });

  // Safety: if the tab is hidden (rAF suspended) or anything stalls,
  // jump straight to the final state so content is never stuck hidden.
  var finishIntro = function () {
    if (introDone) return;
    intro.progress(1);
    if (!introDone) {
      introDone = true;
      if (loader.parentNode) loader.remove();
      document.body.style.overflow = "";
      gsap.set(INTRO_TARGETS, { clearProps: "transform,opacity,visibility" });
    }
  };
  if (document.hidden) finishIntro();
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) finishIntro();
  });
  setTimeout(finishIntro, 7000);

  intro
    .set("body", { overflow: "hidden" })
    .from("#loader .loader-name", { yPercent: 130, duration: 0.7 })
    .from("#loader .loader-sub", { opacity: 0, y: 14, duration: 0.45 }, "-=0.3")
    .to("#loader .loader-bar span", { scaleX: 1, duration: 0.7, ease: "power2.inOut" }, "-=0.2")
    .to("#loader .loader-inner", { opacity: 0, y: -30, duration: 0.4, ease: "power2.in" }, "+=0.15")
    .to("#loader", { yPercent: -100, duration: 0.75, ease: "power4.inOut" }, "-=0.1")
    .set("body", { overflow: "auto" }, "<+0.3");

  // hero entrance (overlaps end of loader)
  intro
    .from(".hero-eyebrow", { x: -36, opacity: 0, duration: 0.8 }, "-=0.45")
    .from(".hero-eyebrow .tick", { scaleX: 0, transformOrigin: "left", duration: 0.6 }, "<");

  heroChars.forEach(function (chars, i) {
    intro.from(chars, {
      yPercent: 130,
      rotate: 8,
      duration: 0.9,
      stagger: 0.045,
      ease: "power4.out"
    }, i === 0 ? "-=0.55" : "-=0.75");
  });

  intro
    .from(".hero-sub", { y: 30, opacity: 0, duration: 0.7 }, "-=0.5")
    .from(".hero-actions .btn", { y: 30, opacity: 0, duration: 0.6, stagger: 0.1 }, "-=0.5")
    .from(".sun-disc", { scale: 0.2, opacity: 0, duration: 1.1, ease: "expo.out" }, "-=1.1")
    .from(".hero-portrait img", { y: 110, opacity: 0, duration: 1.0, ease: "expo.out" }, "-=0.9")
    .from(".hero-watermark", { x: 80, opacity: 0, duration: 1.2 }, "-=1.0")
    .from(".hero-news", { y: 40, opacity: 0, duration: 0.7 }, "-=0.7")
    .from(".scroll-cue", { opacity: 0, duration: 0.6 }, "-=0.5");

  // ---------- Hero scroll parallax ----------
  gsap.to(".hero-copy", {
    y: -110, opacity: 0.25, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });
  gsap.to(".hero-portrait", {
    y: 90, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });
  gsap.to(".hero-watermark", {
    x: -140, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });
  gsap.to(".sunrise", {
    y: -90, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });

  // ---------- Section titles: char reveal ----------
  document.querySelectorAll(".section-title").forEach(function (title) {
    var chars = splitChars(title);
    gsap.from(chars, {
      yPercent: 120,
      rotate: 5,
      duration: 0.8,
      stagger: 0.035,
      ease: "power4.out",
      scrollTrigger: { trigger: title, start: "top 85%", once: true }
    });
  });

  // ---------- Section label / desc ----------
  document.querySelectorAll(".section-en").forEach(function (el) {
    gsap.from(el, {
      x: -40, opacity: 0, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true }
    });
  });
  document.querySelectorAll(".section-desc").forEach(function (el) {
    gsap.from(el, {
      y: 36, opacity: 0, duration: 0.9, ease: "power3.out", delay: 0.15,
      scrollTrigger: { trigger: el, start: "top 88%", once: true }
    });
  });

  // ---------- Giant background words: parallax drift ----------
  document.querySelectorAll(".giant-bg").forEach(function (el) {
    gsap.fromTo(el, { x: 60 }, {
      x: -120, ease: "none",
      scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  // ---------- Image curtain reveals ----------
  var clipTargets = document.querySelectorAll(".policy-img, .g-item, .message-photo");
  clipTargets.forEach(function (wrap) {
    var img = wrap.querySelector("img");
    var tl = gsap.timeline({
      scrollTrigger: { trigger: wrap, start: "top 86%", once: true }
    });
    tl.fromTo(wrap,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: 1.05, ease: "power4.inOut" }
    );
    if (img) {
      tl.from(img, { scale: 1.35, duration: 1.4, ease: "power3.out" }, "-=0.9");
    }
  });

  // ---------- Cards ----------
  gsap.utils.toArray(".policy-card").forEach(function (card, i) {
    gsap.from(card, {
      y: 90, opacity: 0, scale: 0.96, duration: 0.95, ease: "power3.out", delay: (i % 3) * 0.13,
      scrollTrigger: { trigger: card, start: "top 90%", once: true }
    });
  });
  gsap.utils.toArray(".sns-card").forEach(function (card, i) {
    gsap.from(card, {
      y: 60, opacity: 0, duration: 0.8, ease: "power3.out", delay: (i % 2) * 0.12,
      scrollTrigger: { trigger: card, start: "top 92%", once: true }
    });
  });

  // ---------- Message paragraphs ----------
  gsap.from(".message-body > *", {
    y: 36, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out",
    scrollTrigger: { trigger: ".message-body", start: "top 82%", once: true }
  });

  // ---------- Stats counters ----------
  document.querySelectorAll(".stat").forEach(function (stat, i) {
    gsap.from(stat, {
      y: 50, opacity: 0, duration: 0.7, delay: i * 0.1, ease: "power3.out",
      scrollTrigger: { trigger: ".stats", start: "top 85%", once: true }
    });
  });
  document.querySelectorAll(".count").forEach(function (el) {
    var target = parseInt(el.dataset.count, 10);
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target,
      duration: 1.8,
      ease: "power3.out",
      snap: { v: 1 },
      onUpdate: function () { el.textContent = obj.v.toLocaleString(); },
      scrollTrigger: { trigger: el, start: "top 85%", once: true }
    });
  });

  // ---------- Quote ----------
  gsap.from(".cv-quote", {
    y: 50, opacity: 0, scale: 0.97, duration: 1.1, ease: "power3.out",
    scrollTrigger: { trigger: ".cv-quote", start: "top 85%", once: true }
  });

  // ---------- Timeline ----------
  var tlEl = document.querySelector(".timeline");
  if (tlEl) {
    ScrollTrigger.create({
      trigger: tlEl, start: "top 80%", once: true,
      onEnter: function () { tlEl.classList.add("is-drawn"); }
    });
    gsap.from(".timeline li", {
      x: -50, opacity: 0, duration: 0.7, stagger: 0.12, ease: "power3.out",
      scrollTrigger: { trigger: tlEl, start: "top 80%", once: true }
    });
  }
  gsap.from(".profile-intro > *", {
    y: 36, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out",
    scrollTrigger: { trigger: ".profile-intro", start: "top 85%", once: true }
  });

  // ---------- Generic leftovers ----------
  gsap.utils.toArray(".message-photo figcaption, .footer-brand, .footer-note").forEach(function (el) {
    gsap.from(el, {
      y: 24, opacity: 0, duration: 0.7, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 95%", once: true }
    });
  });

  // ---------- Magnetic buttons ----------
  if (canHover) {
    document.querySelectorAll(".btn, .nav-cta").forEach(function (btn) {
      var xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
      var yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.25);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
    });

    // card tilt
    document.querySelectorAll(".policy-card, .sns-card").forEach(function (card) {
      var rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
      var ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });
      card.style.transformPerspective = "900px";
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 7);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 7);
      });
      card.addEventListener("pointerleave", function () { rx(0); ry(0); });
    });
  }
})();
