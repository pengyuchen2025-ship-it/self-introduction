const canvas = document.querySelector("#field");
const ctx = canvas.getContext("2d");
const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let width = 0;
let height = 0;
let particles = [];
let pointer = { x: 0, y: 0 };

function setupLandingIntro() {
  const title = document.querySelector(".words-pull-up");
  const intro = document.querySelector(".landing-intro");
  const video = document.querySelector(".site-video-bg");
  const loader = document.querySelector(".site-loader");
  const loaderKicker = document.querySelector(".site-loader-kicker");
  const loaderPercent = document.querySelector(".site-loader-percent");
  const loaderBar = document.querySelector(".site-loader-bar");
  const animatedItems = document.querySelectorAll(".words-pull-up, .fade-up");
  let loaderProgress = 0;
  let loaderTarget = 12;
  let loaderDone = false;

  const setLoaderProgress = (value) => {
    const progress = Math.max(0, Math.min(100, value));
    if (loaderPercent) {
      loaderPercent.textContent = `${Math.round(progress)}%`;
    }
    if (loaderBar) {
      loaderBar.style.setProperty("--loader-progress", `${progress / 100}`);
    }
  };

  const finishLoading = () => {
    if (!loader || loaderDone) return;
    loaderDone = true;
    loaderTarget = 100;

    const complete = () => {
      loaderProgress += (loaderTarget - loaderProgress) * 0.18;
      setLoaderProgress(loaderProgress);

      if (loaderProgress < 99.4) {
        requestAnimationFrame(complete);
        return;
      }

      setLoaderProgress(100);
      loader.classList.add("is-hidden");
      document.body.classList.remove("is-loading");
      setTimeout(() => loader.remove(), 800);
    };

    requestAnimationFrame(complete);
  };

  const tickLoader = () => {
    if (!loader || loaderDone) return;
    loaderTarget = Math.min(88, loaderTarget + 0.22);
    loaderProgress += (loaderTarget - loaderProgress) * 0.075;
    setLoaderProgress(loaderProgress);
    requestAnimationFrame(tickLoader);
  };

  if (loader) {
    setLoaderProgress(0);
    requestAnimationFrame(tickLoader);
  }

  if (title) {
    const text = title.dataset.text || title.textContent || "";
    const words = text.trim().split(/\s+/).filter(Boolean);
    title.innerHTML = words
      .map(
        (word, index) =>
          `<span class="word-mask"><span class="word" style="--word-index:${index}">${word}</span></span>`,
      )
      .join(" ");
  }

  const introAnimationObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          introAnimationObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );

  animatedItems.forEach((item) => introAnimationObserver.observe(item));

  if (intro) {
    const introObserver = new IntersectionObserver(
      ([entry]) => {
        document.body.classList.toggle("at-intro", entry.isIntersecting && entry.intersectionRatio > 0.3);
      },
      { threshold: [0, 0.3, 0.65] },
    );
    introObserver.observe(intro);
  }

  if (video) {
    let hasTriedTapPrompt = false;

    const playVideo = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      return video.play();
    };

    const showTapPrompt = () => {
      if (!loader || loaderDone || hasTriedTapPrompt) return;
      hasTriedTapPrompt = true;
      loaderTarget = 100;
      loader.classList.add("needs-tap");
      if (loaderKicker) {
        loaderKicker.textContent = "轻触进入";
      }
      setLoaderProgress(100);
    };

    const syncBufferedProgress = () => {
      if (!video.duration || !video.buffered.length) return;
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const bufferedPercent = Math.min(96, (bufferedEnd / video.duration) * 100);
      loaderTarget = Math.max(loaderTarget, bufferedPercent);
    };

    const tryPlayVideo = () => {
      syncBufferedProgress();
      playVideo().catch(() => {
        setTimeout(showTapPrompt, 280);
      });
    };

    const markVideoPlaying = () => {
      if (video.currentTime === 0 && video.readyState < 3) return;
      finishLoading();
    };

    video.addEventListener("progress", syncBufferedProgress);
    video.addEventListener("loadeddata", tryPlayVideo);
    video.addEventListener("canplay", tryPlayVideo);
    video.addEventListener("playing", markVideoPlaying, { once: true });
    video.addEventListener("timeupdate", markVideoPlaying, { once: true });
    video.addEventListener("error", () => setTimeout(finishLoading, 600), { once: true });

    if (video.readyState >= 2) {
      tryPlayVideo();
    } else {
      video.load();
      tryPlayVideo();
    }

    document.addEventListener("WeixinJSBridgeReady", tryPlayVideo, { once: true });
    window.addEventListener(
      "touchstart",
      () => {
        playVideo()
          .then(markVideoPlaying)
          .catch(() => {});
      },
      { once: true, passive: true },
    );
    setTimeout(showTapPrompt, 4500);
  } else {
    setTimeout(finishLoading, 500);
  }
}

