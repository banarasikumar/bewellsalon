const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, search, replace) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(new RegExp(search, 'g'), replace);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    } else {
        console.warn(`File not found: ${filePath}`);
    }
}

function migrateApp(appName, oldPackage, newPackage, downloadedJsonDir) {
    const appDir = path.join(__dirname, '..', 'apps', appName);
    
    // 1. Config files
    replaceInFile(path.join(appDir, 'android', 'app', 'build.gradle'), oldPackage, newPackage);
    replaceInFile(path.join(appDir, 'capacitor.config.ts'), oldPackage, newPackage);
    replaceInFile(path.join(appDir, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml'), oldPackage, newPackage);

    // 2. MainActivity.java
    const oldJavaDir = path.join(appDir, 'android', 'app', 'src', 'main', 'java', ...oldPackage.split('.'));
    const newJavaDir = path.join(appDir, 'android', 'app', 'src', 'main', 'java', ...newPackage.split('.'));
    
    if (fs.existsSync(oldJavaDir)) {
        fs.mkdirSync(newJavaDir, { recursive: true });
        const oldJavaFile = path.join(oldJavaDir, 'MainActivity.java');
        const newJavaFile = path.join(newJavaDir, 'MainActivity.java');
        
        if (fs.existsSync(oldJavaFile)) {
            fs.copyFileSync(oldJavaFile, newJavaFile);
            fs.unlinkSync(oldJavaFile);
            console.log(`Moved MainActivity to ${newJavaFile}`);
            replaceInFile(newJavaFile, oldPackage, newPackage);
        }
    }

    // 3. google-services.json
    const downloadedJson = path.join(downloadedJsonDir, 'google-services.json');
    const targetJson = path.join(appDir, 'android', 'app', 'google-services.json');
    
    if (fs.existsSync(downloadedJson)) {
        fs.copyFileSync(downloadedJson, targetJson);
        console.log(`Copied google-services.json for ${appName}`);
    } else {
        console.warn(`google-services.json NOT FOUND in ${downloadedJsonDir}`);
    }
}

migrateApp('admin-app', 'in.blancbeu.admin', 'in.bewell.admin', 'C:\\\\Users\\\\banar\\\\Downloads\\\\bewell android\\\\admin');
migrateApp('staff-app', 'in.blancbeu.staff', 'in.bewell.staff', 'C:\\\\Users\\\\banar\\\\Downloads\\\\bewell android\\\\staff');
