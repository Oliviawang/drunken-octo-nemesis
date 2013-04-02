// from http://en.literateprograms.org/Quickhull_(Javascript)
function hull(points)
{
	var allBaseLines = new Array();

	var h = getConvexHull(points);
	
	// added this to remove redundant points
	var polygon = [];
	for (var i=0; i < h.length; i++) polygon.push(h[i][0]);

	return polygon;
	
	function getDistant(cpt, bl) {
	    var Vy = bl[1][0] - bl[0][0];
	    var Vx = bl[0][1] - bl[1][1];
	    return (Vx * (cpt[0] - bl[0][0]) + Vy * (cpt[1] -bl[0][1]));
	};

	function findMostDistantPointFromBaseLine(baseLine, points) {
	    var maxD = 0;
	    var maxPt = new Array();
	    var newPoints = new Array();
	    for (var idx in points) {
	        var pt = points[idx];
	        var d = getDistant(pt, baseLine);

	        if ( d > 0) {
	            newPoints.push(pt);
	        } else {
	            continue;
	        }

	        if ( d > maxD ) {
	            maxD = d;
	            maxPt = pt;
	        }

	    } 
	    return {'maxPoint':maxPt, 'newPoints':newPoints};
	};

	function buildConvexHull(baseLine, points) {

	    allBaseLines.push(baseLine);
	    var convexHullBaseLines = new Array();
	    var t = findMostDistantPointFromBaseLine(baseLine, points);
	    if (t.maxPoint.length) { // if there is still a point "outside" the base line
	        convexHullBaseLines = 
	            convexHullBaseLines.concat( 
	                buildConvexHull( [baseLine[0],t.maxPoint], t.newPoints) 
	            );
	        convexHullBaseLines = 
	            convexHullBaseLines.concat( 
	                buildConvexHull( [t.maxPoint,baseLine[1]], t.newPoints) 
	            );
	        return convexHullBaseLines;
	    } else {  // if there is no more point "outside" the base line, the current base line is part of the convex hull
	        return [baseLine];
	    }    
	};
	
	function getConvexHull(points) {

	    //find first baseline
	    var maxX, minX;
	    var maxPt, minPt;
	    for (var idx in points) {
	        var pt = points[idx];
	        if (pt[0] > maxX || !maxX) {
	            maxPt = pt;
	            maxX = pt[0];
	        }
	        if (pt[0] < minX || !minX) {
	            minPt = pt;
	            minX = pt[0];
	        }
	    }
	    var ch = [].concat(buildConvexHull([minPt, maxPt], points),
	                       buildConvexHull([maxPt, minPt], points));
	    return ch;
	};
	
}

// get arithmetical mean of point array
function mean(points)
{
	var x = 0, y = 0; // average point
	
	if (points.length==1) return points[0];
			
	for (var i=0; i < points.length; i++)
	{
		x+=points[i][0];
		y+=points[i][1];
	}
	
	x/=points.length;
	y/=points.length;
	
	return [x, y];
}

// get euclidean distance between two points
function dist(p, q)
{
	var d = Math.sqrt( (p[0]-q[0])*(p[0]-q[0]) + (p[1]-q[1])*(p[1]-q[1]) );

	return d;
}

function angle(v1, v2)
{
	var dot = v1.dot(v2);
	var rad = Math.acos(v1.dot(v2)/(v1.abs()*v2.abs()));

	var deg = rad * 180 / Math.PI;

	return deg;
}