setupLandingIntro();

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  particles = Array.from({ length: width < 700 ? 44 : 86 }, (_, index) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: index % 9 === 0 ? 2.2 : 1.1,
    hue: index % 3,
  }));
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  particles.forEach((dot, index) => {
    if (!mediaQuery.matches) {
      dot.x += dot.vx + pointer.x * 0.0005 * (index % 4);
      dot.y += dot.vy + pointer.y * 0.0005 * (index % 3);
    }

    if (dot.x < -20) dot.x = width + 20;
    if (dot.x > width + 20) dot.x = -20;
    if (dot.y < -20) dot.y = height + 20;
    if (dot.y > height + 20) dot.y = -20;

    const color =
      dot.hue === 0
        ? "rgba(214,184,79,0.42)"
        : dot.hue === 1
          ? "rgba(123,217,255,0.24)"
          : "rgba(224,74,63,0.18)";
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    ctx.fill();

    for (let next = index + 1; next < particles.length; next += 1) {
      const other = particles[next];
      const dx = dot.x - other.x;
      const dy = dot.y - other.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 118) {
        ctx.strokeStyle = `rgba(245,240,223,${0.06 * (1 - distance / 118)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dot.x, dot.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    }
  });

  ctx.globalCompositeOperation = "source-over";
  requestAnimationFrame(draw);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (event) => {
  pointer = {
    x: event.clientX - width / 2,
    y: event.clientY - height / 2,
  };
});

resize();
draw();

const projects = document.querySelectorAll(".project");
const preview = document.querySelector("#preview");
const previewTitle = document.querySelector("#previewTitle");
const previewFrame = document.querySelector("#previewFrame");
const previewLink = document.querySelector("#previewLink");
const previewClose = document.querySelector("#previewClose");

function openPreview(project) {
  const url = project.dataset.url;
  const title = project.dataset.title || "项目预览";
  const previewMode = project.dataset.preview;

  if (!url) {
    project.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 240, easing: "ease-out" },
    );
    return;
  }

  if (url === "#" || previewMode === "cover") {
    const image = project.querySelector("img");
    previewTitle.textContent = title;
    previewLink.href = url === "#" ? image.src : url;
    previewFrame.removeAttribute("src");
    previewFrame.srcdoc = `
      <style>
        body{margin:0;background:#050506;color:#f5f0df;display:grid;place-items:center;min-height:100vh;font-family:system-ui,-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif}
        main{width:min(1120px,92vw);display:grid;gap:22px}
        img{width:100%;max-height:72vh;object-fit:contain;border:1px solid rgba(245,240,223,.18);border-radius:8px;box-shadow:0 28px 80px rgba(0,0,0,.42)}
        p{margin:0;color:#aaa59a;font-size:16px;line-height:1.8;text-align:center}
        a{color:#d6b84f}
      </style>
      <main>
        <img src="${image.src}" alt="${title}">
        ${
          previewMode === "cover"
            ? `<p>这个项目当前的 Coze 公开链接返回 451 审核限制。这里先展示项目封面；审核通过或换部署地址后，可恢复实时站内预览。</p>`
            : ""
        }
      </main>
    `;
    preview.hidden = false;
    document.body.style.overflow = "hidden";
    return;
  }

  previewTitle.textContent = title;
  previewLink.href = url;
  previewFrame.removeAttribute("srcdoc");
  previewFrame.src = url;
  preview.hidden = false;
  document.body.style.overflow = "hidden";
}

projects.forEach((project) => {
  const button = project.querySelector(".project-open");
  button.addEventListener("click", () => openPreview(project));
});

const workMenuItems = document.querySelectorAll(".work-menu-item");
const workGrid = document.querySelector(".work-grid");
const projectById = new Map([...projects].map((project) => [project.id, project]));
let currentActiveProjectId = "";

function setActiveProject(projectId) {
  if (projectId === currentActiveProjectId) return;
  currentActiveProjectId = projectId;
  let activeItem = null;
  workMenuItems.forEach((item) => {
    const isActive = item.getAttribute("href") === `#${projectId}`;
    item.classList.toggle("is-active", isActive);
    if (isActive) activeItem = item;
  });

  if (activeItem && window.innerWidth <= 560) {
    activeItem.scrollIntoView({
      behavior: mediaQuery.matches ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }
}

const projectObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible?.target?.id) {
      setActiveProject(visible.target.id);
    }
  },
  {
    rootMargin: "-28% 0px -46% 0px",
    threshold: [0.08, 0.22, 0.4, 0.6],
  },
);

projects.forEach((project) => projectObserver.observe(project));

let workScrollTicking = false;

function updateActiveProjectFromScroll() {
  if (window.innerWidth > 560 || !workGrid || !projects.length) return;

  const marker = window.scrollY + 190;
  let activeProject = projects[0];

  projects.forEach((project) => {
    const projectTop = workGrid.getBoundingClientRect().top + window.scrollY + project.offsetTop;
    if (projectTop <= marker) {
      activeProject = project;
    }
  });

  if (activeProject?.id) {
    setActiveProject(activeProject.id);
  }
}

window.addEventListener(
  "scroll",
  () => {
    if (workScrollTicking) return;
    workScrollTicking = true;
    requestAnimationFrame(() => {
      updateActiveProjectFromScroll();
      workScrollTicking = false;
    });
  },
  { passive: true },
);

window.addEventListener("resize", updateActiveProjectFromScroll);
updateActiveProjectFromScroll();

workMenuItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    const targetId = item.getAttribute("href").slice(1);
    const target = projectById.get(targetId);
    if (target && workGrid) {
      setActiveProject(targetId);
      const stickyOffset = window.innerWidth <= 560 ? 148 : window.innerWidth <= 920 ? 156 : 126;
      const gridTop = workGrid.getBoundingClientRect().top + window.scrollY;
      const targetTop = gridTop + target.offsetTop - stickyOffset;
      window.scrollTo({
        top: targetTop,
        behavior: mediaQuery.matches ? "auto" : "smooth",
      });
      history.replaceState(null, "", `#${targetId}`);
    }
  });
});

