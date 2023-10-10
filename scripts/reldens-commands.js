/**
 *
 * Reldens - Commands
 *
 */

const commander = require('./commander');

if(commander.ready){
    'test' === commander.command || 'help' === commander.command
        ? commander[commander.command]()
        : commander.execute().then(() => { console.info('- End'); });
}
