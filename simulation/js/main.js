"use strict";

//HELPER FUNCTIONS
function round(x){
	return Math.round(x*1000)/1000;
}

//GRAPH FUNCTIONS
function distGraph(p1, p2, dist='und', dis=true){
	let x = [], y = [];

	let [start, end] = Limits.get(dist)(p1, p2);
	let freq = (dis? 1: DENSITY), gap = 1/freq;

	start = Math.ceil(start * freq);
	end = Math.trunc(end * freq);

	let total = 0;
	for(let i = start; i <= end && (isFinite(end) || total <= MAXP); i++){
		x.push(i*gap);
		y.push(Dist.get(dist)(i*gap, p1, p2));
		total += y.at(-1);
	}

	return {
		name: "Theoretical",
		x: x, y: y,
		mode: (dis? 'markers': 'lines'),
		type: 'scatter'
	};
}

function clteGraph(p1, p2, dist='und', cnt=100, dis=true){
	let x = [];
	for(let i = 0; i < TRIALS; i++){
		x.push(0);
		for(let j = 0; j < cnt; j++){
			x[i] += Rand.get(dist)(p1, p2);
		}
		x[i] /= cnt;
	}

	let trace = {
		name: "Experimental",
		x: x,
		type: 'histogram',
		histnorm: 'probability density'
	}

	if(dis){
		trace['xbins'] = {size: 1/cnt};
	}

	return trace;
}

//MAIN FUNCTIONS
function validate(choice){
	if(choice == ""){
		throw ("Please choose a distribution.");
	}

	//Validation of parameters
	let p1 = document.getElementById('p1').value;
	let p2 = document.getElementById('p2').value;
	let p3 = document.getElementById('p3').value;

	if(p1 == '' || (parameter2.has(choice) && p2 == '') || p3 == ''){
		throw ("Please enter the required parameters.");
	}

	if(isNaN(p1) || isNaN(p2) || isNaN(p3)){
		throw ("Please enter only numbers as parameters.");
	}

	p1 = parseFloat(p1);
	p2 = parseFloat(p2);
	p3 = parseInt(p3);
	
	// Sign
	if((p1 < 0) && !neg_para.includes(choice+'_p1')){
		throw ("The first parameter must be non-negative.");
	}

	if((p2 < 0) && !neg_para.includes(choice+'_p2')){
		throw ("The second parameter must be non-negative.");
	}

	if(p3 <= 0){
		throw ("The number of random variables must be positive.")
	}

	// Integral
	if(int_para.includes(choice+'_p1') && !(Number.isInteger(p1))){
		throw ("The first parameter must be an integer");
	}

	if(int_para.includes(choice+'_p2') && !(Number.isInteger(p2))){
		throw ("The second parameter must be an integer");
	}
	
	// Special cases
	if((choice == 'geo' || choice == 'bin') && (p1 > 1)){
		throw ("Success probability must be below 1.");
	}

	if((choice == 'unc') && (p1 > p2)){
		throw ("The first parameter must be smaller than or equal to the second parameter")
	}

	if((choice == 'und') && (p1 >= p2)){
		throw ("The first parameter must be smaller than the second parameter")
	}

	return [p1, p2, p3];
}

function CLT(){
	let choice = select.options[select.selectedIndex].value;
	
	layout.yaxis.title = "Probability Density";

	try{
		const [p1, p2, p3] = validate(choice);

		const mean = Mean.get(choice)(p1, p2);
		const sd = Math.sqrt(Variance.get(choice)(p1, p2)/p3)

		let graph = [];

		graph.push(clteGraph(p1, p2, choice, p3, disc.includes(choice)));
		graph.push(distGraph(mean, sd, 'nor', false));

		Plotly.newPlot(canvas, graph, layout);
		outputMoments(choice, p1, p2);
	}catch(e){
		alert(e);
	}
}

function change(){
	let choice = select.options[select.selectedIndex].value;

	const elements = document.getElementsByClassName('hidden');
	while(elements.length > 0) {elements[0].classList.remove('hidden');}

	// Parameters and the labels
	const p1l = document.getElementById('p1l');
	const p1 = document.getElementById('p1');

	const p2l = document.getElementById('p2l');
	const p2 = document.getElementById('p2');

	p1l.innerHTML = "\\( " + parameter1.get(choice) + " = \\)";
	p1.value = default_p1.get(choice);

	if(parameter2.has(choice)){
		p2l.innerHTML = "\\( " + parameter2.get(choice) + " = \\)";
		p2.value = default_p2.get(choice);
	}
	else{
		p2l.classList.add('hidden');
		p2.classList.add('hidden');
	}

	MathJax.typeset([p1l, p2l]);

	// Function
	const func = document.getElementById('func');
	func.innerHTML = "\\[ " + proFunc.get(choice) + " \\]";
	MathJax.typeset([func]);
}

function outputMoments(choice, p1=0, p2=0){
	const mom = document.getElementById('moments')
	let txt = "";
	let mean = Mean.get(choice)(p1, p2);
	let variance = Variance.get(choice)(p1, p2);

	mean = (mean == "Undefined"? mean: round(mean));
	variance = (variance == "Undefined"? variance:round(variance));

	txt += "\\(\\mu = E(X) = " + mean + "\\hspace{2cm}\\)";
	txt += "\\(\\sigma^2 = Var(X) = " + variance + "\\)";
	
	mom.innerHTML = txt;
	MathJax.typeset([mom]);
}
