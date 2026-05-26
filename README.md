<div align="center">
    <img src="assets/logo.png" alt="LeetHub 5.0">
</div>

<p align="center">
  <a href="https://github.com/14-Tanmay/LeetHubV5/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license"/>
  </a>
</p>

## What is LeetHub 5.0?

A browser extension that pushes your accepted solutions from coding platforms directly to your GitHub repository with a single click !

### Supported Platforms

LeetCode , GeeksforGeeks, CodeChef

## Features

- 🚀 **One-click push** — Git logo button injected directly into each platform's UI
- 📂 **Flexible folder structure** — Organize by difficulty, language, or flat
- 📝 **Custom commit messages** — Use variables like `{problemName}`, `{difficulty}`, `{language}`, `{date}`
- 🕐 **Timestamped filenames** — Preserve every submission version
- 🌙 **Modern dark UI** — Glassmorphism popup with smooth animations
- ✅ **Status indicators** — Minimalist green/red dot feedback on push
- 📊 **Platform-specific stats** — Track Easy/Medium/Hard counts per platform
  
*Note: GFG and CodeChef track only those submissions which are pushed to the github due to API restrictions.*

## Installation (Local / Unpacked)

This extension is designed for **local installation** as an unpacked Chrome extension. It is not published on the Chrome Web Store.

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/14-Tanmay/LeetHubV5.git
   ```

2. **Create your own GitHub OAuth app**

   Go to [GitHub Developer Settings](https://github.com/settings/applications/new) and register a new OAuth application:
   - **Application name:** LeetHub 5.0
   - **Homepage URL:** `https://github.com/14-Tanmay/LeetHubV5`
   - **Authorization callback URL:** `https://github.com/`

3. **Add your credentials**

   Update `CLIENT_ID` and `CLIENT_SECRET` in:
   - `src/js/authorize.js`
   - `src/js/oauth2.js`

4. **Load the extension in Chrome**

   - Navigate to `chrome://extensions`
   - Enable **Developer mode** (toggle in top-right corner)
   - Click **"Load unpacked"**
   - Select the cloned `LeetHubV5` folder

5. **You're all set!** Click the LeetHub icon in your toolbar to authenticate with GitHub and link a repository.

## Setup

1. After loading the extension, click the LeetHub icon in your toolbar
2. Click **"Authenticate"** to authorize with your GitHub account
3. Create a new private repository or link an existing one
4. Start solving problems — your solutions will be pushed to GitHub on a Single Cick of Push Button visible in your Editor!

## How to Push Solutions

-### LeetCode

**Pushing your most recent submission:**
1. Solve a problem and click **Submit**.
2. Once your solution is evaluated as "Accepted", simply click the **Git Push** icon located at the top right of the code editor.
3. The icon will turn into a spinning orange dot, and then green upon successful upload!

**Pushing an older submission:**
1. Navigate to the problem you want to push.
2. Click on the **Submissions** tab (the clock icon) on the left panel.
3. Click on the specific **"Accepted"** submission you wish to upload.
4. Once the submission details load in the left panel, click the **Git Push** icon above the code editor.

*Note: LeetHub enforces quality control and will actively block pushes for submissions that do not have an "Accepted" status (e.g., Compile Error, TLE).*

-### GeeksforGeeks

**Pushing your most recent submission:**
1. Solve a problem and click **Submit**.
2. Once the problem is solved successfully, click the **Git Push** icon located next to the language selector above the editor.
3. The icon will turn into an orange dot, and then green upon successful upload!

**Pushing an older submission:**
1. Navigate to the problem you want to push.
2. Click on the **Submissions** tab.
3. Find an older "Correct" submission and click **View**.
4. In the code preview modal, click the **Move To Editor** button to load the code into the main editor.
5. Click the **Git Push** icon. You will receive a confirmation prompt asking to verify it is an accepted solution—simply click **OK** to push!

**Multiple Solution Versions:**
You can maintain multiple versions of a solution for the same problem.
- **Right-click** the Git Push icon.
- Enter a suffix (e.g. `-bfs`, `-dfs`) when prompted.
- The file will be saved with the suffix appended to the name!

## Credits

Originally forked from [LeetHub 3.0](https://github.com/raphaelheinz/LeetHub-3.0) by **Raphael Heinz**, which itself was forked from [LeetHub 2.0](https://github.com/arunbhardwaj/LeetHub-2.0) by **Arun Bhardwaj**.

This fork adds multi-platform support (GeeksforGeeks, CodeChef), a redesigned popup UI, platform-specific stats, and numerous quality-of-life enhancements.

## License

This project is licensed under the [MIT License](LICENSE).
