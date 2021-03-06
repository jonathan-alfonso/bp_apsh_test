const path = require('path');
const fse = require('fs-extra');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');
const expectedFiles = require('../utils/expected-files').entity;
const EntityServerGenerator = require('../../generators/entity-server');
const constants = require('../../generators/generator-constants');
const { MapperTypes, ServiceTypes, PaginationTypes } = require('../../jdl/jhipster/entity-options');

const NO_SERVICE = ServiceTypes.NO;
const NO_PAGINATION = PaginationTypes.NO;
const NO_DTO = MapperTypes.NO;

const SERVER_MAIN_SRC_DIR = constants.SERVER_MAIN_SRC_DIR;
const CLIENT_MAIN_SRC_DIR = constants.CLIENT_MAIN_SRC_DIR;

const mockBlueprintSubGen = class extends EntityServerGenerator {
  constructor(args, opts) {
    super(args, { fromBlueprint: true, ...opts }); // fromBlueprint variable is important

    if (!this.jhipsterContext) {
      this.error('This is a JHipster blueprint and should be used only like jhipster --blueprints myblueprint');
    }
  }

  get preparing() {
    return {
      ...this._preparing(),
    };
  }

  get default() {
    return {
      ...this._default(),
    };
  }

  get writing() {
    return {
      customPhase() {
        this.name = 'JHipster';
        this.template(path.join(process.cwd(), 'HelloKotlin.kt.ejs'), `${SERVER_MAIN_SRC_DIR}${this.packageFolder}/HelloKotlin.kt`);
      },
    };
  }
};

describe('JHipster entity server generator with blueprint', () => {
  const blueprintNames = ['generator-jhipster-myblueprint', 'myblueprint'];

  blueprintNames.forEach(blueprintName => {
    describe(`generate server entity with blueprint option '${blueprintName}'`, () => {
      before(() =>
        helpers
          .run(path.join(__dirname, '../../generators/entity'))
          .inTmpDir(dir => {
            fse.copySync(path.join(__dirname, '../../test/templates/ngx-blueprint'), dir);
          })
          .withArguments(['foo'])
          .withOptions({
            fromCli: true,
            skipInstall: true,
            blueprint: blueprintName,
            skipChecks: true,
          })
          .withGenerators([[mockBlueprintSubGen, 'jhipster-myblueprint:entity-server']])
          .withPrompts({
            fieldAdd: false,
            relationshipAdd: false,
            dto: NO_DTO,
            service: NO_SERVICE,
            pagination: NO_PAGINATION,
          })
      );

      it('creates expected entity client files from jhipster entity generator', () => {
        assert.file(expectedFiles.clientNg2);
        assert.file(`${CLIENT_MAIN_SRC_DIR}i18n/en/foo.json`);
      });

      it('does not create default entity server files from jhipster entity generator', () => {
        assert.noFile(expectedFiles.server.filter(f => f.endsWith('.java')));
      });

      it('contains the specific change added by the blueprint', () => {
        assert.fileContent(`${SERVER_MAIN_SRC_DIR}com/mycompany/myapp/HelloKotlin.kt`, /Hello JHipster/);
      });
    });
  });
});
