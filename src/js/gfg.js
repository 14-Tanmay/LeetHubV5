// GeeksforGeeks LeetHub Content Script

let gfgBasePath = 'GeeksforGeeks';

function getGFGCode() {
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      window.removeEventListener('leetHubGFGCodeRes', handler);
      const rawText = document.querySelector('.CodeMirror-lines, .ace_layer.ace_text-layer')?.innerText || '';
      resolve(rawText);
    }, 1000);

    const handler = (e) => {
      clearTimeout(timeout);
      window.removeEventListener('leetHubGFGCodeRes', handler);
      const code = e.detail;
      if (code) {
        resolve(code);
      } else {
        const rawText = document.querySelector('.CodeMirror-lines, .ace_layer.ace_text-layer')?.innerText || '';
        resolve(rawText);
      }
    };

    window.addEventListener('leetHubGFGCodeRes', handler);
    window.dispatchEvent(new Event('leetHubGFGCodeReq'));
  });
}

function getGFGProblemDetails() {
  // Try to find problem name
  let problemName = 'unknown-problem';
  const titleElem = document.querySelector('.problem-tab__name, .problemHeader_title__bH0q_');
  if (titleElem) {
    problemName = titleElem.innerText.trim();
  } else {
    // Fallback to URL
    const match = window.location.pathname.match(/problems\/([^\/]+)/);
    if (match) problemName = match[1];
  }

  // Find difficulty
  let difficulty = 'Medium'; // default
  const diffElem = document.querySelector(
    '.problem-tab__difficulty, .problemHeader_difficulty__S8X_2',
  );
  if (diffElem) difficulty = diffElem.innerText.trim();

  // Determine Language (default to generic extension if unknown)
  let language = 'cpp';
  const langSelect = document.querySelector('.ant-select-selection-item');
  if (langSelect) {
    const langText = langSelect.innerText.toLowerCase();
    if (langText.includes('java')) language = 'java';
    else if (langText.includes('python')) language = 'py';
    else if (langText.includes('c++') || langText.includes('cpp')) language = 'cpp';
    else if (langText.includes('c')) language = 'c';
    else if (langText.includes('javascript') || langText.includes('js')) language = 'js';
  }

  return { problemName, difficulty, language };
}

