var Keyboard = {
	Keys : {}
};

window.addEventListener("keydown", function(e){
	Keyboard.Keys[e.key] = true;
});
window.addEventListener("keyup", function(e){
	Keyboard.Keys[e.key] = false;
});