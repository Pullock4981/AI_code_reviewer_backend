const detect = (code = "", filename = "") => {
  const ext = filename.split(".").pop().toLowerCase();

  const extMap = {
    js: "javascript", ts: "typescript", py: "python",
    java: "java", cs: "csharp", cpp: "cpp", c: "c",
    html: "html", css: "css", php: "php",
    rb: "ruby", go: "go", rs: "rust", kt: "kotlin",
    swift: "swift", sql: "sql", json: "json",
    jsx: "react", tsx: "typescript-react",
  };

  if (extMap[ext]) return extMap[ext];

  // Detect from code content
  if (/<html|<!DOCTYPE/i.test(code))     return "html";
  if (/^\s*body\s*\{|margin:|padding:/m.test(code)) return "css";
  if (/(import React|useState|useEffect|useContext|className=|return\s*\(\s*<)/.test(code)) {
    if (/interface |type |:[ a-zA-Z<>]+(=|;|,|\))/.test(code)) return "typescript-react";
    return "react";
  }
  if (/interface |type |:[ a-zA-Z<>]+(=|;|,|\))/.test(code) && !/console\.log|const |let |var |=>/.test(code) === false) return "typescript";
  if (/console\.log|const |let |var |=>/.test(code)) return "javascript";
  if (/def |import |print\(/.test(code)) return "python";
  if (/public class|System\.out/.test(code)) return "java";

  return "unknown";
};

module.exports = { detect };