function injectGFGPushButton() {
  if (document.getElementById('leethub-gfg-push')) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'leethub-gfg-push';
  btn.style.cssText =
    'display: inline-flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; padding: 4px; z-index: 99; transition: transform 0.2s ease; margin-left: 8px; vertical-align: middle; position: relative;';

  let hoverState = false;
  btn.onmouseover = () => {
    btn.style.transform = 'scale(1.1)';
    hoverState = true;
    const tt = document.getElementById('leethub-gfg-tooltip');
    if (tt) {
      const rect = btn.getBoundingClientRect();
      tt.style.top = (rect.bottom + window.scrollY + 8) + 'px';
      tt.style.left = (rect.right + window.scrollX - 220) + 'px';
      tt.style.opacity = '1';
      tt.style.visibility = 'visible';
    }
  };
  btn.onmouseout = (e) => {
    btn.style.transform = 'scale(1)';
    hoverState = false;
    const tt = document.getElementById('leethub-gfg-tooltip');
    if (tt && e.relatedTarget !== tt && !tt.contains(e.relatedTarget)) {
      tt.style.opacity = '0';
      tt.style.visibility = 'hidden';
    }
  };

  btn.innerHTML = `
    <span id="leethub-gfg-status" style="display: none; height: 8px; width: 8px; border-radius: 50%; position: absolute; top: -2px; right: -2px;"></span>
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 114.8625 114.8625">
      <path fill="currentColor" d="m112.693375 52.3185-50.149-50.146875c-2.886625-2.88875-7.57075-2.88875-10.461375 0l-10.412625 10.4145 13.2095 13.2095C57.94975 24.759 61.47025 25.45475 63.9165 27.9015c2.461 2.462 3.150875 6.01275 2.087375 9.09375l12.732 12.7305c3.081-1.062 6.63325-.3755 9.09425 2.088875 3.4375 3.4365 3.4375 9.007375 0 12.44675-3.44 3.4395-9.00975 3.4395-12.45125 0-2.585375-2.587875-3.225125-6.387125-1.914-9.57275l-11.875-11.874V74.06075c.837375.415 1.628375.96775 2.326625 1.664 3.4375 3.437125 3.4375 9.007375 0 12.44975-3.4375 3.436-9.01125 3.436-12.44625 0-3.4375-3.442375-3.4375-9.012625 0-12.44975.849625-.848625 1.8335-1.490625 2.88325-1.920375V42.26925c-1.04975-.42975-2.03125-1.066375-2.88325-1.920875-2.6035-2.602625-3.23-6.424375-1.894625-9.622125L36.55325 17.701875 2.1660125 52.086125c-2.88818 2.891125-2.88818 7.57525 0 10.463875l50.1513625 50.146975c2.88725 2.88818125 7.569875 2.88818125 10.461375 0l49.914625-49.9146c2.889625-2.889125 2.889625-7.575625 0-10.463875"></path>
    </svg>`;

  const handleGFGUpload = async (suffix = '') => {
    // Check if the solution is accepted before allowing push
    let isAccepted = false;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.nodeValue.trim();
      if (text === 'Problem Solved Successfully' || text === 'Correct Answer' || text === 'Correct' || text === 'Submission Successful') {
        isAccepted = true;
        break;
      }
    }
    if (!isAccepted) {
      const confirmPush = confirm("LeetHub: We couldn't detect a 'Problem Solved Successfully' message. \n If you are pushing a past accepted solution, click OK to proceed.\n Otherwise, click Cancel and submit your code to get an accepted result first.");
      if (!confirmPush) {
        return;
      }
    }

    btn.disabled = true;
    const statusDot = document.getElementById('leethub-gfg-status');
    if (statusDot) {
      statusDot.style.display = 'inline-block';
      statusDot.style.backgroundColor = '#ffa500';
    }

    try {
      console.log('LeetHub GFG: Push button clicked, fetching code...');
      const code = await getGFGCode();
      console.log('LeetHub GFG: Code extracted, length:', code ? code.length : 'null/empty');
      if (!code) throw new Error('No code found');

      const { problemName, difficulty, language } = getGFGProblemDetails();
      console.log('LeetHub GFG: Problem details:', { problemName, difficulty, language });
      const slug = problemName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
        
      const finalSlug = suffix ? `${slug}${suffix}` : slug;
      const fileName = `${finalSlug}.${language}`;
      const problemPath = `${gfgBasePath}/${slug}`;
      console.log('LeetHub GFG: slug:', slug, 'problemPath:', problemPath, 'fileName:', fileName);

      const today = new Date();
      const problemContext = {
        time: '',
        space: '',
        language: language,
        problemName: problemName,
        difficulty: difficulty,
        date: `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}-${today.getFullYear()}`,
        problemTopic: '',
      };
      const customMsg = await getCustomCommitMessage(problemContext);
      const commitMsg = customMsg || `Add solution for ${problemName} [GeeksforGeeks]`;
      console.log('LeetHub GFG: commitMsg:', commitMsg);

      // Use shared github.js logic
      // Globals needed by github.js: difficulty, last_language, basePath
      window.difficulty = difficulty;
      window.last_language = language; // mapping needed?
      window.basePath = gfgBasePath;

      console.log('LeetHub GFG: Checking if already completed...');
      const alreadyCompleted = await checkAlreadyCompleted(problemPath);
      console.log('LeetHub GFG: alreadyCompleted:', alreadyCompleted);

      console.log('LeetHub GFG: Calling uploadGit...');
      await uploadGit(
        btoa(unescape(encodeURIComponent(code))),
        problemPath,
        fileName,
        commitMsg,
        'upload',
        false,
        () => {
          console.log('LeetHub GFG: Upload SUCCESS!');
          if (!alreadyCompleted) incrementStats();
          if (statusDot) {
            statusDot.style.backgroundColor = '#78b159';
          }
          setTimeout(() => {
            if (statusDot) statusDot.style.display = 'none';
            btn.disabled = false;
          }, 3000);
        },
        difficulty,
      );
    } catch (e) {
      console.error('LEETHUB GFG ERROR:', e.message, e.stack);
      if (statusDot) {
        statusDot.style.backgroundColor = 'red';
      }
      setTimeout(() => {
        if (statusDot) statusDot.style.display = 'none';
        btn.disabled = false;
      }, 3000);
    }
  };

  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    handleGFGUpload('');
  });

  btn.addEventListener('contextmenu', e => {
    e.preventDefault();
    e.stopPropagation();
    const suffix = prompt(
      'Add a suffix for this solution file, i.e., -bfs, -dfs. \nWe don\'t recommend includes special character except for "-".',
    );
    if (suffix && suffix.length <= 255) {
      handleGFGUpload(suffix);
    }
  });

  // Setup Tooltip
  const toolTip = document.createElement('div');
  toolTip.id = 'leethub-gfg-tooltip';
  toolTip.style.cssText = `
    position: absolute;
    margin-top: 12px;
    background: #2a2a2a;
    color: #fff;
    border-radius: 6px;
    padding: 12px;
    font-size: 13px;
    text-align: left;
    white-space: pre-line;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    width: 220px;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s, visibility 0.2s;
    cursor: default;
    z-index: 1000;
    font-family: inherit;
    border: 1px solid #444;
  `;

  chrome.storage.local.get('dontShowToolTip').then(({ dontShowToolTip }) => {
    if (!dontShowToolTip) {
      toolTip.textContent = 'You may select from earlier submissions to push. \n You may maintain multiple versions by adding a suffix with a right-click.';
      
      const dontShowContainer = document.createElement('div');
      dontShowContainer.style.cssText = 'display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px; font-size: 12px;';
      
      const checkBox = document.createElement('input');
      checkBox.type = 'checkbox';
      checkBox.id = 'dontShowCheckBoxGFG';
      checkBox.addEventListener('click', function (event) {
        event.stopPropagation();
        if (this.checked) {
          chrome.storage.local.set({ dontShowToolTip: true });
          toolTip.style.opacity = '0';
          toolTip.style.visibility = 'hidden';
          setTimeout(() => toolTip.remove(), 200);
        }
      });
      
      const label = document.createElement('label');
      label.htmlFor = 'dontShowCheckBoxGFG';
      label.textContent = 'dont show it again';
      label.style.cursor = 'pointer';
      
      dontShowContainer.appendChild(checkBox);
      dontShowContainer.appendChild(label);
      toolTip.appendChild(dontShowContainer);
      
      toolTip.addEventListener('click', event => event.stopPropagation());
      toolTip.onmouseleave = (e) => {
        if (e.relatedTarget !== btn && !btn.contains(e.relatedTarget)) {
          toolTip.style.opacity = '0';
          toolTip.style.visibility = 'hidden';
        }
      };
      document.body.appendChild(toolTip);

      if (hoverState) {
        const rect = btn.getBoundingClientRect();
        toolTip.style.top = (rect.bottom + window.scrollY + 8) + 'px';
        toolTip.style.left = (rect.right + window.scrollX - 220) + 'px';
        toolTip.style.opacity = '1';
        toolTip.style.visibility = 'visible';
      }
    }
  });
  // Set initial fixed styles so it is visible immediately
  btn.style.position = 'fixed';
  btn.style.bottom = '80px';
  btn.style.right = '30px';
  btn.style.color = 'inherit'; // Ensure currentColor works properly
  document.body.appendChild(btn);

  // Poll for the toolbar because GFG's React UI might take time to render
  let attempts = 0;
  const placementInterval = setInterval(() => {
    attempts++;
    let toolbar = null;

    // Method 1: Look for Start Timer button
    const elements = Array.from(document.querySelectorAll('span, div, button'));
    const timerEl = elements.find(el => el.textContent && el.textContent.trim() === 'Start Timer');
    if (timerEl) {
      let curr = timerEl.parentElement;
      while (curr && curr.tagName !== 'BODY') {
        // The header is wide but short (height <= 100). This prevents grabbing the entire split-pane editor!
        // It should also have at least 2 children (left side and right side).
        if (curr.offsetWidth > 300 && curr.offsetHeight >= 30 && curr.offsetHeight <= 100 && curr.children.length >= 2) {
          toolbar = curr;
          break;
        }
        curr = curr.parentElement;
      }
    }

    // Method 2: Look for language selector
    if (!toolbar) {
      const langSelect = document.querySelector('.ant-select, .ant-select-selection-item');
      if (langSelect) {
        let curr = langSelect.parentElement;
        while (curr && curr.tagName !== 'BODY') {
          if (curr.offsetWidth > 300 && curr.offsetHeight >= 30 && curr.offsetHeight <= 100 && curr.children.length >= 2) {
            toolbar = curr;
            break;
          }
          curr = curr.parentElement;
        }
      }
    }

    if (toolbar) {
      clearInterval(placementInterval);
      
      // Snap it into the toolbar
      btn.style.position = 'relative';
      btn.style.bottom = 'auto';
      btn.style.right = 'auto';
      btn.style.margin = '0 8px';
      // Fallback text color if inherit fails on dark mode backgrounds
      btn.style.color = 'var(--text-color, #9ca3af)';
      
      const lastChild = toolbar.lastElementChild;
      if (lastChild && lastChild.tagName !== 'BUTTON' && lastChild.tagName !== 'I' && lastChild.tagName !== 'SVG' && lastChild.children && lastChild.children.length > 0) {
        lastChild.style.display = 'flex';
        lastChild.style.alignItems = 'center';
        
        // Insert it exactly before the first right-side icon
        lastChild.prepend(btn);
      } else if (lastChild) {
        toolbar.insertBefore(btn, lastChild);
      } else {
        toolbar.appendChild(btn);
      }
    } else if (attempts >= 10) {
      clearInterval(placementInterval); // Give up after 10 attempts
    }
  }, 1000);
}

// Wait for page load
setTimeout(injectGFGPushButton, 1000);
