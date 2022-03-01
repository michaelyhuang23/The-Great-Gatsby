

let below = false;

const cutoffHead = 200;

var textHead = new Blotter.Text("The Hidden Gatsbies", {
  family : "serif",
  size : 100,
  fill : "white",
  paddingLeft : 300,
});

var materialHead = new Blotter.FliesMaterial();

materialHead.uniforms.uPointCellWidth.value = 0.01;
materialHead.uniforms.uPointRadius.value = .8;
materialHead.uniforms.uSpeed.value = 5;

var blotterHead = new Blotter(materialHead, { 
  texts : textHead,
});

blotterHead.needsUpdate = true;

var elemHead = document.getElementById('title-text');
var scopeHead = blotterHead.forText(textHead);

scopeHead.appendTo(elemHead);


window.addEventListener("scroll", (event) => {
    let scroll = this.scrollY;
    if(this.scrollY > cutoffHead)
    	elemHead.style.opacity = 0;
    else
	    elemHead.style.opacity = 1-this.scrollY/cutoffHead;
});