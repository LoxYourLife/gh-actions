const readIniFile = require('read-ini-file');
const writeIniFile = require('write-ini-file');
const path = require('path');
const { execSync } = require('child_process');

let version = process.argv[2];
const isPrerelease = process.argv[3] == 'true';

const updatePluginConfig = async () => {
  const pluginCfg = path.resolve(__dirname, '..', 'plugin.cfg');
  const plugin = await readIniFile(pluginCfg);
  plugin.PLUGIN.VERSION = version;
  await writeIniFile(pluginCfg, plugin);
};

const updateReleaseCfg = async () => {
  const releaseCfg = path.resolve(__dirname, '..', 'release.cfg');
  const release = await readIniFile(releaseCfg);
  release.AUTOUPDATE.VERSION = version.replace('-rc.', '_');
  release.AUTOUPDATE.ARCHIVEURL = `https://github.com/LoxYourLife/gh-actions/archive/${version}.zip`;
  await writeIniFile(releaseCfg, release);
};
const updatePreReleaseCfg = async () => {
  const releaseCfg = path.resolve(__dirname, '..', 'prerelease.cfg');
  const release = await readIniFile(releaseCfg);
  release.AUTOUPDATE.VERSION = version.replace('-rc.', '_');
  release.AUTOUPDATE.ARCHIVEURL = `https://github.com/LoxYourLife/gh-actions/archive/${version}.zip`;
  await writeIniFile(releaseCfg, release);
};

const updateNpm = (prefix) => {
  prefix = prefix ? ` --prefix ${prefix}` : '';
  const preid = isPrerelease ? ' --preid rc' : '';
  const command = `npm ${prefix}${preid} --no-git-tag-version version ${version}`;
  try {
    execSync(command).toString();
  } catch (e) {
    console.error(e.message);
  }
};

const commit = () => {
  if (!isPrerelease) execSync('git add CHANGELOG.md');
  execSync('git add package.json package-lock.json');
  //execSync('git add bin/package.json bin/package-lock.json');
  //execSync('git add devServer/package.json devServer/package-lock.json');
  execSync('git add plugin.cfg');

  if (isPrerelease) {
    execSync('git add prerelease.cfg');
  } else {
    execSync('git add release.cfg');
  }

  execSync(`git commit -m "type(ci): Version ${version}"`);
  execSync(`git tag ${version}`);
  execSync('git push origin');
  execSync('git push origin --tags');
};

const getVersion = () => {
  const package = require(path.resolve(__dirname, '..', 'package.json'));
  return package.version;
};

const run = async () => {
  updateNpm();
  version = getVersion();
  //updateNpm('bin');
  //updateNpm('devServer');
  await updatePluginConfig();
  if (isPrerelease) {
    await updatePreReleaseCfg();
  } else {
    await updateReleaseCfg();
  }

  //commit();
  console.log(`Created new Version: ${version}`);
};

run();
