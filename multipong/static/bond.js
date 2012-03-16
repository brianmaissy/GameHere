// The Bond testing library - James Bond spies on your code while it's running and reports back to you.

// Bond keeps his records in a dictionary mapping observation locations to lists of observations made there.
// Each observation itself is a dictionary mapping labels of targets to their values
var Bond = {
    observations: []
};

// Tell Bond to start a new mission by clearing his past observations
Bond.start = function(){
    Bond.observations = [];
};

// Tell Bond to keep an eye on somebody with a call to Bond.spy(location, {target: value}) where 'location' is a
// string naming the place he is observing from, 'target' is a label for who he is spying on, and 'value' is what he records.
Bond.spy = function(location, observation){
    if(!Bond.observations[location]){
        Bond.observations[location] = [];
    }
    Bond.observations[location].push(observation);
};

// Ask Bond if he has seen something with a call to Bond.seen(location, target) where 'location' and 'target' are strings
// and he will respond with a list of the values he has seen target take on, or null if that list happens to be empty.
// You can ask Bond with an extra parameter value to filter his results by observations of the value given.
Bond.seen = function(location, target, value){
    var obs = Bond.observations[location];
    var results = [];
    var i;
    for(i=0; i<obs.length; i++){
        if(obs[i][target] && (!value || obs[i][target]==value)){
            results.push(obs[i][target]);
        }
    }
    if(results.length == 0){
        return null;
    }else{
        return results;
    }
};

// A shortcut method for asking Bond how many times he has made a specific observation
Bond.seenTimes = function(location, target, value){
    var result = Bond.seen(location, target, value);
    if(!result){
        return 0;
    }else{
        return result.length;
    }
};

// A helper function, because javascript is so pathetically lacking in usable and readable functions
Array.prototype.contains = function(element){
    return this.indexOf(element) != -1;
};

if (typeof window === 'undefined'){
    exports.Bond = Bond;
}else{
    this.Bond = Bond;
}