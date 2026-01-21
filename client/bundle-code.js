const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_FILE = 'combined_code.txt';
const INCLUDE_EXTENSIONS = ['.js', '.ejs', '.css', '.json', '.env',".jsx",".ico",".html"];
const EXCLUDE_DIRS = ['node_modules', 'dist', 'build', '.git', '.vscode'];
const EXCLUDE_FILES = ['package-lock.json', 'yarn.lock', 'combined_code.txt'];

// Style for headers (you can customize these)
const HEADER_STYLE = {
  top: '='.repeat(60),
  bottom: '='.repeat(60)
};

function shouldIncludeFile(filePath) {
  const ext = path.extname(filePath);
  const fileName = path.basename(filePath);
  
  // Check extension
  if (!INCLUDE_EXTENSIONS.includes(ext)) {
    return false;
  }
  
  // Check excluded files
  if (EXCLUDE_FILES.includes(fileName)) {
    return false;
  }
  
  // Check if in excluded directory
  for (const excludeDir of EXCLUDE_DIRS) {
    if (filePath.includes(`${path.sep}${excludeDir}${path.sep}`) || 
        filePath.startsWith(`${excludeDir}${path.sep}`)) {
      return false;
    }
  }
  
  return true;
}

function processFile(filePath) {
  try {
    const relativePath = path.relative(process.cwd(), filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    let output = '\n\n';
    output += `${HEADER_STYLE.top}\n`;
    output += `FILE: ${relativePath}\n`;
    output += `${HEADER_STYLE.bottom}\n\n`;
    output += content;
    
    return output;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return '';
  }
}

function findFiles(dir) {
  let files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Check if directory should be excluded
          const dirName = path.basename(fullPath);
          if (!EXCLUDE_DIRS.includes(dirName)) {
            files = files.concat(findFiles(fullPath));
          }
        } else if (shouldIncludeFile(fullPath)) {
          files.push(fullPath);
        }
      } catch (err) {
        console.warn(`Skipping ${fullPath}: ${err.message}`);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

function bundleProject() {
  console.log('📦 Bundling project files...');
  console.log('Looking for extensions:', INCLUDE_EXTENSIONS.join(', '));
  console.log('Excluding directories:', EXCLUDE_DIRS.join(', '));
  
  // Find all files
  const allFiles = findFiles('.');
  console.log(`Found ${allFiles.length} files to bundle\n`);
  
  if (allFiles.length === 0) {
    console.log('❌ No files found with specified extensions!');
    return;
  }
  
  // Create output file
  let combinedContent = `PROJECT CODE BUNDLE\n`;
  combinedContent += `Generated: ${new Date().toLocaleString()}\n`;
  combinedContent += `Total Files: ${allFiles.length}\n`;
  combinedContent += `\n${'='.repeat(60)}\n\n`;
  
  // Process each file
  allFiles.forEach((file, index) => {
    console.log(`Processing [${index + 1}/${allFiles.length}]: ${path.relative(process.cwd(), file)}`);
    combinedContent += processFile(file);
  });
  
  // Write to file
  fs.writeFileSync(OUTPUT_FILE, combinedContent, 'utf8');
  
  console.log(`\n✅ Done! All code bundled into: ${OUTPUT_FILE}`);
  console.log(`📁 Total size: ${(combinedContent.length / 1024).toFixed(2)} KB`);
  
  // Show summary
  console.log('\n📋 File Type Summary:');
  const summary = {};
  allFiles.forEach(file => {
    const ext = path.extname(file);
    summary[ext] = (summary[ext] || 0) + 1;
  });
  
  Object.entries(summary).forEach(([ext, count]) => {
    console.log(`  ${ext}: ${count} files`);
  });
}

// Run the script
bundleProject();