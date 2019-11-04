import yosay from 'yosay'
import proc from 'process'
import path from 'path'
import chalk from 'chalk'
import Generator from 'yeoman-generator'
import ora from 'ora'
import spawnAsync from '@expo/spawn-async'

// load configs
import { init, defaults } from './templates'

// spinner
const spinner = ora('Configuring (this may can take several minutes) ...')

// generator
class GolangGenerator extends Generator {
  constructor(args, options) {
    super(args, options)

    // this allows to directly pass in the name of the application
    this.argument('appname', {
      desc: `The name of the application (e.g. 'hello-world')`,
      type: String,
      optional: true,
      default: path.basename(proc.cwd())
    })

    this.appName = this.options.appname
  }

  // we use a property, because this is executed first
  get initializing() {
    function hello() {
      // say yo, to any new gopher
      this.log(
        yosay(
          `${chalk.blue(
            'Greetings Gopher!'
          )} Let's get your next project started.`
        )
      )
    }

    return {
      hello
    }
  }

  // set necessary paths
  paths() {
    // set new source path
    this.sourceRoot(path.resolve(__filename, '../../../templates/'))
  }

  // prompting the user for inputs
  prompting() {
    const cb = this.async()

    const prompts = [
      {
        type: 'input',
        name: 'app',
        message: `What is the name of your new app?`,
        default: this.appName,
        store: true
      },
      {
        type: 'input',
        name: 'importPath',
        message: `What is the import path our your project?`,
        store: true
      },
      {
        type: 'confirm',
        name: 'vendor',
        message: `Would you like to commit ${chalk.yellow('vendor')}?`,
        default: true,
        store: true
      }
    ]

    // if `dep` is available
    if (!!this.spawnCommandSync('dep', ['--help'], { stdio: false }).status) {
      // test `dep` is installed
      prompts.push({
        type: 'confirm',
        name: 'dep',
        message: `Would you like to run ${chalk.yellow(`dep init`)}?`,
        default: true,
        store: true
      })
    }

    // if `cobra` is available
    if (
      this.spawnCommandSync('cobra', ['--help'], { stdio: false }).output !==
      null
    ) {
      // test `dep` is installed
      prompts.push({
        type: 'confirm',
        name: 'cobra',
        message: `Would you like to run ${chalk.yellow(`cobra init`)}?`,
        default: false,
        store: true
      })
    }

    return this.prompt(prompts).then(
      ({ app, dep, importPath, vendor, cobra }) => {
        this.appName = app
        this.importPath = importPath
        this.dep = dep
        this.vendor = vendor
        this.cobra = cobra
        cb()
      }
    )
  }

  // just in case
  async configuring() {
    // start spinner
    spinner.start()

    // run `cobra init`
    if (this.cobra) {
      // run cobra init
      let result
      try {
        result = await spawnAsync('cobra', ['init', '-l', 'MIT'], {
          stdio: false
        })
      } catch (e) {
        spinner.fail([`Could not initialize ${chalk.red('cobra')}`])
        this.env.error(e)
      }
    }

    // run `dep init`
    if (this.dep) {
      // run dep init
      let result
      try {
        result = await spawnAsync('dep', ['init'], { stdio: false })
      } catch (e) {
        spinner.fail([`Could not initialize ${chalk.red('dep')}`])
        this.env.error(e)
      }
    }

    spinner.succeed('Configured')
  }

  // writing our files
  async writing() {
    // templates
    const templates = init

    if (this.cobra === false) {
      templates.push(...defaults)
    }

    // parse templates
    templates.forEach(template => {
      this.fs.copyTpl(
        this.templatePath(template.from),
        this.destinationPath(template.to),
        this
      )
    })
  }

  end() {
    return
  }
}

// exporting generator as CommonJS module
module.exports = GolangGenerator
