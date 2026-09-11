import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { execSync } from "node:child_process";

const SRC_DIR = path.resolve(process.cwd(), "src");

function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist") {
        getAllTsFiles(fullPath, fileList);
      }
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".js"))) {
      if (!entry.name.endsWith(".d.ts")) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

function removeComments(filePath: string): boolean {
  const sourceCode = fs.readFileSync(filePath, "utf-8");

  
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  const rangesToRemove: Array<{ pos: number; end: number }> = [];

  function scanNode(node: ts.Node) {
  
    const leadingComments = ts.getLeadingCommentRanges(sourceCode, node.pos);
    if (leadingComments) {
      for (const comment of leadingComments) {
        rangesToRemove.push({ pos: comment.pos, end: comment.end });
      }
    }

  
    const trailingComments = ts.getTrailingCommentRanges(sourceCode, node.end);
    if (trailingComments) {
      for (const comment of trailingComments) {
        rangesToRemove.push({ pos: comment.pos, end: comment.end });
      }
    }

    ts.forEachChild(node, scanNode);
  }

  scanNode(sourceFile);

  if (rangesToRemove.length === 0) {
    return false;
  }


  const uniqueRanges: Array<{ pos: number; end: number }> = [];
  const seen = new Set<string>();

  for (const r of rangesToRemove) {
    const key = `${r.pos}-${r.end}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRanges.push(r);
    }
  }

  uniqueRanges.sort((a, b) => b.pos - a.pos);

  let newCode = sourceCode;
  for (const range of uniqueRanges) {

    const commentText = newCode.slice(range.pos, range.end);
    const hasNewLine = commentText.includes("\n");
    if (hasNewLine) {
 
      const newlines = commentText.replace(/[^\r\n]/g, "");
      newCode = newCode.slice(0, range.pos) + newlines + newCode.slice(range.end);
    } else {
      newCode = newCode.slice(0, range.pos) + newCode.slice(range.end);
    }
  }


  const cleanedLines = newCode
    .split("\n")
    .filter((line, idx, arr) => {
  
      if (line.trim() === "") {
        return idx === 0 || arr[idx - 1].trim() !== "";
      }
      return true;
    })
    .join("\n");

  fs.writeFileSync(filePath, cleanedLines, "utf-8");
  return true;
}

async function main() {
  console.log("🔍 Scanning TypeScript files in src/...");
  const files = getAllTsFiles(SRC_DIR);
  console.log(`Found ${files.length} files.\n`);

  let modifiedCount = 0;
  for (const file of files) {
    const modified = removeComments(file);
    if (modified) {
      modifiedCount++;
      console.log(`  ✓ Stripped comments from: ${path.relative(process.cwd(), file)}`);
    }
  }

  console.log(`\n✨ Removed comments from ${modifiedCount} file(s).`);
  console.log("\n🧪 Running TypeScript compiler verification (tsc --noEmit)...");

  try {
    execSync("npx tsc --noEmit", { stdio: "inherit", cwd: process.cwd() });
    console.log("\n✅ Verification Successful: 0 TypeScript syntax/type errors found!");
  } catch (error) {
    console.error("\n❌ Verification Failed: TypeScript detected errors after comment removal.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
