const { performance } = require('perf_hooks');

const Logger = {
	LOG_LEVEL: null,
	log(level, ...args) {
		if(level == Logger.LOG_LEVEL) {
			return console.log.apply(console.log, args);
		}
	},
	time(name='', fn) {
		const t1 = performance.now();
		const out = fn();
		console.log(`[${name}]`, 'took:', performance.now() - t1, 'ms')
		return out;
	}
};

module.exports = Logger;
