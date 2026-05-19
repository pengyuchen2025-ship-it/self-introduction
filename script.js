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
  const animatedItems = document.querySelectorAll(".words-pull-up, .fade-up");

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

function setActiveProject(projectId) {
  workMenuItems.forEach((item) => {
    item.classList.toggle("is-active", item.getAttribute("href") === `#${projectId}`);
  });
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

workMenuItems.forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    const targetId = item.getAttribute("href").slice(1);
    const target = projectById.get(targetId);
    if (target && workGrid) {
      setActiveProject(targetId);
      const stickyOffset = window.innerWidth <= 920 ? 156 : 126;
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
