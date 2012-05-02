// The Bond testing library - James Bond spies on your code while it's running and reports back to you.
// Out of respect for the production code, all calls to Bond in the production code are prefaced with /*BOND*/ for readability

// Bond keeps his records in a dictionary mapping observation locations to lists of observations made there.
// Each observation itself is a dictionary mapping labels of targets to their values
var Bond = {
    observations: [],
    remote: false,
    socket: null,
    recordingModes: {},
    recordedStates: {},
    recordedParams: {}
};

// Tell Bond to start a new mission by clearing his past observations
Bond.start = function(){
    Bond.observations = [];
    // clear log file
    //fs.createWriteStream('./BondLogs/default.log', {
      //  flags: 'w',
        //encoding: "utf8"
    //}).write("");
};

// Call this to change to remote reporting mode, and pass the socket.io socket of the testing server.
// Remote mode allows Bond to report from a remote location, such as a client running javascript code in a browser.
// This really consists of two instances of Bond, one on the client and one on the server. The client Bond instance is
// put into remote mode, and forwards all observations to the server. The server Bond receives the message and logs it.
Bond.startRemoteClient = function(socket){
    this.remote = true;
    this.socket = socket;
};
Bond.startRemoteServer = function(socket){
    socket.on('Bond.spy', function(data){
        Bond.spy(data.location, data.observations);
    });
    socket.on('Bond.recordAt', function(data){
        Bond.recordAt(data.location);
    });
    socket.on('Bond.replayAt', function(data){
        Bond.replayAt(data.location);
    });
    socket.on('Bond.dontRecord', function(data){
        Bond.dontRecord(data.location);
    });
    socket.on('Bond.recordingPoint', function(data){
        Bond.recordingPoint(data.location, data.state, data.params);
    });
};

// Tell Bond to keep an eye on somebody with a call to Bond.spy(location, observations) where 'location' is a
// string labeling the place he is observing from and observations is a dictionary mapping variable names to values
// If we are in remote mode, send a socket.io message to the server, where the server's instance of Bond will log it.
Bond.spy = function(location, observations){
    if(this.remote){
        this.socket.emit('Bond.spy', {location: location, observations: observations});
    }else{
        if(!Bond.observations[location]){
            Bond.observations[location] = [];
        }
        Bond.observations[location].push(observations);

        // write to log file
       // fs.createWriteStream('./BondLogs/default.log', {
         //   flags: 'a',
           // encoding: "utf8"
      //  }).write(location + ": " + JSON.stringify(observations) + "\n");
    }
};

// Ask Bond if he has seen something with a call to Bond.seen(location, observations) where 'location' is a string
// labeling the place and observations is a dictionary mapping variable names to values
// and he will respond with a list of the matching observations, or false if that list happens to be empty.
// You can ask Bond with an extra parameter value to filter his results by observations of the value given.
// The following predicates can be appended to a variable name to modify the comparison:
// __contains, __begins_with, __ends_with - the variable (a string or set) contains/begins with/ends with the given value
// __in - the variable is a member of the given set
// __neq - not equal to
// __gt, __gte - greater than, greater than or equal to
// __lt, __lte - less than, less than or equal to
Bond.seen = function(location, observations){
    var obs = Bond.observations[location];
    var results = [];
    var i;
    if(!obs) return false;
    for(i=0; i<obs.length; i++){
        var match = true;
        for(var variable in observations){
            if(!evaluatePredicate(obs[i], variable, observations[variable])){
                match = false;
            }
        }
        if(match){
            results.push(obs[i]);
        }
    }
    if(results.length == 0){
        return false;
    }else{
        return results;
    }
};

function evaluatePredicate(observation, variable, value){
    var theVar;
    if(variable.endsWith('__contains')){
        theVar = observation[variable.stripLast(10)];
        return (isArray(theVar) || typeof(theVar)=="string") && theVar.contains(value);
    }else if(variable.endsWith('__begins_with')){
        theVar = observation[variable.stripLast(13)];
        return (isArray(theVar) || typeof(theVar)=="string") && theVar.beginsWith(value);
    }else if(variable.endsWith('__ends_with')){
        theVar = observation[variable.stripLast(11)];
        return (isArray(theVar) || typeof(theVar)=="string") && theVar.endsWith(value);
    }else if(variable.endsWith('__in')){
        return isArray(value) && value.contains(observation[variable.stripLast(4)]);
    }else if(variable.endsWith('__neq')){
        return observation[variable.stripLast(5)] != value;
    }else if(variable.endsWith('__lt')){
        return observation[variable.stripLast(4)] < value;
    }else if(variable.endsWith('__lte')){
        return observation[variable.stripLast(5)] <= value;
    }else if(variable.endsWith('__gt')){
        return observation[variable.stripLast(4)] > value;
    }else if(variable.endsWith('__gte')){
        return observation[variable.stripLast(5)] >= value;
    }else{
        return observation[variable] == value;
    }
}

