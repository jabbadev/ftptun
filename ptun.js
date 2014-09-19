#!/bin/env node

var Config = require('./lib/clientInit.js'),
	DownloadManager = require('./lib/downloadManager.js'),
	cmdopt = require('commander');
	URL = require('url'),
	fs = require('fs'),
	path = require('path');

function chunkSize(cs){
	if( cs[cs.length-1] == "M" ){
		return parseInt(cs.replace(/M$/,''))*1000000; 
	}
	return parseInt(cs);
}
	
cmdopt
	.version('ptun [ 1.0.0 ]')
	.usage('[Options] <url> [file]')
	.option('--dp','skip proxy settings')
	.option('--dc','disable chunk download feature')
	.option('--cs <n[M]>','Overwrite configured "chunkSize" value [ es. 5M ]',chunkSize)
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
	cmdopt.cs ? conf.chunkSize = cmdopt.cs : null;
	cmdopt.workers ? conf.workers = cmdopt.workers : null;
	if(!cmdopt.et){
		delete conf.ptun;
	}
	
	conf.url = cmdopt.args[0];
	
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
	dm.on('data',function(data,resInfo){
		outStream.write(data);
	});
	dm.on('finish',function(data,resInfo){
		if( data ){
			outStream.end(data);
		}
	});
	dm.on('checkDownload',function(resInfo){
		console.log('%d/%d',resInfo.resSize,resInfo.downloadedByte);
	});
	
	dm.start();
};