// turns hull points (counter clockwise) into smooth contour path
function blob(points, smooth, offset)
{	
	var debug = true;
	
	if (offset == undefined) offset = 0;
	if (smooth == undefined) smooth = 1;
	
	var path_array = [];
	
	for (var i=0; i < points.length; i++)
	{
		var p = points[i];

		var h = (i-1); if (h<0) h = points.length-1;
		var j = (i+1) % points.length;
		
		// vectors to control points
		var v1 = [ points[h][0]-p[0], points[h][1]-p[1] ]; 
		var v1a= abs(v1);
		var v1_= [v1[0]/v1a, v1[1]/v1a];

		var v2 = [ points[j][0]-p[0], points[j][1]-p[1] ];
		var v2a= abs(v2);
		var v2_= [v2[0]/v2a, v2[1]/v2a];
		
		// if (debug) R.circle(p[0]+v1_[0]*20, p[1]+v1_[1]*20, i/2+.1).attr({stroke: 'green', fill: 'green'});
		// if (debug) R.circle(p[0]+v2_[0]*20, p[1]+v2_[1]*20, i/2+.1).attr({stroke: 'green', fill: 'green'});

		// angle-dividing vector inbetween v1 and v2
		var v0 = [v1_[0]+v2_[0], v1_[1]+v2_[1] ];
		var v0a= abs(v0);
		var v0_= [v0[0]/v0a, v0[1]/v0a];

		var m1 = (p[0]-points[h][0])/(points[h][1]-p[1]);
		var m2 = (points[j][0]-p[0])/(points[j][1]-p[1]);

		console.log(i, angle(v1,v2) );

		var qv = [ -v0_[1], v0_[0] ];
		var rv = [ v0_[1], -v0_[0] ];

		var qa= abs(qv);
		var ra= abs(rv);

		// determine whether convex or concav point
		
		var dot = qv.dot(rv);
		var rad = Math.acos(qv.dot(rv)/(qa*ra));
		var deg = rad * 180 / Math.PI;

		var ql = rl = 10;		

		// point distances
		var qd = dist(points[h],p);
		var rd = dist(p,points[j]);

		// smoothness factors, smooth: [0..1] from sharp to smooth
		ql = smooth * qd / 3;
		rl = smooth * rd / 3;
		
		var q = [p[0]-ql*qv[0]/qa, p[1]-ql*qv[1]/qa];
		var r = [p[0]-rl*rv[0]/ra, p[1]-rl*rv[1]/ra];

		if (debug) R.circle(q[0], q[1], 2).attr({stroke: 'blue', fill: 'blue'});
		if (debug) R.circle(r[0], r[1], 2).attr({stroke: 'red', fill: 'red'});
		
		// control points on a line, leading to NaN's
		if (v0a==0)
		{
			q = p;
			r = p;
			v0_ = [0,0];
		}
		
		var qpr = [q,p,r];
		var qpr_ = translate(qpr, -offset*v0_[0], -offset*v0_[1]);
		
		path_array = path_array.concat(qpr_[0], qpr_[1], qpr_[2]);
		
		if (debug) R.text(p[0], p[1],i).attr({'font-size': 20});
	}

	for (var i=0; i < 4; i++) path_array.push( path_array.shift() );

	var path = "M " + path_array[path_array.length-2] + " "+path_array[path_array.length-1];
	path += " C "+path_array.join(" ");

	path+="Z";
	
	return path;
}

// get random points
function cloud(n, x_min, x_max, y_min, y_max)
{
	var points = [];
	for (var i=0; i < n; i++)
	{
		points.push( [ x_min + Math.random()*(x_max-x_min), y_min + Math.random()*(y_max-y_min) ]);
	}
	
	return points;
}

// get length of vector
function abs(v)
{
	return Math.sqrt(v[0]*v[0] + v[1]*v[1]);
}

// get polygon path
function poly(points)
{
	var path = "M"+points[0][0]+" "+points[0][1]+" L";
	for (var i=0; i < points.length; i++) path += points[i][0]+','+points[i][1]+',';
	path+="Z";

	return path;
}

// get rectangle path
function rect(p,q)
{
	return "M "+p[0]+" "+p[1]+" L "+[q[0],p[1],q[0],q[1],p[0],q[1]].join(" ")+"Z";
}

// move points by x and y
function translate(p, x, y)
{
	var newp = [];
	for (var i=0; i < p.length; i++)
	{
		newp.push( [p[i][0]+x, p[i][1]+y] );
	}
	return newp;
}

// get bounding box points
function boxPoints(o)
{
	var bb = o.getBBox();
	return [ [bb.x, bb.y], [bb.x+bb.width, bb.y], [bb.x, bb.y+bb.height], [bb.x+bb.width, bb.y+bb.height] ];
}

// get square path
function square(p,s)
{	
	return rect([p[0]-s/2, p[1]-s/2], [p[0]+s/2, p[1]+s/2]);
}

// returns unit vector
function unit(v)
{
	return [ v[0]/abs(v), v[1]/abs(v) ];
}

// returns perpendicular vector
function flip(v)
{
	return [ -v[1], v[0] ];
}

function add(v,w)
{
	return [v[0]+w[0], v[1]+w[1]];
}

function sub(v,w)
{
	return [v[0]-w[0], v[1]-w[1]];
}

function mul(v,a)
{
	return [v[0]*a, v[1]*a];
}

function div(v,a)
{
	return [v[0]/a, v[1]/a];
}


// vector

Array.prototype.abs = function()
{
	return Math.sqrt(this[0]*this[0] + this[1]*this[1]);
};

Array.prototype.mul = function(a)
{
	return [this[0]*a, this[1]*a];
};

Array.prototype.div = function(a)
{
	return [this[0]/a, this[1]/a];
};

Array.prototype.add = function(v)
{
	return [this[0]+v[0], this[1]+v[1]];
};

Array.prototype.sub = function(v)
{
	return [this[0]-v[0], this[1]-v[1]];
};

Array.prototype.unit = function()
{
	return [ this[0]/this.abs(), this[1]/this.abs() ];
};

Array.prototype.flip = function()
{
	return [ -this[1], this[0] ];
};

Array.prototype.str = function()
{
	return " "+this[0]+" "+this[1]+" ";
};

Array.prototype.dot = function(v)
{
	return this[0]*v[0] + this[1]*v[1];
};


// objects