// A shortcut method for asking Bond how many times he has made a specific observation
Bond.seenTimes = function(location, observations){
    var result = Bond.seen(location, observations);
    if(!result){
        return 0;
    }else{
        return result.length;
    }
};

// Allows for the recording and replaying of execution by recording and reinstating objects.
// Turn on recording for a point with a call to Bond.recordAt(location) and then turn on replay with
// Bond.replayAt(location). Cancel with Bond.dontRecord(location).
// Can be used in local or remote mode, but in remote mode replaying doesn't work.
Bond.recordAt = function(location){
    if(this.remote){
        this.socket.emit('Bond.recordAt', {location: location});
    }else{
        this.recordingModes[location] = "record";
    }
};
Bond.replayAt = function(location){
    if(this.remote){
        this.socket.emit('Bond.replayAt', {location: location});
    }else{
        this.recordingModes[location] = "replay";
    }
};
Bond.dontRecord = function(location){
    if(this.remote){
        this.socket.emit('Bond.dontRecord', {location: location});
    }else{
        this.recordingModes[location] = "";
    }
};
// Set up recording points with a call to Bond.recordingPoint(location, state, params), where location is a string that
// labels the recording location, state is an object which will be directly recorded and modified (eg pass 'this'), and
// params is a map (object) of parameters which will be returned as is from the recordingPoint call during replay.
Bond.recordingPoint = function(location, state, params){
    if(this.remote){
        this.socket.emit('Bond.recordingPoint', {location: location, state: state, params: params});
        return null;
    }else{
        if(this.recordingModes[location] == "record"){
            this.recordedStates[location] = JSON.parse(JSON.stringify(state));
            this.recordedParams[location] = JSON.parse(JSON.stringify(params));
        }else if(this.recordingModes[location] == "replay"){
            if(this.recordedStates[location]){
                var recorded = this.recordedStates[location];
                unpack(recorded, state);
            }
            return this.recordedParams[location];
        }
        return null;
    }
};

Bond.readRecords = function(filename, callback){
    var bond = this;
    fs.readFile('./BondLogs/' + filename, function (err, data) {
        if (err) throw err;
        var records = JSON.parse(data);
        bond.recordedStates = records.states;
        bond.recordedParams = records.params;
        callback();
    });
};

Bond.saveRecords = function(filename){
    if(!filename) filename = "record.trace";
    fs.createWriteStream('./BondLogs/' + filename, {
        flags: 'w',
        encoding: "utf8"
    }).write(JSON.stringify({states: this.recordedStates, params: this.recordedParams}));
};

Bond.controlPanelCommand = function(data){
    if(data.command == "recordAt"){
        this.recordAt(data.location);
    }else if(data.command == "saveRecords"){
        this.saveRecords(data.filename);
    }
};

// Helper functions
Array.prototype.contains = function(element){
    return this.indexOf(element) != -1;
};
Array.prototype.beginsWith = function(element){
    return this.indexOf(element) == 0;
};
Array.prototype.endsWith = function(element){
    return this.indexOf(element) == this.length - 1;
};
String.prototype.contains = function(substring){
    return this.indexOf(substring) != -1;
};
String.prototype.beginsWith = function(prefix){
    return this.indexOf(prefix) == 0;
};
String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
String.prototype.stripLast = function(number) {
    return this.substring(0, this.length - number);
};

function isArray(a) { return Object.prototype.toString.apply(a) === '[object Array]'; }

function unpack(from, to){
    for(var member in from){
        if(typeof member == "object"){
            var newObj = (member instanceof Array) ? [] : {};
            unpack(member, newObj);
            to[member] = newObj;
        }else{
            to[member] = from[member];
        }
    }
}

// this is still pseudocode
Bond.compareNotes = function(logName, obsPoint, relevantFields, filters){
    var recorded = readLog(logName);    // import the saved log
    if(recorded){                       // if it exists
        if(logFilesEqual()){            // compare with the current log.
            return true;                // if equal, the test is considered passed
        }else{                          // otherwise,
            launchQueryBuilder();       // launch the query builder by sending an http request to a certain port
            return false;               // consider the test failed
        }
    }else{                              // if it doesn't exist
        saveLogFile(logName);           // save the current log
        return true;
    }
};

var fs;
if (typeof window === 'undefined'){
    exports.Bond = Bond;
    fs = require('fs');
}