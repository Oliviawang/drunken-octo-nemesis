exports.gauss = function(x)
{
	var mu = 0; // expected value
	var d2 = 1; // variance
	
	var a = 1 / (Math.sqrt(d2) * Math.sqrt(2 * Math.PI));
	var b = mu;
	var c = Math.sqrt(d2);
	
	return Math.pow(a*e, -(x-b)*(x-b) / (2 * c * c));
}