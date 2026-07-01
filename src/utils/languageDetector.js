const detect = (code = "", filename = "") => {
  const ext = filename.split(".").pop().toLowerCase();

  const extMap = {
    js: "javascript", ts: "typescript", py: "python",
    java: "java", cs: "csharp", cpp: "cpp", c: "c",
    html: "html", css: "css", php: "php",
    rb: "ruby", go: "go", rs: "rust", kt: "kotlin",
    swift: "swift", sql: "sql", json: "json",
  };

  if (extMap[ext]) return extMap[ext];

  // Detect from code content
  if (/<html|<!DOCTYPE/i.test(code))     return "html";
  if (/^\s*body\s*\{|margin:|padding:/m.test(code)) return "css";
  if (/console\.log|const |let |var |=>/.test(code)) return "javascript";
  if (/def |import |print\(/.test(code)) return "python";
  if (/public class|System\.out/.test(code)) return "java";

  return "unknown";
};

module.exports = { detect };
