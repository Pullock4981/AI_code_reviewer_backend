const axios = require("axios");

const SUPPORTED_EXTENSIONS = ["js","jsx","ts","tsx","py","java","cs","cpp","c","html","css","php","rb","go","rs","kt","swift","sql"];

// GitHub raw file URL theke code fetch kore
const fetchFile = async (githubUrl, accessToken = null) => {
  // Convert github.com URL to raw URL
  const rawUrl = githubUrl
    .replace("github.com", "raw.githubusercontent.com")
    .replace("/blob/", "/");

  const headers = accessToken ? { Authorization: `token ${accessToken}` } : {};
  try {
    const response = await axios.get(rawUrl, { headers, timeout: 15000 });
    return response.data;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      throw new Error("File not found. If the repository is private, please provide a valid GitHub Access Token.");
    }
    throw new Error(`Failed to fetch file: ${err.message}`);
  }
};

// Repo er sob supported file list kore
const listRepoFiles = async (repoUrl, accessToken = null, maxFiles = 30) => {
  // Parse owner/repo from URL: https://github.com/owner/repo
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Invalid GitHub repository URL");

  const [, owner, repo] = match;
  const headers = {
    Accept: "application/vnd.github.v3+json",
    ...(accessToken && { Authorization: `token ${accessToken}` }),
  };

  let treeRes;
  try {
    treeRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
      { headers, timeout: 20000 }
    );
  } catch (err) {
    if (err.response) {
      if (err.response.status === 404) {
        throw new Error("Repository not found. If it is private, please provide a valid GitHub Access Token.");
      }
      if (err.response.status === 403) {
        throw new Error("GitHub API Rate Limit exceeded (60 requests/hr). Please generate a personal access token and paste it in the 'Access Token' box to continue.");
      }
    }
    throw new Error(`Failed to fetch repository: ${err.message}`);
  }

  let allFiles = treeRes.data.tree.filter((f) => {
    if (f.type !== "blob") return false;
    const ext = f.path.split(".").pop().toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
  });

  // Prioritize source files over config/build files
  const priorityScore = (path) => {
    const lowerPath = path.toLowerCase();
    
    // Ignore configs, tests, styling, or package files for light review
    if (lowerPath.includes("package-lock") || lowerPath.includes(".css") || lowerPath.includes(".svg") || lowerPath.includes(".test") || lowerPath.includes("eslint") || lowerPath.includes("config")) {
      return -1; 
    }
    
    // Highest priority to actual pages and components
    if (lowerPath.includes("pages/") || lowerPath.includes("app/") || lowerPath.includes("components/")) {
      return 3;
    }
    
    // High priority to hooks, context, controllers, routes
    if (lowerPath.includes("hooks/") || lowerPath.includes("context/") || lowerPath.includes("controllers/") || lowerPath.includes("routes/")) {
      return 2;
    }
    
    // Medium priority to any src/ folder
    if (lowerPath.includes("src/")) {
      return 1;
    }
    
    return 0;
  };

  allFiles.sort((a, b) => priorityScore(b.path) - priorityScore(a.path));
  
  // Filter out the negative priorities if possible, then limit to maxFiles
  allFiles = allFiles.filter(f => priorityScore(f.path) >= 0);

  // Max file limit
  return allFiles.slice(0, maxFiles).map((f) => ({
    path: f.path,
    rawUrl: `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${f.path}`,
    extension: f.path.split(".").pop().toLowerCase(),
  }));
};

const getRepoCommitCount = async (repoUrl, accessToken = null) => {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return 0;
  
  const [, owner, repo] = match;
  const headers = {
    Accept: "application/vnd.github.v3+json",
    ...(accessToken && { Authorization: `token ${accessToken}` }),
  };

  try {
    // Fetch up to 10 commits to easily check if there are "at least 5"
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`,
      { headers, timeout: 15000 }
    );
    return response.data.length || 0;
  } catch (err) {
    console.error("Failed to fetch commit count:", err.message);
    return 0; // fallback gracefully
  }
};

module.exports = { fetchFile, listRepoFiles, getRepoCommitCount };