function Collection()
{
	var items = [];
	var hullblob = null; // blob object
	var circle = null;
	
	// add unlimited items
	this.add = function()
	{
		for( var i = 0; i < arguments.length; i++ )
		{
			items.push(arguments[i]);
		}
		
		return this;
	};
	
	// get the corner points of all items; returns [ [x,y], ... ]
	this.corners = function()
	{
		var points = [];
		
		for (var i=0; i < items.length; i++)
		{
			points = points.concat(items[i].corners());
		}
		
		return points;
	};
	
	// draw all items in collection
	this.draw = function()
	{
		for (var i=0; i < items.length; i++)
		{
			items[i].draw();
		}
		return this;
	};
	
	// get center point and radius for circle; returns [x, y, r]
	this.mean = function()
	{
		var x = 0;
		var y = 0;
		var a = 0;
		
		for (var i=0; i < items.length; i++)
		{
			x += items[i].x;
			y += items[i].y;
			a += items[i].a;
		}
		x /= items.length;
		y /= items.length;
		
		r = Math.sqrt(a/Math.PI);
		return [x, y, r];
	};
	
	// draw smooth hull around items
	this.blob = function(smooth)
	{
		// if (ret) return blob(hull(this.corners()), smooth);
		
		if (hullblob==null) hullblob = R.path(blob(hull(this.corners()),smooth)).attr({fill: 'black', opacity: 0});
		else hullblob.animate({path: blob(hull(this.corners()),smooth)}, 500);
	};
	
	this.cluster = function()
	{
		var m = this.mean();
		// circle = R.circle(m[0], m[1], m[2]).attr({stroke: 'red'});
		var u = Math.PI * m[2] * 2;

		var points = [];
		
		// determine p (points on circle) and v (vector from circle center)
		var corners = hull(this.corners());		
		for (var i=0; i < corners.length; i++)
		{
			var p = corners[i]; // corner point 
			// R.circle(p[0], p[1], 1);

			var v = p.sub(m);
			v = v.div(v.abs()).mul(m[2]); // vector from m to p_
			p = m.add(v); // corresponding point on circle

			// R.circle(p[0], p[1], 1);
			// R.text(p[0], p[1], i);
			
			points.push({p: p, v: v});
		}
		
		// determine control points q and r according to arc lengths
		for (var i=0; i < points.length; i++)
		{
			if (i==0) var prev = points[points.length-1];
			else var prev = points[i-1];
			
			if (i==points.length-1) var next = points[0];
			else var next = points[i+1];
			
			var v = points[i].v;
			var p = points[i].p;
			
			var t = v.unit().flip();

			var al = prev.v.dot(points[i].v) / (m[2] * m[2]);
			var be = next.v.dot(points[i].v) / (m[2] * m[2]);

			if (al > 1) al = 1;
			if (be > 1) be = 1;
			if (al < -1) al = -1;
			if (be < -1) be = -1;

			var alpha = Math.acos( al );
			var beta	= Math.acos( be );
			
			// arc lengths
			var k = alpha / (2*Math.PI);
			var l = beta / (2*Math.PI);
			
			var q = p.add(t.mul(alpha*m[2]/(2*Math.sqrt(2))));
			var r = p.sub(t.mul(beta*m[2]/(2*Math.sqrt(2))));
			
			// R.circle(q[0], q[1], .5).attr({stroke: 'green'});
			// R.circle(r[0], r[1], .5).attr({stroke: 'red'});
						
			points[i].q = q;
			points[i].r = r;
		}

		var first = points.shift();
		var path = "M "+first.p.str() + " C "+first.r.str();
		
		for (var i=0; i < points.length; i++)
		{
			var q = points[i].q;
			var p = points[i].p;
			var r = points[i].r;
			
			path += q.str() + p.str() + "C" + r.str();
		}
		
		path+=first.q.str()+first.p.str();
		path+="Z";

		// var last = points.pop();
		// var path = "M "+last.p.str() + " C "+last.r.str();
		// 
		// for (var i=0; i < points.length; i++)
		// {
		// 	var q = points[i].q;
		// 	var p = points[i].p;
		// 	var r = points[i].r;
		// 	
		// 	path += q.str() + p.str() + "C" + r.str();
		// }
		// 
		// path+=last.q.str()+last.p.str();
		// path+="Z";

		hullblob.animate({path: path, opacity: 1}, 500);
		
		for (var i=0; i < items.length; i++)
		{
			items[i].cluster(m);
		}
		
		// R.path(path);
	};
	
		
}

function Item(p, s)
{
	this.a = s * s;
	this.x = p[0];
	this.y = p[1];
	this.o = null;
	
	this.draw = function()
	{
		this.o = R.path(square(p,s)).attr({fill: 'black'});
		return this;
	};
	
	this.corners = function()
	{
		return [
			[p[0]-s/2, p[1]-s/2],
			[p[0]-s/2, p[1]+s/2],
			[p[0]+s/2, p[1]-s/2],
			[p[0]+s/2, p[1]+s/2]			
		];
	};
	
	this.cluster = function(m)
	{
		console.log(m);
		
		// move to x y
		
		this.o.animate({path: square(m, s), opacity: 0}, 500);
		
	};
	
}