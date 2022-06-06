const path = require('path');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');
const shelljs = require('shelljs');
const fse = require('fs-extra');
const { expect } = require('expect');
const packageJson = require('../package.json');
const { prepareTempDir } = require('./utils/utils');
const { escapeRegExp } = require('../generators/utils');

describe('JHipster upgrade generator', function () {
  this.timeout(400000);

  describe('default application', () => {
    let cleanup;
    before(async () => {
      cleanup = prepareTempDir();
      await helpers
        .create(path.join(__dirname, '../generators/app'), { tmpdir: false })
        .withOptions({
          baseName: 'upgradeTest',
          skipInstall: true,
          skipChecks: true,
          fromCli: true,
          defaults: true,
          localConfig: {
            skipClient: true,
            skipServer: true,
          },
        })
        .run()
        .then(() => {
          return helpers
            .create(path.join(__dirname, '../generators/upgrade'), { tmpdir: false })
            .withOptions({
              fromCli: true,
              force: true,
              silent: false,
              targetVersion: packageJson.version,
            })
            .run();
        });
    });

    after(() => cleanup());

    it('generated git commits to match snapshot', () => {
      const commits = shelljs.exec('git log --pretty=format:%s', { silent: false }).stdout;
      expect(commits.replace(new RegExp(escapeRegExp(packageJson.version), 'g'), 'VERSION')).toMatchInlineSnapshot(`
"Merge branch 'jhipster_upgrade'
Generated with JHipster VERSION
Merge branch 'jhipster_upgrade'
Generated with JHipster VERSION
Initial version of upgradeTest generated by generator-jhipster@VERSION"
`);
    });

    it('generates expected number of commits', () => {
      const commitsCount = shelljs.exec('git rev-list --count HEAD', { silent: false }).stdout.replace('\n', '');
      // Expecting 5 commits in history (because we used `force` option):
      //   - master: initial commit
      //   - jhipster_upgrade; initial generation
      //   - master: block-merge commit of jhipster_upgrade
      //   - jhipster_upgrade: new generation in jhipster_upgrade
      //   - master: merge commit of jhipster_upgrade
      expect(commitsCount).toBe('5');
    });
  });
  describe.skip('blueprint application', () => {
    const blueprintName = 'generator-jhipster-sample-blueprint';
    const blueprintVersion = '0.1.1';
    let cleanup;
    before(() => {
      cleanup = prepareTempDir();
      const dir = process.cwd();
      /* eslint-disable-next-line no-console */
      console.log(`Generating JHipster application in directory: ${dir}`);
      // Fake the presence of the blueprint in node_modules: we don't install it, but we need its version
      const packagejs = {
        name: blueprintName,
        version: blueprintVersion,
      };
      const fakeBlueprintModuleDir = path.join(dir, `node_modules/${blueprintName}`);
      fse.ensureDirSync(path.join(fakeBlueprintModuleDir, 'generators', 'fake'));
      fse.writeJsonSync(path.join(fakeBlueprintModuleDir, 'package.json'), packagejs);
      // Create an fake generator, otherwise env.lookup doesn't find it.
      fse.writeFileSync(path.join(fakeBlueprintModuleDir, 'generators', 'fake', 'index.js'), '');
      return helpers
        .create(path.join(__dirname, '../generators/app'), { tmpdir: false })
        .withOptions({
          baseName: 'upgradeTest',
          skipInstall: true,
          skipChecks: true,
          fromCli: true,
          defaults: true,
          blueprints: blueprintName,
          localConfig: {
            skipClient: true,
            skipServer: true,
          },
        })
        .run()
        .then(() => {
          return helpers
            .create(path.join(__dirname, '../generators/upgrade'), { tmpdir: false })
            .withOptions({
              fromCli: true,
              force: true,
              silent: false,
              skipChecks: true,
              targetVersion: packageJson.version,
            })
            .run();
        });
    });

    after(() => cleanup());

    it('generated git commits to match snapshot', () => {
      const commits = shelljs.exec('git log --pretty=format:%s', { silent: false }).stdout;
      expect(commits.replace(new RegExp(escapeRegExp(packageJson.version), 'g'), 'VERSION')).toMatchInlineSnapshot(`
`);
    });

    it('generates expected number of commits', () => {
      const commitsCount = shelljs.exec('git rev-list --count HEAD', { silent: false }).stdout.replace('\n', '');
      // Expecting 5 commits in history (because we used `force` option):
      //   - master: initial commit
      //   - jhipster_upgrade; initial generation
      //   - master: block-merge commit of jhipster_upgrade
      //   - jhipster_upgrade: new generation in jhipster_upgrade
      //   - master: merge commit of jhipster_upgrade
      expect(commitsCount).toBe('5');
    });

    it('still contains blueprint information', () => {
      assert.JSONFileContent('.yo-rc.json', {
        'generator-jhipster': { blueprints: [{ name: blueprintName, version: blueprintVersion }] },
      });
      assert.fileContent('package.json', new RegExp(`"${blueprintName}": "${blueprintVersion}"`));
    });
  });
});
