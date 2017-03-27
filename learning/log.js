const Logger = {
	LOG_LEVEL: null,
	log(level, ...args) {
		if(level == Logger.LOG_LEVEL) {
			return console.log.apply(console.log, args);
		}
	}
};

module.exports = Logger;
