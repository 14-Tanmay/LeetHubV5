// GeeksforGeeks LeetHub Content Script

let gfgBasePath = 'GeeksforGeeks';

function getGFGCode() {
  return new Promise(resolve => {
    // Inject a script to extract code from Ace Editor
    const script = document.createElement('script');
    script.textContent = `
      try {
        let code = '';
        if (typeof ace !== 'undefined') {
          const editor = ace.edit(document.querySelector('.ace_editor'));
          code = editor.getValue();
        } else if (window.editor) {
          code = window.editor.getValue();
        }
        document.documentElement.setAttribute('data-gfg-code', encodeURIComponent(code));
      } catch(e) {
        console.error('LeetHub: Failed to extract GFG code', e);
      }
    `;
    document.body.appendChild(script);

    setTimeout(() => {
      const encodedCode = document.documentElement.getAttribute('data-gfg-code');
      if (encodedCode) {
        resolve(decodeURIComponent(encodedCode));
      } else {
        // Fallback: try to grab from DOM directly
        const rawText =
          document.querySelector('.CodeMirror-lines, .ace_layer.ace_text-layer')?.innerText || '';
        resolve(rawText);
      }
      script.remove();
    }, 500);
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
  btn.id = 'leethub-gfg-push';
  btn.style.cssText =
    'display: inline-flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; margin-left: 10px; padding: 4px;';

  btn.innerHTML = `
    <span id="leethub-gfg-status" style="display: none; height: 10px; width: 10px; border-radius: 50%; margin-right: 8px; margin-bottom: 2px;"></span>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 114.8625 114.8625">
      <path fill="#100f0d" d="m112.693375 52.3185-50.149-50.146875c-2.886625-2.88875-7.57075-2.88875-10.461375 0l-10.412625 10.4145 13.2095 13.2095C57.94975 24.759 61.47025 25.45475 63.9165 27.9015c2.461 2.462 3.150875 6.01275 2.087375 9.09375l12.732 12.7305c3.081-1.062 6.63325-.3755 9.09425 2.088875 3.4375 3.4365 3.4375 9.007375 0 12.44675-3.44 3.4395-9.00975 3.4395-12.45125 0-2.585375-2.587875-3.225125-6.387125-1.914-9.57275l-11.875-11.874V74.06075c.837375.415 1.628375.96775 2.326625 1.664 3.4375 3.437125 3.4375 9.007375 0 12.44975-3.4375 3.436-9.01125 3.436-12.44625 0-3.4375-3.442375-3.4375-9.012625 0-12.44975.849625-.848625 1.8335-1.490625 2.88325-1.920375V42.26925c-1.04975-.42975-2.03125-1.066375-2.88325-1.920875-2.6035-2.602625-3.23-6.424375-1.894625-9.622125L36.55325 17.701875 2.1660125 52.086125c-2.88818 2.891125-2.88818 7.57525 0 10.463875l50.1513625 50.146975c2.88725 2.88818125 7.569875 2.88818125 10.461375 0l49.914625-49.9146c2.889625-2.889125 2.889625-7.575625 0-10.463875"></path>
    </svg>`;
  btn.style.zIndex = '9999';

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const statusDot = document.getElementById('leethub-gfg-status');
    if (statusDot) {
      statusDot.style.display = 'inline-block';
      statusDot.style.backgroundColor = '#ffa500';
    }

    try {
      const code = await getGFGCode();
      if (!code) throw new Error('No code found');

      const { problemName, difficulty, language } = getGFGProblemDetails();
      const slug = problemName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const fileName = `${slug}.${language}`;

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

      // Use shared github.js logic
      // Globals needed by github.js: difficulty, last_language, basePath
      window.difficulty = difficulty;
      window.last_language = language; // mapping needed?
      window.basePath = gfgBasePath;

      const alreadyCompleted = await checkAlreadyCompleted(slug);

      await uploadGit(
        code,
        slug,
        fileName,
        commitMsg,
        'upload',
        false,
        () => {
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
      console.error('LeetHub GFG Push Error:', e);
      if (statusDot) {
        statusDot.style.backgroundColor = 'red';
      }
      setTimeout(() => {
        if (statusDot) statusDot.style.display = 'none';
        btn.disabled = false;
      }, 3000);
    }
  });

  document.body.appendChild(btn);
}

// Wait for page load
setTimeout(injectGFGPushButton, 3000);
