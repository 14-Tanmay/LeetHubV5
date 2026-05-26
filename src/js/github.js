/* Shared GitHub Logic for LeetHub 5.0 */

function constructGitHubPath(
  hook,
  basePath,
  difficulty,
  problem,
  filename,
  useDifficultyFolder,
  useLanguageFolder = false,
) {
  const filePath = problem ? `${problem}/${filename}` : `${filename}`;
  if (useLanguageFolder) {
    const language = last_language;
    console.log('Language:', language);
    if (language) {
      const path = useDifficultyFolder
        ? `${language}/${difficulty}/${filePath}`
        : `${language}/${filePath}`;
      return `https://api.github.com/repos/${hook}/contents/${path}`;
    }
  }
  const path = useDifficultyFolder ? `${basePath}/${difficulty}/${filePath}` : `${filePath}`;
  return `https://api.github.com/repos/${hook}/contents/${path}`;
}

const parseCustomCommitMessage = (text, problemContext) => {
  return text.replace(/{(\w+)}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(problemContext, key) ? problemContext[key] : match;
  });
};

/* returns custom commit message or null if doesn't exist */
const getCustomCommitMessage = problemContext => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('custom_commit_message', result => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (!result.custom_commit_message || !result.custom_commit_message.trim()) {
        resolve(null); // no custom message is set
      } else {
        const finalCommitMessage = parseCustomCommitMessage(
          result.custom_commit_message,
          problemContext,
        );
        resolve(finalCommitMessage);
      }
    });
  });
};

/* Main function for uploading code to GitHub repo, and callback cb is called if success */
const upload = (
  token,
  hook,
  code,
  problem,
  filename,
  sha,
  commitMsg,
  cb = undefined,
  useDifficultyFolder,
  useLanguageFolder,
) => {
  // const URL = `https://api.github.com/repos/${hook}/contents/${problem}/${filename}`;
  const URL = constructGitHubPath(
    hook,
    basePath,
    difficulty,
    problem,
    filename,
    useDifficultyFolder,
    useLanguageFolder,
  );

  /* Define Payload */
  let data = {
    message: commitMsg,
    content: code,
    sha,
  };

  data = JSON.stringify(data);

  let options = {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
    body: data,
  };
  let updatedSha;

  return fetch(URL, options)
    .then(res => {
      if (res.status === 200 || res.status === 201) {
        return res.json();
      }
      throw new Error(res.status);
    })
    .then(async body => {
      updatedSha = body.content.sha; // get updated SHA.
      const stats = await getAndInitializeStats(problem);
      stats.shas[problem][filename] = updatedSha;
      return chrome.storage.local.set({ stats });
    })
    .then(() => {
      console.log(`Successfully committed ${filename} to github`);
      if (cb != undefined) {
        cb();
      }
    });
};

const getAndInitializeStats = problem => {
  return chrome.storage.local.get('stats').then(({ stats }) => {
    if (stats == null || stats == {}) {
      // create stats object
      stats = {};
      stats.solved = 0;
      stats.easy = 0;
      stats.medium = 0;
      stats.hard = 0;
      stats.shas = {};
    }

    if (!stats.shas) {
      stats.shas = {};
    }

    if (stats.shas[problem] == null) {
      stats.shas[problem] = {};
    }

    return stats;
  });
};

const incrementStats = () => {
  return chrome.storage.local.get('stats').then(({ stats }) => {
    // Legacy/global tracking
    stats.solved += 1;
    stats.easy += difficulty === 'Easy' ? 1 : 0;
    stats.medium += difficulty === 'Medium' ? 1 : 0;
    stats.hard += difficulty === 'Hard' ? 1 : 0;

    // Platform specific tracking
    if (typeof basePath !== 'undefined' && basePath) {
      if (!stats.platformStats) stats.platformStats = {};
      if (!stats.platformStats[basePath]) {
        stats.platformStats[basePath] = { solved: 0, easy: 0, medium: 0, hard: 0 };
      }

      stats.platformStats[basePath].solved += 1;
      stats.platformStats[basePath].easy += difficulty === 'Easy' ? 1 : 0;
      stats.platformStats[basePath].medium += difficulty === 'Medium' ? 1 : 0;
      stats.platformStats[basePath].hard += difficulty === 'Hard' ? 1 : 0;
    }

    return chrome.storage.local.set({ stats });
  });
};

const checkAlreadyCompleted = async problemName => {
  const { stats } = await chrome.storage.local.get('stats');
  return stats?.shas?.[problemName] ?? false;
};

