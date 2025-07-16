import { copyFileSync, mkdirSync, readdirSync, existsSync } from "fs";
import { join } from "path";

// Build the main application
console.log("Building main application...");
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./build",
  target: "bun",
  minify: true,
  sourcemap: "inline",
  external: ["@google/genai", "drizzle-orm", "dotenv"],
});

// Function to build command files
async function buildCommandFiles(srcDir: string, destDir: string) {
  if (!existsSync(srcDir)) {
    console.log(`Source directory ${srcDir} does not exist, skipping...`);
    return;
  }

  // Create destination directory
  mkdirSync(destDir, { recursive: true });

  // Get all TypeScript files
  const files = readdirSync(srcDir).filter((file) => file.endsWith(".ts"));

  if (files.length === 0) {
    console.log(`No TypeScript files found in ${srcDir}`);
    return;
  }

  // Build each command file individually to ensure proper naming
  console.log(`Building ${files.length} command files from ${srcDir}...`);

  for (const file of files) {
    const srcPath = join(srcDir, file);
    const jsFileName = file.replace(".ts", ".js");
    const destPath = join(destDir, jsFileName);

    try {
      const result = await Bun.build({
        entrypoints: [srcPath],
        outdir: destDir,
        target: "bun",
        minify: true,
        sourcemap: "inline",
        external: ["@google/genai", "drizzle-orm", "dotenv"],
        naming: {
          entry: jsFileName,
        },
      });

      if (result.success) {
        console.log(`Built: ${file} -> ${jsFileName}`);
      } else {
        console.error(`Failed to build ${file}:`, result.logs);
      }
    } catch (error) {
      console.error(`Error building ${file}:`, error);
    }
  }
}

// Build dynamically imported command files
console.log("Building command files...");
await buildCommandFiles("./src/handlers/commands", "./build/handlers/commands");
await buildCommandFiles("./src/modules/commands", "./build/modules/commands");

console.log("Build completed with dynamic imports compiled!");
