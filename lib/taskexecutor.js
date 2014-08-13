

var TaskExecutor = function(tasks,nrt){
	this.tasks = tasks;
	this.nrt = nrt;
	this.running = 0;
	this.cont = 0;
	this.runQ = [];
	
	this._taskend = function(success,error){
		console.log('taskcomplete succes');
	};
	
	this.start = function(){
		var self = this;
		while( self.running < self.nrt ){
			setTimeout(function(cont){self.tasks[cont](self._taskend);},1,self.cont);	
			self.cont++;
			self.running++;
		}
	};
	
	this.status = function(){
		return {tasks: this.tasks.length, running: this.running };
	};
};

module.exports = TaskExecutor;


