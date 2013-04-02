// from http://en.literateprograms.org/Quickhull_(Javascript)
function quickhull(points)
{
	var allBaseLines = new Array();

	return getConvexHull(points);
	
	function getDistant(cpt, bl) {
	    var Vy = bl[1][0] - bl[0][0];
	    var Vx = bl[0][1] - bl[1][1];
	    return (Vx * (cpt[0] - bl[0][0]) + Vy * (cpt[1] -bl[0][1]))
	}

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
	    return {'maxPoint':maxPt, 'newPoints':newPoints}
	}

	function buildConvexHull(baseLine, points) {

	    allBaseLines.push(baseLine)
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
	}
	
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
	                       buildConvexHull([maxPt, minPt], points))
	    return ch;
	}
	
	
}