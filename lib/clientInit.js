var util = require("util"),
	fs = require('fs'),
	events = require("events");

var Config = function(){
	events.EventEmitter.call(this);
	var FTPTUN_CONFIG = { 
		'system': "/etc/ftptun/client.conf",
		'user': process.env['HOME'] + "/.config/ftptun/client.conf",
		'local': process.cwd() + "/client.conf.local" };

	this.loadConfig = function(callBack){
		var $this = this;
		fs.readFile(FTPTUN_CONFIG['local'],function (err,data) {
			if (err) {
				fs.readFile(FTPTUN_CONFIG['user'], function (err,data) {
					if( err ){
						fs.readFile(FTPTUN_CONFIG['system'], function (err,data) {
							if(err)throw err;
							callBack(JSON.parse(data));
							$this.emit('loaded',JSON.parse(data));
						});
					}
					else {
						callBack(JSON.parse(data));
						$this.emit('loaded',JSON.parse(data));
					}
				});
			}
			else {
				callBack(JSON.parse(data));
				$this.emit('loaded',JSON.parse(data));
			}
		});
	};
};

util.inherits(Config,events.EventEmitter);

module.exports = Config;