function closePreview() {
  preview.hidden = true;
  previewFrame.removeAttribute("src");
  previewFrame.removeAttribute("srcdoc");
  document.body.style.overflow = "";
}

previewClose.addEventListener("click", closePreview);
preview.addEventListener("click", (event) => {
  if (event.target === preview) closePreview();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !preview.hidden) closePreview();
});

const galleryTrack = document.querySelector(".gallery-track");
const galleryImages = galleryTrack ? [...galleryTrack.querySelectorAll("img")] : [];
const mobileGalleryQuery = window.matchMedia("(max-width: 700px)");

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });
}

function openGalleryImage(image) {
  const title = image.alt || "AI 生图作品";
  const imageSrc = image.currentSrc || image.src;
  previewTitle.textContent = title;
  previewLink.href = imageSrc;
  previewFrame.removeAttribute("src");
  previewFrame.srcdoc = `
    <style>
      body{margin:0;background:#050506;display:grid;place-items:center;min-height:100vh;padding:24px;box-sizing:border-box}
      img{display:block;max-width:100%;max-height:88vh;object-fit:contain;border:1px solid rgba(245,240,223,.18);border-radius:8px;box-shadow:0 28px 90px rgba(0,0,0,.5)}
    </style>
    <img src="${imageSrc}" alt="${escapeHtml(title)}">
  `;
  preview.hidden = false;
  document.body.style.overflow = "hidden";
}

function setupGalleryCarousel() {
  if (!galleryTrack || galleryImages.length < 2) return;

  let activeIndex = 0;
  let autoTimer = null;
  let resumeTimer = null;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let isDragging = false;
  let didDrag = false;

  const getClosestIndex = () => {
    const currentLeft = galleryTrack.scrollLeft;
    return galleryImages.reduce((closestIndex, image, index) => {
      const closestDistance = Math.abs(galleryImages[closestIndex].offsetLeft - currentLeft);
      const distance = Math.abs(image.offsetLeft - currentLeft);
      return distance < closestDistance ? index : closestIndex;
    }, 0);
  };

  const scrollToImage = (index, behavior = "smooth") => {
    activeIndex = (index + galleryImages.length) % galleryImages.length;
    galleryTrack.scrollTo({
      left: galleryImages[activeIndex].offsetLeft,
      behavior,
    });
  };

  const stopAuto = () => {
    clearInterval(autoTimer);
    autoTimer = null;
  };

  const startAuto = () => {
    if (!mobileGalleryQuery.matches || autoTimer) return;
    autoTimer = setInterval(() => {
      scrollToImage(getClosestIndex() + 1);
    }, 2600);
  };

  const pauseThenResume = () => {
    stopAuto();
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(startAuto, 3200);
  };

  galleryTrack.addEventListener("pointerdown", (event) => {
    isDragging = true;
    didDrag = false;
    startX = event.clientX;
    startY = event.clientY;
    startScrollLeft = galleryTrack.scrollLeft;
    galleryTrack.classList.add("is-dragging");
    pauseThenResume();
  });

  galleryTrack.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (Math.abs(deltaX) > 7 && Math.abs(deltaX) > Math.abs(deltaY)) {
      didDrag = true;
      galleryTrack.scrollLeft = startScrollLeft - deltaX;
    }
  });

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    galleryTrack.classList.remove("is-dragging");
    activeIndex = getClosestIndex();
  };

  galleryTrack.addEventListener("pointerup", endDrag);
  galleryTrack.addEventListener("pointercancel", endDrag);
  galleryTrack.addEventListener("pointerleave", endDrag);

  galleryImages.forEach((image) => {
    image.addEventListener("click", () => {
      if (didDrag) return;
      pauseThenResume();
      openGalleryImage(image);
    });
  });

  const galleryVisibilityObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        startAuto();
      } else {
        stopAuto();
      }
    },
    { threshold: 0.35 },
  );

  galleryVisibilityObserver.observe(galleryTrack);
  mobileGalleryQuery.addEventListener("change", () => {
    stopAuto();
    clearTimeout(resumeTimer);
    if (mobileGalleryQuery.matches) startAuto();
  });
}

setupGalleryCarousel();

const revealItems = document.querySelectorAll(
  ".section-head, .gallery-track img, .timeline li, .service-grid article, .contact",
);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 },
);

revealItems.forEach((item) => {
  item.classList.add("reveal");
  observer.observe(item);
});
