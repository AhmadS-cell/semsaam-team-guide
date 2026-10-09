(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isHomePage = body.dataset.page === "home";
  const mobileViewport = window.matchMedia("(max-width: 860px)");
  const hasGsap = typeof window.gsap !== "undefined";
  const hasScrollTrigger = hasGsap && typeof window.ScrollTrigger !== "undefined";

  if (hasScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  if (isHomePage) {
    qsa("main img").forEach((image) => {
      image.decoding = "async";
      if (!image.closest(".hero") && !image.hasAttribute("loading")) {
        image.loading = "lazy";
      }
    });
  }

  const closeMobileMenu = () => {
    qsa("[data-mobile-panel]").forEach((panel) => panel.classList.remove("is-open"));
    qsa("[data-menu-toggle]").forEach((button) => button.setAttribute("aria-expanded", "false"));
    body.classList.remove("menu-open");
  };

  qsa("[data-menu-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = qs("[data-mobile-panel]");
      const open = panel && !panel.classList.contains("is-open");
      if (!panel) return;
      panel.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
      body.classList.toggle("menu-open", open);
    });
  });

  qsa("[data-mobile-panel] a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  qsa("[data-carousel]").forEach((carousel) => {
    const track = qs("[data-carousel-track]", carousel);
    if (!track) return;

    const move = (direction) => {
      const amount = track.clientWidth * 0.82 * direction;
      const target = Math.max(0, Math.min(track.scrollWidth - track.clientWidth, track.scrollLeft + amount));
      if (hasGsap && !reduceMotion) {
        const state = { x: track.scrollLeft };
        window.gsap.to(state, {
          x: target,
          duration: .55,
          ease: "power3.out",
          onUpdate: () => {
            track.scrollLeft = state.x;
          }
        });
      } else {
        track.scrollTo({ left: target, behavior: reduceMotion ? "auto" : "smooth" });
      }
    };

    carousel.carouselMove = move;
  });

  qsa("[data-carousel-prev], [data-carousel-next]").forEach((button) => {
    button.addEventListener("click", () => {
      const scope = button.closest(".container") || document;
      const carousel = qs(".carousel-shell[data-carousel]", scope);
      if (!carousel?.carouselMove) return;
      carousel.carouselMove(button.matches("[data-carousel-next]") ? 1 : -1);
    });
  });

  qsa("[data-hero-slider]").forEach((slider) => {
    const slides = qsa("[data-hero-slide]", slider);
    const dots = qsa("[data-hero-dot]", slider);
    const prev = qs("[data-hero-prev]", slider);
    const next = qs("[data-hero-next]", slider);
    if (!slides.length) return;

    let activeIndex = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));
    let animating = false;
    let touchStartX = 0;
    let didSwipe = false;
    let sliderInView = true;

    const syncHeroVideos = () => {
      qsa("[data-hero-video]", slider).forEach((video) => {
        const isActive = video.closest("[data-hero-slide]")?.classList.contains("is-active");
        if (!isActive || reduceMotion || document.hidden || !sliderInView) {
          window.clearTimeout(video.heroReadyTimer);
          video.classList.remove("is-ready");
          video.pause();
          if (!isActive) video.currentTime = 0;
          return;
        }

        const revealVideo = () => {
          window.clearTimeout(video.heroReadyTimer);
          video.heroReadyTimer = window.setTimeout(() => {
            video.classList.add("is-ready");
          }, 260);
        };
        const playRequest = video.play();
        if (playRequest?.then) {
          playRequest.then(revealVideo).catch(() => {});
        } else {
          revealVideo();
        }
      });
    };

    const setState = (index) => {
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === index;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
        slide.tabIndex = active ? 0 : -1;
      });

      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === index;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", String(active));
      });

      activeIndex = index;
      syncHeroVideos();
    };

    const showSlide = (targetIndex, direction = 1) => {
      const index = (targetIndex + slides.length) % slides.length;
      if (index === activeIndex || animating) return;

      const currentSlide = slides[activeIndex];
      const nextSlide = slides[index];
      const finish = () => {
        setState(index);
        if (hasGsap) {
          window.gsap.set(slides, { clearProps: "opacity,visibility,transform,zIndex" });
        }
        animating = false;
      };

      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === index;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", String(active));
      });

      if (hasGsap && !reduceMotion) {
        animating = true;
        nextSlide.classList.add("is-active");
        nextSlide.setAttribute("aria-hidden", "false");
        window.gsap.killTweensOf([currentSlide, nextSlide]);
        window.gsap.set(nextSlide, { autoAlpha: 1, xPercent: direction * 5, scale: 1.015, zIndex: 2 });
        window.gsap.set(currentSlide, { autoAlpha: 1, xPercent: 0, scale: 1, zIndex: 1 });
        window.gsap.timeline({ onComplete: finish })
          .to(currentSlide, { autoAlpha: 0, xPercent: direction * -4, scale: .99, duration: .26, ease: "power2.out" }, 0)
          .to(nextSlide, { autoAlpha: 1, xPercent: 0, scale: 1, duration: .44, ease: "power3.out" }, 0);
      } else {
        finish();
      }
    };

    setState(activeIndex);
    document.addEventListener("visibilitychange", syncHeroVideos);

    if ("IntersectionObserver" in window) {
      const heroObserver = new IntersectionObserver((entries) => {
        sliderInView = entries[0]?.isIntersecting ?? true;
        syncHeroVideos();
      }, {
        rootMargin: "180px 0px",
        threshold: .04
      });
      heroObserver.observe(slider);
    }

    prev?.addEventListener("click", () => showSlide(activeIndex - 1, -1));
    next?.addEventListener("click", () => showSlide(activeIndex + 1, 1));

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => showSlide(index, index > activeIndex ? 1 : -1));
    });

    slider.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showSlide(activeIndex - 1, -1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showSlide(activeIndex + 1, 1);
      }
    });

    slider.addEventListener("touchstart", (event) => {
      touchStartX = event.changedTouches[0]?.clientX || 0;
      didSwipe = false;
    }, { passive: true });

    slider.addEventListener("touchend", (event) => {
      const touchEndX = event.changedTouches[0]?.clientX || 0;
      const deltaX = touchEndX - touchStartX;
      if (Math.abs(deltaX) < 44) return;
      didSwipe = true;
      showSlide(activeIndex + (deltaX < 0 ? 1 : -1), deltaX < 0 ? 1 : -1);
    }, { passive: true });

    slider.addEventListener("click", (event) => {
      if (!didSwipe) return;
      event.preventDefault();
      didSwipe = false;
    }, true);
  });

  qsa("[data-add-cart]").forEach((button) => {
    button.addEventListener("click", () => {
      const addedText = button.dataset.addedText || "Added";
      const defaultText = button.dataset.defaultText || button.textContent.trim();
      button.classList.add("is-added");
      button.textContent = addedText;
      setTimeout(() => {
        button.classList.remove("is-added");
        button.textContent = defaultText;
      }, 1400);
    });
  });

  qsa("[data-subscribe-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const note = qs("[data-form-note]", form.parentElement);
      const isArabic = root.dir === "rtl";
      if (note) {
        note.textContent = isArabic ? "تم تسجيل بريدك للعروض القادمة." : "You are on the list for the next offers.";
      }
      form.reset();
    });
  });

  qsa("[data-choice-group]").forEach((group) => {
    qsa("button", group).forEach((button) => {
      button.addEventListener("click", () => {
        qsa("button", group).forEach((item) => {
          item.classList.toggle("is-active", item === button);
          item.setAttribute("aria-pressed", String(item === button));
        });
      });
    });
  });

  const gallery = qs("[data-gallery]");
  if (gallery) {
    const mainImage = qs("[data-gallery-main]", gallery);
    qsa("[data-gallery-thumb]", gallery).forEach((thumb) => {
      thumb.addEventListener("click", () => {
        if (!mainImage || thumb.classList.contains("is-active")) return;
        qsa("[data-gallery-thumb]", gallery).forEach((item) => item.classList.remove("is-active"));
        thumb.classList.add("is-active");
        const nextSrc = thumb.dataset.image;
        const nextAlt = thumb.dataset.alt || mainImage.alt;
        const swap = () => {
          mainImage.src = nextSrc;
          mainImage.alt = nextAlt;
        };
        if (hasGsap && !reduceMotion) {
          window.gsap.to(mainImage, {
            opacity: 0,
            scale: .985,
            duration: .16,
            ease: "power1.out",
            onComplete: () => {
              swap();
              window.gsap.to(mainImage, { opacity: 1, scale: 1, duration: .24, ease: "power2.out" });
            }
          });
        } else {
          swap();
        }
      });
    });
  }

  qsa("[data-tabs]").forEach((tabs) => {
    const buttons = qsa("[data-tab]", tabs);
    const panels = qsa("[data-tab-panel]", tabs);
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = button.dataset.tab;
        buttons.forEach((item) => {
          item.classList.toggle("is-active", item === button);
          item.setAttribute("aria-selected", String(item === button));
        });
        panels.forEach((panel) => {
          panel.classList.toggle("is-active", panel.dataset.tabPanel === target);
        });
      });
    });
  });

  qsa("[data-setup-preview]").forEach((preview) => {
    const upload = qs("[data-setup-upload]", preview);
    const sampleButton = qs("[data-setup-sample]", preview);
    const status = qs("[data-setup-status]", preview);
    const photos = qsa("[data-setup-photo]", preview);
    const sampleSrc = preview.dataset.sampleSrc || photos[0]?.getAttribute("src") || "";
    const sampleText = preview.dataset.sampleText || "";
    const uploadedText = preview.dataset.uploadedText || "";
    let objectUrl = "";

    const setPhotos = (src) => {
      photos.forEach((photo) => {
        photo.src = src;
      });
    };

    const revokePreviewUrl = () => {
      if (!objectUrl) return;
      URL.revokeObjectURL(objectUrl);
      objectUrl = "";
    };

    upload?.addEventListener("change", () => {
      const file = upload.files && upload.files[0];
      if (!file || !file.type.startsWith("image/")) return;
      revokePreviewUrl();
      objectUrl = URL.createObjectURL(file);
      setPhotos(objectUrl);
      preview.classList.add("has-upload");
      if (status) status.textContent = uploadedText;
    });

    sampleButton?.addEventListener("click", () => {
      revokePreviewUrl();
      setPhotos(sampleSrc);
      preview.classList.remove("has-upload");
      if (upload) upload.value = "";
      if (status) status.textContent = sampleText;
    });
  });

  qsa("[data-before-after-slider]").forEach((slider) => {
    const stage = qs("[data-compare-stage]", slider);
    const handle = qs("[data-compare-handle]", slider);
    if (!stage || !handle) return;

    const mobileAxis = window.matchMedia("(max-width: 860px)");
    let dragging = false;
    let currentValue = Number.parseFloat(handle.getAttribute("aria-valuenow") || "52");

    const setComparePosition = (value) => {
      currentValue = Math.max(0, Math.min(100, value));
      slider.style.setProperty("--compare-pos", `${currentValue}%`);
      handle.setAttribute("aria-valuenow", String(Math.round(currentValue)));
    };

    const updateFromPointer = (event) => {
      const rect = stage.getBoundingClientRect();
      const rawValue = mobileAxis.matches
        ? ((event.clientY - rect.top) / rect.height) * 100
        : ((event.clientX - rect.left) / rect.width) * 100;
      setComparePosition(rawValue);
    };

    stage.addEventListener("pointerdown", (event) => {
      dragging = true;
      stage.setPointerCapture?.(event.pointerId);
      updateFromPointer(event);
    });

    stage.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      updateFromPointer(event);
    });

    ["pointerup", "pointercancel", "lostpointercapture"].forEach((eventName) => {
      stage.addEventListener(eventName, () => {
        dragging = false;
      });
    });

    handle.addEventListener("keydown", (event) => {
      const step = event.shiftKey ? 10 : 4;
      let nextValue = currentValue;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextValue -= step;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextValue += step;
      if (event.key === "Home") nextValue = 0;
      if (event.key === "End") nextValue = 100;
      if (nextValue === currentValue) return;
      event.preventDefault();
      setComparePosition(nextValue);
    });

    setComparePosition(currentValue);
  });

  const sheetBackdrop = qs("[data-sheet-backdrop]");
  const filterSheet = qs("[data-filter-sheet]");
  const setSheet = (open) => {
    filterSheet?.classList.toggle("is-open", open);
    sheetBackdrop?.classList.toggle("is-open", open);
    body.classList.toggle("sheet-open", open);
    qsa("[data-filter-toggle]").forEach((button) => button.setAttribute("aria-expanded", String(open)));
  };

  qsa("[data-filter-toggle]").forEach((button) => button.addEventListener("click", () => setSheet(true)));
  qsa("[data-filter-close]").forEach((button) => button.addEventListener("click", () => setSheet(false)));
  sheetBackdrop?.addEventListener("click", () => setSheet(false));

  const productList = qs("[data-product-list]");
  const productCount = qs("[data-product-count]");
  const sortSelect = qs("[data-sort]");
  const filterButtons = qsa("[data-filter-value]");
  const resetFilters = qs("[data-reset-filters]");

  const activeValue = (group) => {
    const active = qs(`[data-filter-group="${group}"] .is-active[data-filter-value]`);
    return active?.dataset.filterValue || "all";
  };

  const applyProductFilters = () => {
    if (!productList) return;
    const category = activeValue("category");
    const color = activeValue("color");
    const products = qsa("[data-product-card]", productList);
    let visible = 0;

    products.forEach((card) => {
      const matchCategory = category === "all" || card.dataset.category === category;
      const matchColor = color === "all" || (card.dataset.colors || "").split(",").includes(color);
      const show = matchCategory && matchColor;
      card.hidden = !show;
      visible += show ? 1 : 0;
    });

    if (productCount) {
      const isArabic = root.dir === "rtl";
      productCount.textContent = isArabic ? `${visible} منتجات` : `${visible} products`;
    }
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.closest("[data-filter-group]");
      if (!group) return;
      qsa("[data-filter-value]", group).forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      applyProductFilters();
    });
  });

  resetFilters?.addEventListener("click", () => {
    qsa("[data-filter-group]").forEach((group) => {
      qsa("[data-filter-value]", group).forEach((button, index) => button.classList.toggle("is-active", index === 0));
    });
    applyProductFilters();
  });

  sortSelect?.addEventListener("change", () => {
    if (!productList) return;
    const cards = qsa("[data-product-card]", productList);
    const value = sortSelect.value;
    const sorted = cards.sort((a, b) => {
      if (value === "price-low") return Number(a.dataset.price) - Number(b.dataset.price);
      if (value === "price-high") return Number(b.dataset.price) - Number(a.dataset.price);
      if (value === "rating") return Number(b.dataset.rating) - Number(a.dataset.rating);
      return a.dataset.name.localeCompare(b.dataset.name);
    });
    sorted.forEach((card) => productList.appendChild(card));
  });

  qs("[data-view-more]")?.addEventListener("click", (event) => {
    qsa(".hidden-product").forEach((card) => card.classList.remove("hidden-product"));
    event.currentTarget.hidden = true;
    applyProductFilters();
  });

  applyProductFilters();

  if (body.dataset.page === "product-details") {
    body.classList.add("has-sticky-buy");
  }

  if (hasGsap && !reduceMotion) {
    window.gsap.from(".hero-visual", { opacity: 0, y: 34, duration: .75, ease: "power3.out" });
    window.gsap.from(".hero-copy > *", { opacity: 0, y: 24, duration: .65, stagger: .08, ease: "power3.out", delay: .12 });

    const revealElements = qsa(".reveal");
    const shouldRevealOnScroll = !(isHomePage && mobileViewport.matches);

    if (shouldRevealOnScroll && revealElements.length) {
      if (hasScrollTrigger && window.ScrollTrigger.batch) {
        window.gsap.set(revealElements, { autoAlpha: 0, y: 24, willChange: "transform,opacity" });
        window.ScrollTrigger.batch(revealElements, {
          start: "top 88%",
          once: true,
          batchMax: 4,
          onEnter: (batch) => {
            window.gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: .48,
              stagger: .05,
              ease: "power2.out",
              overwrite: true,
              clearProps: "willChange"
            });
          }
        });
      } else {
        revealElements.forEach((element) => {
          window.gsap.from(element, {
            opacity: 0,
            y: 24,
            duration: .48,
            ease: "power2.out"
          });
        });
      }
    }

    if (!isHomePage && !mobileViewport.matches) {
      qsa(".setup-transform-panel").forEach((element) => {
        window.gsap.to(element, {
          "--pattern-x": "28px",
          duration: 12,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      });
    }
  }
})();
