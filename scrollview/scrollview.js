// Precondition: view inside clip
function Scrollview(view) {
	var pos = 0;
	var startX = 0;
	var diffX = 0;

	view.addEventListener('touchstart', function(event) {
		startX = event.touches[0].pageX;
	});
	view.addEventListener('touchmove', function(event) {
		var currX = event.touches[0].pageX;
		diffX = currX - startX;
		this.style.webkitTransform = 'translate3d(' + (pos + diffX) + 'px, 0px, 0px)';
	});
	view.addEventListener('touchend', function(event) {
		pos = pos + diffX;
	});
}
