import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StatusChecker {
  constructor() {
    // Try to find the root directory
    this.rootDir = this.findRootDir();
    this.results = {};
  }

  findRootDir() {
    let currentDir = __dirname;
    // Look for package.json or go up to workspace root
    while (currentDir !== '/') {
      if (fs.existsSync(path.join(currentDir, 'package.json')) || 
          fs.existsSync(path.join(currentDir, 'client')) ||
          currentDir.includes('UpKeepQr')) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    return process.cwd();
  }

  checkExists(relativePath) {
    return fs.existsSync(path.join(this.rootDir, relativePath));
  }

  countFiles(dirPath, extensions = ['.tsx', '.jsx']) {
    try {
      if (!this.checkExists(dirPath)) return 0;
      let count = 0;
      const scanDir = (dir) => {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            scanDir(fullPath);
          } else if (extensions.some(ext => item.endsWith(ext))) {
            count++;
          }
        });
      };
      scanDir(path.join(this.rootDir, dirPath));
      return count;
    } catch {
      return 0;
    }
  }

  runCheck() {
    console.log('🔍 Comprehensive UpKeepQr Status Check\n');
    console.log(`📁 Checking from: ${this.rootDir}\n`);

    // Check project structure
    console.log('🏗️  PROJECT STRUCTURE:');
    const structure = {
      'Root Directory': this.rootDir,
      'Client': this.checkExists('client'),
      'Server': this.checkExists('server'),
      'Client/src': this.checkExists('client/src'),
      'Components': this.checkExists('client/src/components'),
      'Pages': this.checkExists('client/src/pages'),
      'Public': this.checkExists('client/public'),
      'Package.json': this.checkExists('client/package.json'),
    };

    Object.entries(structure).forEach(([name, exists]) => {
      console.log(`   ${exists ? '✅' : '❌'} ${name}`);
    });

    // Check component counts
    console.log('\n📊 COMPONENT COUNTS:');
    const componentCount = this.countFiles('client/src/components');
    const pageCount = this.countFiles('client/src/pages');
    const hookCount = this.countFiles('client/src/hooks', ['.ts', '.js']);
    const utilCount = this.countFiles('client/src/utils', ['.ts', '.js']);

    console.log(`   📄 ${componentCount} React components`);
    console.log(`   📄 ${pageCount} Page components`);
    console.log(`   🪝 ${hookCount} Custom hooks`);
    console.log(`   🔧 ${utilCount} Utility files`);

    // Check specific important files
    console.log('\n🎯 KEY FILES:');
    const keyFiles = {
      'TypeScript Config': this.checkExists('tsconfig.json'),
      'Tailwind Config': this.checkExists('tailwind.config.js'),
      'Vite Config': this.checkExists('vite.config.js'),
      'README': this.checkExists('README.md'),
      'Environment Example': this.checkExists('.env.example'),
    };

    Object.entries(keyFiles).forEach(([name, exists]) => {
      console.log(`   ${exists ? '✅' : '❌'} ${name}`);
    });

    // Check package.json if it exists
    if (this.checkExists('client/package.json')) {
      console.log('\n📦 DEPENDENCIES:');
      try {
        const packageJson = JSON.parse(fs.readFileSync(
          path.join(this.rootDir, 'client/package.json'), 'utf8'
        ));
        
        const deps = Object.keys(packageJson.dependencies || {}).length;
        const devDeps = Object.keys(packageJson.devDependencies || {}).length;
        const scripts = Object.keys(packageJson.scripts || {}).length;

        console.log(`   📦 ${deps} dependencies`);
        console.log(`   🔧 ${devDeps} dev dependencies`);
        console.log(`   🚀 ${scripts} npm scripts`);
        
        // Check for key dependencies
        const keyDeps = {
          'React': packageJson.dependencies?.react,
          'TypeScript': packageJson.devDependencies?.typescript,
          'Tailwind': packageJson.devDependencies?.tailwindcss,
          'Vite': packageJson.devDependencies?.vite,
        };

        Object.entries(keyDeps).forEach(([name, exists]) => {
          console.log(`   ${exists ? '✅' : '❌'} ${name}`);
        });
      } catch {
        console.log('   ❌ Error reading package.json');
      }
    }

    this.calculateCompletion();
  }

  calculateCompletion() {
    console.log('\n📈 PROJECT COMPLETION ESTIMATE:');
    
    // Simple scoring system
    const checks = [
      this.checkExists('client'),
      this.checkExists('client/src'),
      this.checkExists('client/src/components'),
      this.checkExists('client/src/pages'),
      this.checkExists('client/package.json'),
      this.checkExists('tsconfig.json'),
      this.countFiles('client/src/components') > 0,
      this.countFiles('client/src/pages') > 0,
    ];

    const completed = checks.filter(Boolean).length;
    const percentage = Math.round((completed / checks.length) * 100);

    console.log(`   ${percentage}% complete (${completed}/${checks.length} key items)`);
    
    if (percentage >= 80) {
      console.log('   🎉 Excellent progress!');
    } else if (percentage >= 60) {
      console.log('   🔥 Good foundation, keep going!');
    } else if (percentage >= 40) {
      console.log('   ⚡ Basic structure in place');
    } else {
      console.log('   💡 Early development phase');
    }
  }
}

// Run the check
const checker = new StatusChecker();
checker.runCheck();
