#!/bin/env node

var Config = require('./lib/clientInit.js'),
	DownloadManager = require('./lib/downloadManager.js'),
	cmdopt = require('commander');
	URL = require('url'),
	fs = require('fs'),
	path = require('path');

cmdopt
	.version('ptun [ 1.0.0 ]')
	.usage('[Options] <url> [file]')
	.option('--dp','skip proxy settings')
	.option('--dc','disable chunk download feature')
	.option('--cs <chunkSize>','Overwrite configured "chunkSize" value',parseInt)
	.option('--wn <workers>','Overwrite configured number download "workers"',parseInt)
	.option('--et','Enable ptun tunnel')
	.option('--stdout','stream to stdout')
	.parse(process.argv);

clientConf = new Config();
clientConf.loadConfig(Main);

function Main(conf){
	var outStream = null,
		outFileName = null;
	
	cmdopt.dp ? conf.disableProxy = cmdopt.dp : null;
	cmdopt.dc ? conf.disableChunk = cmdopt.dc : null;
	cmdopt.chunkSize ? conf.chunkSize = cmdopt.chunkSize : null;
	cmdopt.workers ? conf.workers = cmdopt.workers : null;
	if(!cmdopt.et){
		delete conf.ptun;
	}
	
	conf.url = cmdopt.args[0];
	
	console.log(conf);
	
	if (cmdopt.args[1]){
		outStream = fs.WriteStream(cmdopt.args[1]);
	} else if ( !cmdopt.args[1] && !cmdopt.stdout){
		outFileName = path.basename(URL.parse(conf.url).path) || 'ptun.out';
		outStream = fs.WriteStream(outFileName);
	} else {
		outStream = process.stdout;
	}
	outStream.on('finish',function(){outStream.close();});
	
	var dm = new DownloadManager(conf);
	dm.on('data',function(webRes){
		outStream.write(webRes.data);
	});
	dm.on('finish',function(webRes){
		outStream.end();
	});
	
	dm.start();
};