/* Main function for updating code on GitHub Repo */
/* Read from existing file on GitHub */
/* Discussion posts prepended at top of README */
/* Future implementations may require appending to bottom of file */
const update = (
  token,
  hook,
  addition,
  problem,
  filename,
  commitMsg,
  shouldPreprendDiscussionPosts,
  cb = undefined,
  useDifficultyFolder,
  useLanguageFolder,
) => {
  let responseSHA;
  return getUpdatedData(token, hook, problem, filename, useDifficultyFolder, useLanguageFolder)
    .then(data => {
      responseSHA = data.sha;
      return decodeURIComponent(escape(atob(data.content)));
    })
    .then(existingContent =>
      shouldPreprendDiscussionPosts
        ? // https://web.archive.org/web/20190623091645/https://monsur.hossa.in/2012/07/20/utf-8-in-javascript.html
          // In order to preserve mutation of the data, we have to encode it, which is usually done in base64.
          // But btoa only accepts ASCII 7 bit chars (0-127) while Javascript uses 16-bit minimum chars (0-65535).
          // EncodeURIComponent converts the Unicode Points UTF-8 bits to hex UTF-8.
          // Unescape converts percent-encoded hex values into regular ASCII (optional; it shrinks string size).
          // btoa converts ASCII to base64.
          btoa(unescape(encodeURIComponent(addition + existingContent)))
        : btoa(unescape(encodeURIComponent(existingContent))),
    )
    .then(newContent =>
      upload(
        token,
        hook,
        newContent,
        problem,
        filename,
        responseSHA,
        commitMsg,
        cb,
        useDifficultyFolder,
        useLanguageFolder,
      ),
    );
};

function uploadGit(
  code,
  problemName,
  fileName,
  commitMsg,
  action,
  shouldPrependDiscussionPosts = false,
  cb = undefined,
  _diff = undefined,
) {
  // Assign difficulty
  if (_diff && _diff !== undefined) {
    difficulty = _diff.trim();
  }

  let token;
  let hook;
  let useDifficultyFolder = false;
  let useLanguageFolder = false;

  return chrome.storage.local
    .get('leethub_token')
    .then(({ leethub_token }) => {
      token = leethub_token;
      if (leethub_token == undefined) {
        throw new Error('leethub token is undefined');
      }
      return chrome.storage.local.get('mode_type');
    })
    .then(({ mode_type }) => {
      if (mode_type !== 'commit') {
        throw new Error('leethub mode is not commit');
      }
      return chrome.storage.local.get('leethub_hook');
    })
    .then(({ leethub_hook }) => {
      hook = leethub_hook;
      if (!hook) {
        throw new Error('leethub hook not defined');
      }
      return chrome.storage.local.get('useDifficultyFolder');
    })
    .then(result => {
      useDifficultyFolder = result.useDifficultyFolder || false;
      return chrome.storage.local.get('useLanguageFolder');
    })
    .then(result => {
      useLanguageFolder = result.useLanguageFolder || false;
      return chrome.storage.local.get('stats');
    })
    .then(({ stats }) => {
      if (action === 'upload') {
        /* Get SHA, if it exists */
        const sha = stats?.shas?.[problemName]?.[fileName] ?? '';

        return upload(
          token,
          hook,
          code,
          problemName,
          fileName,
          sha,
          commitMsg,
          cb,
          useDifficultyFolder,
          useLanguageFolder,
        );
      } else if (action === 'update') {
        return update(
          token,
          hook,
          code,
          problemName,
          fileName,
          commitMsg,
          shouldPrependDiscussionPosts,
          cb,
          useDifficultyFolder,
          useLanguageFolder,
        );
      }
    })
    .catch(err => {
      if (err.message === '409') {
        return getUpdatedData(
          token,
          hook,
          problemName,
          fileName,
          useDifficultyFolder,
          useLanguageFolder,
        );
      } else {
        throw err;
      }
    })
    .then(data =>
      data != null
        ? upload(
            token,
            hook,
            code,
            problemName,
            fileName,
            data.sha,
            commitMsg,
            cb,
            useDifficultyFolder,
            useLanguageFolder,
          )
        : undefined,
    );
}

/* Gets updated GitHub data for the specific file in repo in question */
async function getUpdatedData(
  token,
  hook,
  problem,
  filename,
  useDifficultyFolder,
  useLanguageFolder,
) {
  const URL = constructGitHubPath(
    hook,
    basePath,
    difficulty,
    problem,
    filename,
    useDifficultyFolder,
    useLanguageFolder,
  );

  let options = {
    method: 'GET',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  };

  return fetch(URL, options)
    .then(res => {
      if (res.status === 200 || res.status === 201) {
        return res.json();
      } else {
        console.log(`Fetch failed with status: ${res.status}`);
        return {};
      }
    })
    .catch(err => {
      console.log(`Fetch error: ${err.message}`);
      return {};
    });
}
