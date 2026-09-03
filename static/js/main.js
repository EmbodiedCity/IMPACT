(() => {
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('visible'));
  }

  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const sections = [...document.querySelectorAll('main section[id]')];
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!current) return;
      navLinks.forEach((link) => link.classList.toggle('active', link.hash === `#${current.target.id}`));
    }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });
    sections.forEach((section) => navObserver.observe(section));
  }

  const galleryGroups = [
    {
      target: 'robot-gallery-matrix',
      columns: ['WoW', 'CogVideoX', 'CtrlWorld', 'MSE', 'IMPACT'],
      labels: ['WoW', 'CogVideoX', 'CtrlWorld', 'Wan 2.2-AC', 'Wan 2.2-AC + IMPACT'],
      cases: [
        ['robot-038', 'Printed sneaker placement'],
        ['robot-042', 'Bottle placement'],
        ['robot-047', 'Block placement'],
        ['robot-059', 'Bimanual pot lifting'],
        ['robot-080', 'Block stacking'],
        ['robot-108', 'Shoe placement'],
        ['robot-143', 'Bowl stacking'],
        ['robot-169', 'Service-bell pressing'],
        ['robot-220', 'Food-toy placement']
      ]
    },
    {
      target: 'human-gallery-matrix',
      columns: ['HunyuanVideo', 'VACE', 'MimicMotion', 'MSE', 'IMPACT'],
      labels: ['HunyuanVideo-1.5', 'VACE', 'MimicMotion', 'Wan 2.2-AC', 'Wan 2.2-AC + IMPACT'],
      cases: [
        ['hand-008', 'Elephant-toy pickup'],
        ['hand-011', 'Container lifting'],
        ['hand-012', 'Cylindrical-object lifting'],
        ['hand-015', 'Drawer stacking'],
        ['hand-031', 'Block-structure adjustment'],
        ['hand-043', 'Book pickup'],
        ['hand-050', 'Bowl stacking']
      ]
    }
  ];
  galleryGroups.forEach((group) => {
    const matrix = document.getElementById(group.target);
    if (!matrix) return;
    const header = document.createElement('div');
    header.className = 'comparison-header';
    header.innerHTML = '<span>Task</span>' + group.labels.map((label, index) => {
      const cls = index === 3 ? ' class="mse-head"' : index === 4 ? ' class="impact-head"' : '';
      return `<b${cls}>${label}</b>`;
    }).join('');
    matrix.appendChild(header);
    group.cases.forEach(([folder, title]) => {
      const row = document.createElement('div');
      row.className = 'comparison-row';
      row.innerHTML = `<div class="comparison-case"><strong>${title}</strong></div>` + group.columns.map((method, index) => {
        const cls = index === 3 ? ' class="mse-video"' : index === 4 ? ' class="impact-video"' : '';
        const root = `static/media/gallery/${folder}/${method}`;
        return `<video${cls} muted loop playsinline preload="none" poster="${root}.jpg?v=20260903-nobars"><source src="${root}.mp4?v=20260903-nobars" type="video/mp4"></video>`;
      }).join('');
      matrix.appendChild(row);
    });
  });
  const galleryRows = [...document.querySelectorAll('.comparison-row')];
  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.querySelectorAll('video').forEach((video) => {
          if (entry.isIntersecting) video.play().catch(() => {});
          else video.pause();
        });
      });
    }, { rootMargin: '160px 0px', threshold: 0.05 });
    galleryRows.forEach((row) => videoObserver.observe(row));
  }

  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxClose = document.getElementById('lightbox-close');
  const bindLightbox = (figure) => {
    figure.addEventListener('click', () => {
      const image = figure.querySelector('img');
      if (!image) return;
      lightboxImage.src = image.src;
      lightboxImage.alt = figure.dataset.lightbox || image.alt;
      lightbox.classList.add('open');
      document.body.classList.add('modal-open');
    });
  };
  const contributionTabs = [...document.querySelectorAll('.contribution-tab')];
  const contributionPanels = [...document.querySelectorAll('.contribution-panel')];
  contributionTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.contribution;
      contributionTabs.forEach((item) => {
        const selected = item === tab;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-selected', selected ? 'true' : 'false');
      });
      contributionPanels.forEach((panel) => {
        const selected = panel.dataset.panel === target;
        panel.hidden = !selected;
        panel.classList.toggle('active', selected);
        if (selected) panel.querySelectorAll('video').forEach((video) => video.play().catch(() => {}));
      });
    });
  });

  const methodCanvas = document.querySelector('.method-canvas');
  const methodSvgObject = document.getElementById('method-svg-object');
  const methodSteps = [...document.querySelectorAll('.method-step')];
  const timelineFill = document.querySelector('.timeline-progress span');
  const methodCaption = document.querySelector('.method-caption');
  const methodStages = [
    { title: 'Object-token grounding', text: 'Identify “blue bowl” as the manipulated object.' },
    { title: 'Condition encoding', text: 'Encode the instruction, input frame, noise, and optional control signal.' },
    { title: 'Object-conditioned attention', text: 'Read the blue-bowl cross-attention as proposal A.' },
    { title: 'Attention Distribution Sampling', text: 'Sample K candidates and calibrate them into interaction map G.' },
    { title: 'Interaction-Weighted Supervision', text: 'Use G to target denoising supervision while protecting the attention prior.' }
  ];
  let methodTimer;
  let currentStage = 0;
  const setMethodStage = (index, manual = false) => {
    if (!methodCanvas) return;
    currentStage = index;
    const stage = methodStages[index];
    methodCanvas.dataset.stage = index;
    const nextSource = `static/media/method_stages/stage_${index}.svg?v=20260903-5`;
    if (methodSvgObject && !methodSvgObject.data.endsWith(nextSource)) methodSvgObject.data = nextSource;
    methodCaption.innerHTML = `<b>${stage.title}</b><span>${stage.text}</span>`;
    methodSteps.forEach((step, i) => step.classList.toggle('active', i === index));
    timelineFill.style.width = `${index * 25}%`;
    if (manual) {
      clearInterval(methodTimer);
      if (index < methodStages.length - 1) {
        methodTimer = setInterval(() => {
          if (currentStage < methodStages.length - 1) setMethodStage(currentStage + 1);
          else clearInterval(methodTimer);
        }, 1800);
      }
    }
  };
  methodSteps.forEach((step, index) => step.addEventListener('click', () => setMethodStage(index, true)));
  setMethodStage(0);
  const methodSection = document.getElementById('method');
  if ('IntersectionObserver' in window && methodSection) {
    const methodObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        clearInterval(methodTimer);
        if (entry.isIntersecting) {
          setMethodStage(0);
          methodTimer = setInterval(() => {
            if (currentStage < methodStages.length - 1) setMethodStage(currentStage + 1);
            else clearInterval(methodTimer);
          }, 1800);
        }
      });
    }, { threshold: 0.18 });
    methodObserver.observe(methodSection);
  } else {
    methodTimer = setInterval(() => {
      if (currentStage < methodStages.length - 1) setMethodStage(currentStage + 1);
      else clearInterval(methodTimer);
    }, 1800);
  }

  document.querySelectorAll('.interactive').forEach(bindLightbox);
  const closeLightbox = () => {
    lightbox.classList.remove('open');
    document.body.classList.remove('modal-open');
    lightboxImage.src = '';
  };
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeLightbox(); });

  const copyButton = document.getElementById('citation-copy');
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(document.getElementById('citation-text').innerText.trim());
      copyButton.textContent = 'Copied';
      setTimeout(() => { copyButton.textContent = 'Copy'; }, 1400);
    } catch {
      copyButton.textContent = 'Select text';
    }
  });
})();
