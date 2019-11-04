import yeoman from 'yeoman-environment'
import proc from 'process'

const args = proc.argv.slice(2)

const env = yeoman.createEnv(args)
env.registerStub(require('./app'), 'go-lang:app')
env.run(`go-lang:app ${args}`)
