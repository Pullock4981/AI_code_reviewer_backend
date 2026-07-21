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
const listRepoFiles = async (repoUrl, accessToken = null, maxFiles = 20) => {
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
    if (err.response && err.response.status === 404) {
      throw new Error("Repository not found. If it is private, please provide a valid GitHub Access Token.");
    }
    throw new Error(`Failed to fetch repository: ${err.message}`);
  }

  const allFiles = treeRes.data.tree.filter((f) => {
    if (f.type !== "blob") return false;
    const ext = f.path.split(".").pop().toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
  });

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
