
NMAX = 500;

SPEED = 400;
ZOOM_DELAY = 1000 ;

// COLORS:

COLOR_BG	= "#ccc"; // back
COLOR_R1	= "#eee";	// outer region
COLOR_R2	= "#fff"; // inner region
COLOR_L1	= "#999";	// outer label
COLOR_L2	= "#aaa";	// inner label
COLOR_L3	= "#555";	// item label

// themes = 	[non,    SCI/TEC   ECONOMY  CULTURE	  CONFLICTS  POLITICS  ACTIVISM  SOCIETY ];
THEME_COLORS = ["#999","#BF8F31","#59B042","#A13886","#C43542","#603BB4","#4071B1", "#ACB13A" ]; // medium
// THEME_COLORS = ["#999","#B37F0C","#4E9B39","#8D2271","#B8000D","#3D1F8C","#15477E", "#ABAC37" ]; // dark
// THEME_COLORS = ["#AAA","#E4CA91","#A9DF9A","#E1ABD4","#AA696F","#7081BA","#93C0DB", "#CED575" ];

PAN_STARTED = false;

// SIZE SPNS
TINY	= 0;
SMALL	= 1;
MEDIUM = 2;
LARGE	= 3;
HUGE	= 4;

// SIZING AT DIFFERENT LEVELS
// if (VISUAL) THRESHOLDS = [10,50,250,400,650];
// else THRESHOLDS = [20,80,250,350,550];

if (VISUAL) THRESHOLDS = [10,50,200,400,500];
else THRESHOLDS = [20,80,250,350,450];


TINY_S	= THRESHOLDS[TINY] ;
SMALL_S	= THRESHOLDS[SMALL] ;
MEDIUM_S= THRESHOLDS[MEDIUM] ;
LARGE_S	= THRESHOLDS[LARGE] ;
HUGE_S	= THRESHOLDS[HUGE] ;
TINY_A = TINY_S*TINY_S;
SMALL_A = SMALL_S*SMALL_S;
MEDIUM_A = MEDIUM_S*MEDIUM_S;
LARGE_A = LARGE_S*LARGE_S;
HUGE_A = HUGE_S*HUGE_S;

// LESS MATH
ROOT_OF_PI = Math.sqrt(Math.PI);
ROOT_OF_TWO = Math.sqrt(2);

// CLUSTERING/RANKING
RESIZE = true;
CLUST_DIST = 0;
ITEM_DIST = 1;
CLUSTER_BORDER_DIST = 1;
MAX_CLUSTER_STEPS = 5;
MAX_OVERLAP_STEPS = 10;
CLUSTER_ITEM_SIZE = .35;

// CLUSTER COLOR
BRIGHTER = 33;
CLUSTER_OPAC = .66;

// SIZING/SCALING
DOT_SIZE = 5; // side for non-relevant items
PER_MIN = 1; // scaling the screen alocation based on number of items
PER_MAX = 15;
PER_ONE = 15;

// max string lengths for labels
LABEL_TITLE = 35;
LABEL_AUTHOR = 25;
if (BOOKS) LABEL_TEXT = 200;
else LABEL_TEXT = 100;

// font-sizes for labels
LABEL_MIN = 5;
LABEL_MAX = 15;

// max string lengths for textual items
ITEM_TITLE = 100;
ITEM_AUTHOR = 50;
ITEM_TEXT = 300;

NEUTRAL_CLUSTER_COLOR = "#bbb";
NEUTRAL_CLUSTER_BORDER = "#ccc";

if (BOOKS)
{
	DOC_WIDTH = 200;
	DOC_HEIGHT = 125;		
}
else
{
	DOC_WIDTH = 200;
	DOC_HEIGHT = 150;	
}

INCLUDE_TAGS = ['a', 'b', 'i', 'em', 'strong', 'p', 'br', 'blockquote'];

HOVER_FACTOR = 10;
HOVER_EVENT = null;
HOVER_DELAY = SPEED*2;

function View(basediv, topdiv, data)
{
	var R = Raphael(topdiv);
	
	var items = data.items;
			
	// basic variables and events
	this.init = function()
	{
		window.scrollBy(0,-50);		
		
		this.base = null;
		this.drawn = false; // avoid animation on first draw
		this.items = data.items;
		this.shown = []; 	// items within window
		this.hidden = []; // items outside window
		this.clusters = {}; // clusters
		this.colors = {}; // data colors		
		
		this.contours = data.contours;
		this.tags = data.tags;		
		this.panDiff = [0,0];
		
		this.bounds = data.bounds;

		this.facet = $("#facet").val();		
		
		this.timeVar = "published"; // bounds computed on server

		this.width = $(window).width();
		this.height = $(window).height();
		
		this.testLabel = $(".testLabel");		
		this.lastQuery = "";
		
		this.hovered = null;

		this.bg = R.rect(0, 0, this.width, this.height).attr({opacity: 0});
		
		// setup over, get started with base layer and eventing		
		this.changeBase(this);
		this.events();
		
		return this;
	};

	// switch underlying layout
	this.changeBase = function()
	{
		this.facet = $("#facet").blur().val();
		
		$("."+basediv).attr({id: 'oldbase'}).css({'z-index': 0});
		$('body').append('<div class="'+basediv+'" id="'+basediv+'"></div>');
		$("#"+basediv).css({opacity: 0});
		
		if (this.facet!=1)
		{
			$("#"+basediv).animate({opacity: 1}, SPEED, function(){ $("#oldbase").remove(); });		
			setTimeout((function (that) { return function() { that.display(true); }; })(this), SPEED);
		}
						
		// time
		if (this.facet==0)
		{
			this.base = new TimeMap(basediv, this).init();
		}
		// geo
		else if (this.facet==1)
		{
			this.base = new GeoMap(basediv, 50, 10, (function (that) { return function() { 
					$("#"+basediv).animate({opacity: 1}, SPEED, function(){ $("#oldbase").remove(); });
					setTimeout((function (that) { return function() { that.display(true); }; })(that), SPEED);
			}; })(this)
			).init();
		}
		// tags
		else if (this.facet==2)
		{
			this.base = new TagMap(basediv, this).init();
		}
	};


	/*  base interaction  */

	// maps item to into pixel position
	this.map = function(item, old)
	{
		if (typeof old === "undefined" ) old = false;
		
		// time
		if (this.facet==0)
		{
			// TOOD: find better ranking
			
			var y = this.height/2;
			// 	this.interval( item.views,
			// 	this.stats.views[0], this.stats.views[1],
			// 	100, $("#"+topdiv).height()-100
			// );			
			
			return [this.base.map(item.published*1000, old), y];
		}
		// map
		else if (this.facet==1)
		{
			 return this.base.map(item.lat, item.lng, old);
		}
		else if (this.facet==2)
		{
			 return this.base.map(item.mdsx, item.mdsy, old);
		}
	};

	// map pixel position to facet data
	this.map_ = function()
	{
		if (this.facet==0)
		{
			var y = this.height/2;
			return [this.base.map_(arguments[0], old), y];
		}
		else this.base.map_(arguments[0], arguments[1], old);		
	};
	
	// checks whether item is in current view
	this.within = function(item)
	{
		// time
		if (this.facet==0)
		{
			return this.base.within(item.published*1000);
		}
		// location
		else if (this.facet==1)
		{
			return this.base.within(item.lat, item.lng);
		}
		// tags
		else if (this.facet==2)
		{
			return this.base.within(item.mdsx, item.mdsy);
		}
	};
	

	/*  events  */
	
	// register zoom and pan events
	this.events = function()
	{
		// base change
		$("#facet").change(
			(function (that) { return function() { view.changeBase(); }; })(this)
		);
		
		 this.bg.attr({fill: '#000'});
		
		// zooming
		var lastZoom = 0;		
		$(window).wheel( zoom(this, lastZoom) );
		// $("#"+topdiv).wheel( zoom(this, lastZoom) );
		// $(this.bg.node).wheel( zoom(this, lastZoom) );
		
		function zoom(that, lastZoom)
		{
			return (function (that, lastZoom) { return function(e,d) {
								
				if (VISUAL && that.hovered) 
				{
					that.toggleItem(that.hovered);
					return;
				}
				
				if ($(e.target).parents(".item").hasClass('large')) return;
				// if ($(e.target).parents(".item").hasClass('medium')) return;
				if ($(e.target).parents(".item").hasClass('hovered')) return;
				
				window.clearTimeout(HOVER_EVENT);
				
				var thisZoom = new Date().getTime();

				if (thisZoom-lastZoom>ZOOM_DELAY)
				{
					lastZoom = thisZoom;
					that.zoom(e,d);
				}
			}; })(that, lastZoom);
		}
		
		// panning
		// $("#"+topdiv).mousedown(
		$(this.bg.node).mousedown(			
			(function (that) { return function(e) {
				
				if (that.hovered) 
				{
					that.toggleItem(that.hovered);
					return;
				}
				
				that.lastPageX = e.pageX;
				that.lastPageY = e.pageY;

				$(document).mousemove(
					(function (that) { return function(e) {
						var diffX = e.pageX - that.lastPageX;
						var diffY = e.pageY - that.lastPageY;
						
						that.lastPageX = e.pageX;
						that.lastPageY = e.pageY;

						that.pan(diffX, diffY);
					}; })(that)
				);

				$(document).mouseup( 
					(function (that) { return function(e) {
						delete that.lastPageX;
						delete that.lastPageY;
						$(document).unbind('mousemove');
						$(document).unbind('mouseup');
						
						that.panRelease();
					}; })(that)
				);

			}; })(this)
		);
		
		// search
		$("#search").blur(function(){ 
			if ($(this).val()!=this.lastQuery) view.ranking(true);		
		});
		
		$("#search").keyup(function(e){
			
			var s = $("#search");
			var v = s.val();			

			clearTimeout(view.searchTimeOut);
			
			// esc
			if (e.which==27)
			{
				s.val("").blur();
				view.display(true, false);
			}
			// enter
			else if (e.which==13)
			{
				s.blur();
				view.display(true, false);
			}
			else view.searchTimeOut = setTimeout(function(){
				view.display(true, false);
			}, SPEED);

			if (v=="") s.attr({size: 10});
			
			if (v.length>8) s.attr({size: v.length+4});
			else s.attr({size: 12});
			
			s.unbind('click');
			if (e.which!=27) s.click(function()
			{	
				if ($("#search").val()=="")
				{
					view.display(true, false);
					$("#search").attr({size: 10}).blur().unbind("click");
				}
			});
		});
		
		// hide all clusters when mouse is on background
		// $(this.bg.node).mousedown(
		// 	(function (that) { return function(e) {
		// 		view.closeClusters();
		// 	}; })(this), null);
		
	};
	
	// pan event
	this.pan = function(x, y)
	{
		// pan base layer
		this.base.pan(x,y);

		// stop animations in progress
		if (!PAN_STARTED)
		{
			for (id in this.clusters)
				if (typeof this.clusters[id].obj !== "undefined") this.clusters[id].obj.stop();
			for (var i=0; i < this.items.length; i++)
				if (typeof this.items[i].obj !== "undefined") this.items[i].obj.stop();			
			PAN_STARTED = true;
		}

		// items and clusters
		for (id in this.clusters)
		{
			this.clusters[id].c[0]+=x;
			if (this.facet!=0) this.clusters[id].c[1]+=y;
		}

		for (var i=0; i < this.shown.length; i++)
		{
			this.items[this.shown[i]].dim.p[0]+=x;
			if (this.facet!=0) this.items[this.shown[i]].dim.p[1]+=y;
		}
		
		// this.draw(false);
		
		this.window().spacing(false).draw(false);
	};

	// pan event when mouse released
	this.panRelease = function()
	{
		PAN_STARTED = false;
		
		window.scrollBy(0,-50);		
		
		if (typeof this.base.panRelease !== "undefined" ) this.base.panRelease();		
		
		this.display(true, true);
	};
	
	// zoom event
	this.zoom = function(e,d)
	{
		// pan base layer
		this.base.zoom(e,d);
		
		this.display(true);
	};


	/*  vis pipeline  */

	// 1) determine items in current view
	this.window = function()
	{
		this.shown = [];
		this.hidden = [];
		this.missing = [];

		if (typeof NMAX !== "undefined") var n = NMAX;
		else var n = this.items.length;		
		n = Math.min(this.items.length, n);

		for (var i=0; i < n; i++)
		{			
			if (this.hasFacet(this.items[i])==false) this.missing.push(i);
			else if (this.within(this.items[i])) this.shown.push(i);
			else this.hidden.push(i);
		}
		return this;
	};

	// 2) based on search term or popularity, all items receive a relevance score: [0,1]
	this.ranking = function(all)
	{	
		if (typeof all === "undefined") all = false;
		
		// TODO: deal with exclusion (-), required tags (+), multiple tags
			
		var include = this.shown.concat([]);		
		if (all) include = include.concat(this.hidden);			
			
		var q = $("#search").val();
		
		// based on popularity: [.1,1]
		if (q=="")
		{
			var max = 0;
			
			for (var i=0; i < include.length; i++)
			{
				it = this.items[include[i]];
				max = Math.max(max, it.pop);
			}

			for (var i=0; i < include.length; i++)
			{
				it = this.items[include[i]];				
				if (!RESIZE) it.relevance = 1;
				else it.relevance = this.interval(it.pop, 0, max, 0.01, 1);
			}
		}
		// based on search matches: [0, m]
		else
		{			
			var terms = q.toLowerCase().split(" ");
			
			var max = 0;
			for (var i=0; i < include.length; i++)
			{
				it = this.items[include[i]];
				
				var string = it.tags + " " + it.text + " " + it.title + " " + it.title;

				var match_count = 0;
				
				var remove = false;
				var keep = true;
				
				for (var j=0; j < terms.length; j++)
				{	
					var term = terms[j];
					term = term.replace(" ", "");
					if (term=="") continue;
					
					// remove items that have this
					if (term.charAt(0)=='-') 
					{
						var re = new RegExp(term.substr(1), "gi");					
						if (string.match(re)!=null) remove = true;
					}
					// keep only items that have this
					else if (term.charAt(0)=='+') 
					{
						var re = new RegExp(term.substr(1), "gi");					
						var matches = string.match(re);
						if (matches==null) keep = false;
						else match_count += matches.length;						
					}
					// regular terms
					else					
					{
						var re = new RegExp(term, "gi");					
						var matches = string.match(re);
						if (matches!=null) match_count += matches.length;
					}
				}
				
				if (remove || !keep || match_count==0) it.relevance = 0;
				// if (match_count==0) it.relevance = 0;
				else if (!RESIZE) it.relevance = 1;
				else
				{	
					it.relevance = match_count;
					max = Math.max(it.relevance, max);
				}
			}
			
			// if (DONT_RESIZE!=false)
			// {
			// 	// normalize 
			// 	
			// 	for (var i=0; i < include.length; i++)
			// 	{
			// 		it = this.items[include[i]];
			// 		if (max==0) it.relevance = 0;
			// 		else it.relevance /= max;
			// 	}
			// }
		}
		
		return this;
	};
	
	// 3) allocate space, set sizes, choose images
	this.spacing = function(allowResize)
	{
		if (typeof allowResize === "undefined") allowResize = true;
		if (typeof allowAllocate === "undefined") allowAllocate = true;
		
		// adjust screen space use based on number of items in view		
		if (allowResize)
		{
			// space per relevance, considering current window
			this.allocate = function()
			{
				var n = 0;
				for (var i=0; i < this.shown.length; i++) if (this.items[this.shown[i]].relevance>0) n++;
				var per = this.interval(n, 2, 500, PER_MAX , PER_MIN);						
				if (per > PER_MAX) per = PER_MAX; if (per < PER_MIN) per = PER_MIN;			
				if (n==1) per = PER_ONE;

				var A = this.width*this.height * per/100; // screen space to allocate
				var R = 0;		// summed up relevance
				for (var i=0; i < this.shown.length; i++) R+=this.items[this.shown[i]].relevance;

				if (R==0) return this.AR;
				else return A/R; // area per relevance unit;
			};
			
			// alternative? space per relevance, considering current zoom level			
			
			this.AR = this.allocate();
			// // this.AR = this.allocate();
			// this.AR = 500;
		}
		
		// position and size items
		for (var i=0; i < this.shown.length; i++)
		{
			var it = this.items[this.shown[i]];
			
			// skip rescaling for items that are already displayed
			// if (typeof it.obj !== "undefined" && !allowResize) continue;
			if (typeof it.obj !== "undefined" && !allowResize) continue;
			
			// set area according to its relevance over the AR unit
			var a = this.AR * it.relevance;
			
			// get color URL
			if (VISUAL && typeof it.colorURL === "undefined") it.colorURL = this.getColor(it.color);			
					
			this.sizeItem(a, it);
		}
		
		return this;
	};
	
	// 3) according to size, set right image; sets img url and whether it's a dot
	this.sizeItem = function(a, it, inCluster)
	{
		if (typeof inCluster === "undefined") inCluster = false;
		
		var r = Math.sqrt(a) / ROOT_OF_PI;

		// remember old size, to see if label has to be changed; if inCluster already saved				
		if (typeof it.size === "undefined") it.size_ = -1;				
		else if (!inCluster) it.size_ = it.size; 
		
		// set new size
		if (a<TINY_A) it.size=TINY;
		else if (a<SMALL_A) it.size=SMALL;
		else if (a<MEDIUM_A) it.size=MEDIUM;
		// else if (a<LARGE_A) it.size=LARGE;
		else it.size=LARGE;
		
		var im = {};
		if (VISUAL)
		{
			// choose the right image according to area and inCluster
			if (a<TINY_A)
			{
				// just solid color, no image
				im = {a:TINY_A, s:TINY_S, w:TINY_S, h: TINY_S};
				it.img = it.colorURL; // solid color for small dots
				it.dot = true; // not a thumbnail
			}
			else
			{				
				// choose appropriate image
				for (var j=0; j < it.images.length; j++)
				{
					im = it.images[j];

					// don't take square if outside of cluster, 
					if (!inCluster && a>TINY_A && im.t==1) continue; 
					else if (inCluster && a>SMALL_A && im.t==1) continue; 

					if (im.a>a) break; // if image exceeds allocated size, keep it
				}

				it.img = im.url;
				it.dot = false; // not a small dot
			}
		}
		// TEXTUAL
		else
		{
			if (a<TINY_A) // for square
			{
				im = {a:TINY_A, s:TINY_S, w:TINY_S, h: TINY_S};
				it.dot = true; // not a thumbnail
			}
			else // fixed aspect ratio for any size beyond square.., different orientation for HUGE
			{
				if (this.hovered!=null && it.id==this.hovered.id && !BOOKS)
				{
					im = {a: DOC_WIDTH*DOC_HEIGHT, s: Math.sqrt(DOC_WIDTH*DOC_HEIGHT), w:DOC_HEIGHT, h: DOC_WIDTH};				
				}
				else im = {a: DOC_WIDTH*DOC_HEIGHT, s: Math.sqrt(DOC_WIDTH*DOC_HEIGHT), w:DOC_WIDTH, h: DOC_HEIGHT};
			}
			
			if (!isNaN(it.color))
			{
				it.color = THEME_COLORS[it.color];
			}			
		}

		// new dimensions			
		var f = Math.sqrt(a/im.a); // factor: ratio of dedicated size / image size
		
		if (!it.hovered && !inCluster)
		{
			 var p = this.map(it); 
		}
		else
		{
			var p = [it.dim.p[0], it.dim.p[1]];
		}
		
		// new position
		var q = [p[0], p[1]]; // backup
		var dim = {p: p, w: im.w*f, h: im.h*f, a: a, r: r, ia: im.a, q: q};
		dim.h2 = dim.h/2; dim.w2 = dim.w/2; // half sizes, to reduce computing later

		// keep old dimensions unless it's in a cluster
		if ((typeof it.dim !== 'undefined' && !inCluster && !it.hovered)) it.dim_ = Object.clone(it.dim);
		// there are no old dimensions, copy new ones, with old mapping
		else if (!inCluster && !it.hovered)
		{
			it.dim_ = Object.clone(dim);
			it.dim_.p = this.map(it, true);
		}
		else if (inCluster)
		{
			dim.pb = p;
		}
		
		// set new dimensions
		it.dim = dim;				
	};
	
	// 4) cluster and re-position items
	this.cluster = function()
	{	
		// determine clusters
		
		this.clusterItems = function(clusters)
		{
			// delete cluster in draw, if not found again.. TODO: or find next best match?
			for (id in this.clusters) this.clusters[id].d = true;
			
			// generate clusters based on distance to existing clusters...
			for (var i=0; i < this.shown.length; i++)
			{
				var count=0;
				var it = this.items[this.shown[i]];			

				it.clustered = false;
				delete it.cluster;

				if (typeof it.dim === "undefined") continue;

				if (it.dim.a>DOT_SIZE*DOT_SIZE) //it.dot
				{	
					var p = it.dim.p;
					// var p = Object.clone(it.dim.q);

					var added = false;

					// compare to existing clusters
					for (var j=0; j < clusters.length; j++)
					{
						var cl = clusters[j];
						var c = cl.c;

						if (c.dist(p) < cl.r+it.dim.r+CLUST_DIST)
						{
							cl.ids.push(it.id);
							cl.items.push(it);
							cl.n++;
							cl.a+=it.dim.a;
							cl.r = Math.sqrt(cl.a) / ROOT_OF_PI;
							cl.c = [ c[0]*(cl.n-1)/cl.n+p[0]/cl.n, c[1]*(cl.n-1)/cl.n+p[1]/cl.n ]; // new cluster center
							it.clustered = true;							
							added = true;
							count++;
							break;
						}
					}

					if (!added)
					{
						var cluster = {						
							ids: [it.id],
							items: [it],
							n: 1,
							r: Math.sqrt(it.dim.a) / ROOT_OF_PI,
							a: it.dim.a,
							c: Object.clone(p),
							d: false
						};
						it.clustered = true;
						clusters.push(cluster);
					}
				}
			}
			
			return count;		
		};
		
		this.clusterClusters = function(clusters)
		{
			// var changes = 0;
			var clusters2 = [];

			for (var i=0; i < clusters.length; i++)
			{
				var a = clusters[i];
				var added = false;

				// compare to existing clusters
				for (var j=0; j < clusters2.length; j++)
				{
					var b = clusters2[j];
					var n = b.n+a.n;

					if (a.c.dist(b.c) < a.r+b.r+CLUST_DIST)
					{
						b.ids = b.ids.concat(a.ids);
						b.items = b.items.concat(a.items);
						b.a+=a.a;
						b.r = Math.sqrt(b.a) / ROOT_OF_PI;
						b.c = [ b.c[0]*b.n/(n)+a.c[0]*a.n/(n), b.c[1]*b.n/(n)+a.c[1]*a.n/(n) ]; // new cluster center
						b.n = n;
						added = true;
						// changes++;
						break;
					}
				}

				if (!added) clusters2.push(a);
			}
			
			return clusters2;
		};

		// make averages
		
		this.prepareClusters = function(clusters)
		{
			// distinguish between n>1 clusters and single items
			for (var i=0; i < clusters.length; i++)
			{
				// cluster of one, not added
				if (clusters[i].n==1)
				{
					clusters[i].items[0].clustered = false;
					delete clusters[i].items[0].cluster;
				}
				// real cluster
				else
				{
	 				clusters[i].ids = clusters[i].ids.sort(function(a,b){return a - b;});				
					var id = clusters[i].ids.join("_");

					// cluster exists already
					if (typeof this.clusters[id] !== "undefined")
					{
						this.clusters[id].c = clusters[i].c;
						this.clusters[id].a = clusters[i].a;
						this.clusters[id].r = clusters[i].r;
						this.clusters[id].d = false;
						this.clusters[id].open = false;
					}
					else
					{
						this.clusters[id] = clusters[i];
						this.clusters[id].id = id;
					}

					var cl = this.clusters[id];

					// get average color from all items, weighted by relevance
					if (true || VISUAL)
					{
						var R = 0; // relevance sum
						var avg = [0,0,0];

						for (var j=0; j < cl.items.length; j++)
						{
							var it = cl.items[j];
							var col = this.hex2rgb(it.color);
							var rel = it.relevance;
							avg[0]+=col[0]*rel;
							avg[1]+=col[1]*rel;
							avg[2]+=col[2]*rel;
							R+=rel;
						}

						avg[0]/=R;
						avg[1]/=R;
						avg[2]/=R;

						// make brighter?
						if (avg[0]+BRIGHTER<255) avg[0]+=BRIGHTER; else avg[0]=255;
						if (avg[1]+BRIGHTER<255) avg[1]+=BRIGHTER; else avg[1]=255;
						if (avg[2]+BRIGHTER<255) avg[2]+=BRIGHTER; else avg[2]=255;

						cl.color = "rgb("+avg.join(",")+")";				
					}
					// for TEXTUAL resources
					else cl.color = NEUTRAL_CLUSTER_COLOR;
				
					// half sizes of clustered items				
					for (var j=0; j < cl.items.length; j++)
					{
						if (CLUSTER_ITEM_SIZE!=1)
						{
							var it = cl.items[j];
							this.sizeItem(it.dim.a*CLUSTER_ITEM_SIZE, it, true);
						}
						
						// make note of item's cluster
						it.cluster = id;						
					}				
				}
			}
		};
		
		// spread out items in a cluster
		this.spreadItems = function(cl)
		{	
			var overlaps = 0;
			for (var i=0; i < cl.items.length; i++)
			{					
				var ita = cl.items[i];
				var pa = ita.dim.p;
				var q = ita.dim.q;
				var ra = ita.dim.r;
				var r_avg = cl.r / Math.sqrt(cl.items.length);
				
				for (var j=0; j < cl.items.length; j++)
				{	
					if (i!=j)
					{
						var itb = cl.items[j];
						var pb = itb.dim.p;
						var rb = itb.dim.r;
						
						if (this.overlap(ita, itb))
						{				
							overlaps++;
										
							var d = pa.dist(pb)-ITEM_DIST;
							
							var v = [ pa[0]-pb[0], pa[1]-pb[1] ];
							
							// if they have exactly the same position, move in random direction
							if (v[0]==0 && v[1]==0) v = [Math.random(), Math.random()];
							
							// length of move
							var m = (ra+rb-d)/(ra+rb);
							v = v.unit();
							
							var va = v.mul(r_avg/10+r_avg/ra);
							var vb = v.mul(r_avg/10+r_avg/rb);
							
							pa[0]+=va[0];
							pa[1]+=va[1];
							
							pb[0]-=vb[0];
							pb[1]-=vb[1];							
						}
					}
				}
			}
			
			return overlaps;				
		};
		
		// move all items inside of circle: using center and radius
		this.contractItems_ = function(cl)
		{
			for (var i=0; i < cl.items.length; i++)
			{					
				var it = cl.items[i];
				var p = it.dim.p; // item position
				var c = cl.c; // cluster center
				var r = cl.r; // cluster center

				// check if item is outside cluster
				var f = d-(r-it.dim.r);

				var d = c.dist(p);
				
				if (d > cl.r-it.dim.r)
				{
					// vector towards center
					var v = [ p[0]-c[0], p[1]-c[1] ];
					
					// give diff vector length of how much item is outside of circle					
					v = v.unit().mul(f);
					
					// get new point for item
					p = [ p[0]-v[0], p[1]-v[1] ];
					it.dim.p = p;
				}
			}
		};
		
		// move all items inside of circle: using corner points
		this.contractItems = function(cl)
		{
			for (var i=0; i < cl.items.length; i++)
			{					
				var it = cl.items[i];
				var c = cl.c; // cluster center
				var r = cl.r; // cluster center
				
				var b = this.bbox(it);
				
				var p1 = [b.p1[0], b.p1[1]];
				var p2 = [b.p2[0], b.p2[1]];
				var p3 = [b.p2[0], b.p1[1]];
				var p4 = [b.p1[0], b.p2[1]];

				var d1 = c.dist(p1);
				var d2 = c.dist(p2);
				var d3 = c.dist(p3);
				var d4 = c.dist(p4);

				var d = Math.max(d1, d2, d3, d4);
				
				// if a corner point lies outside
				if (d>r-CLUSTER_BORDER_DIST)
				{
					// get point to correct for
					if (d==d1) 			var p = p1;
					else if (d==d2) var p = p2;
					else if (d==d3) var p = p3;
					else if (d==d4) var p = p4;
					
					var v = [ p[0]-c[0], p[1]-c[1] ];

					// give diff vector length of how much item is outside of circle					
					v = v.unit().mul((d-r+CLUSTER_BORDER_DIST));

					// get new point for item
					
					// p = [ p[0], p[1]-v[1]];
					// var p = it.dim.p; // item position
					
					it.dim.p = [it.dim.p[0]-v[0], it.dim.p[1]-v[1]];
				}
			}
		};

		// move items close to home
		this.anchorItems = function(cl)
		{
			for (var i=0; i < cl.items.length; i++)
			{					
				var it = cl.items[i];
				var q = Object.clone(it.dim.q); // backup item position
				var p = it.dim.p; // actual item position
				var c = cl.c; // cluster center
				
				// if point is outside, take point on circle border
				var d = c.dist(p);
				if (d>c.r) // see above..
				{
					var v = [ q[0]-c[0], q[1]-c[1] ];
					v = v.unit().mul(d-(cl.r-it.dim.r));
					q = [ q[0]-v[0], q[1]-v[1] ];
				}
				
				// now nudge item's current location back home
				
				// vector towards center
				var w = [ p[0]-q[0], p[1]-q[1] ];
				
				d = q.dist(p);
				w = w.unit().mul(d/5);
				p = [ p[0]-w[0], p[1]-w[1] ];
				it.dim.p = p;				
			}
		};

		/*  -----------------------------------------------------------------------------   */
		
		var clusters = [];
		
		// initial clustering of items
		if (MAX_CLUSTER_STEPS>0) count = this.clusterItems(clusters);

		// run clusters against each other > avoid overlapping clusters		
		if (MAX_CLUSTER_STEPS>1)
		{
			var diff = 1;
			var runs = 1;
			
			while (diff>0 && runs<MAX_CLUSTER_STEPS) 
			{	
				var before = clusters.length;			
				clusters = this.clusterClusters(clusters);
				var after = clusters.length;
				diff = before-after;
			}
		}
			
		// distinguish between clusters and items, get avg colors, ...	
		this.prepareClusters(clusters);
		
		// go through all clusters to position items within
		for (id in this.clusters)
		{
			var cl = this.clusters[id];
			
			if (cl.d==false)
			{
				this.contractItems(cl);
				
				// iteratively reduce overlap
				var overlaps = this.spreadItems(cl);
				var count = 1;
				while (count<MAX_OVERLAP_STEPS && overlaps>0)
				{
					overlaps = this.spreadItems(cl);
					this.contractItems(cl);
					count++;
				}
			}
		};
		
		return this;
	};
	
	// 5) draw all items and clusters
	this.draw = function(animate)
	{	
		// show, change, and hide items and clusters:
		
		if (VISUAL) // photos, paintings, ..
		{
			this.showItem = function(it, animate)
			{
				var d = it.dim;				// new
				var d_ = it.dim_;  		// old
				var p = d.p;					// new pos
				var p_ = d_.p; 				// old pos

				var attr = {x: p[0]-d.w2, y: p[1]-d.h2, width: d.w, height: d.h, opacity: 1};

				it.obj = R.image(it.colorURL, p_[0]-d_.w2, p_[1]-d_.h2, d_.w, d_.h);
				it.obj.attr({cursor: 'pointer', opacity: 0}); //href: it.link

				it.hover = false;				
				it.obj.hover(
					(function (it, that) { return function(e) {
						it.hover = true;
						that.handleLabel(it, false);
					
					};})(it, this),
					(function (it, that) { return function(e) { 
						it.hover = false;
						that.handleLabel(it, false);
					};})(it, this)				
				);

				it.obj.click(
					(function (it, that) { return function(e) {
						that.toggleItem(it);
					}; })(it, this)
				);

				if (animate) it.obj.animate(attr, SPEED);
				else it.obj.attr(attr);

				if (d.a>=TINY_A)
				{
					var img = new Image(); img.src = it.img;
					img.onload = (function (it) { return function() {
						if (typeof it.obj !== "undefined") it.obj.node.href.baseVal = it.img;
					}; })(it);
				}
			};

			this.changeItem = function(it, animate)
			{
				// dimensions and positions
				var d = it.dim;		// new
				var d_ = it.dim_; // old			
				var p = d.p;			// pos

				var attr = {x: p[0]-d.w2, y: p[1]-d.h2, width: d.w, height: d.h, opacity: 1};

				// stop animations, e.g. cluster fanouts
				// it.obj.stop();

				if (it.relevance==0)
				{
					var s = DOT_SIZE; var s2 = s/2;
					attr = {x: p[0]-s2, y: p[1]-s2, width: s, height: s, opacity: .5};
					it.obj.toBack();
				}

				if (animate)
				{
					it.obj.animate(attr, SPEED);				

					if (d.ia > d_.ia) 
					{
						var img = new Image(); img.src = it.img;
						img.onload = (function (it) { return function() {
							if (typeof it.obj !== "undefined") it.obj.node.href.baseVal = it.img;
						}; })(it);
					}
					else if (d.ia < d_.ia) setTimeout((function (it) { return function() {
						it.obj.node.href.baseVal = it.img;
					}; })(it), SPEED);
					
					
				}
				else
				{
					if (d.ia != d_.ia) it.obj.node.href.baseVal = it.img;
					it.obj.attr(attr);
				}
			};

			this.hideItem = function(it, animate)
			{
				if (animate)
				{				
					var p = this.map(it);
					var d = it.dim;

					if (typeof it.obj !== "undefined")
						it.obj.animate({x: p[0]-d.w2, y: p[1]-d.h2, opacity: 0}, SPEED, function(){this.remove();});
				}
				else
				{
					if (typeof it.obj !== "undefined") it.obj.remove();
				}
				delete it.obj;
				delete it.dim;
			};
			
			this.handleLabel = function(it, animate)
			{					
				// if (typeof hover === "undefined") hover=false;
				// if (it.hover) animate=false;
				
				var d = it.dim;				// new
				var d_ = it.dim_;  		// old
				var p = d.p;					// new pos
				var p_ = d_.p; 				// old pos

				// hide or not show when too small
	 			if (it.size < MEDIUM && !it.hover)
				{
					if (typeof it.txt !== "undefined") this.hideLabel(it, animate);
					return;
				}

				// values to adjust based on size:
				var size_ = this.interval(d_.r, 0, 100, LABEL_MIN, LABEL_MAX);	if (size_>LABEL_MAX) size_=LABEL_MAX;
				var size = this.interval(d.r, 0, 100, LABEL_MIN, LABEL_MAX);		if (size>LABEL_MAX) size=LABEL_MAX;
				var opac = this.interval(d.a, MEDIUM_A, LARGE_A, .5, 1, true); 
				var off = this.interval(d.a, SMALL_A, LARGE_A, 2, 8); off=Math.min(10,off);

				if (it.hover)
				{
					size = Math.max(size, 10);
					// opac = 1;
				}

				// target style
				var css = {left: p[0], top: p[1]+d.h2+off, opacity: opac, "font-size": size};

				// avoid redundant html changes, keep track of changes			
				var text = "";

				// title
				text+= "<a href='"+it.link+"'>"+this.trimString(it.title,LABEL_TITLE)+"</a> ";

				// author
				if (d.a > (SMALL_A+MEDIUM_A)/2 || (it.hover && d.a > SMALL_A))
				{	
					text += " <span class='author'>";
					// text += " ("+this.dateString(it)+") ";
					text += "by&nbsp;" + this.trimString(it.author,LABEL_AUTHOR);
				}		

				// description
				if (it.size > MEDIUM && it.text!=null)
				{						
					text += " – "+this.dateString(it)+"</span> ";					
					var desc = $("<p>"+it.text+"</p>").text();
					if (desc.length>0)
					{
						text += "<br><span class='desc'>" + this.trimString(desc, LABEL_TEXT)
					}
				}

				text += "</span> ";

				// test label with text and attr to get dimensions			
				this.testLabel.html(text).css(css);			
				var w2 = this.testLabel.outerWidth()/2;
				css.left = p[0]-w2;

				// old style for new label
				if (typeof it.txt === "undefined")
				{
					if (it.hover) { var css_ = Object.clone(css); css_.opacity = 0;}
					else var css_ = {left: p_[0]-w2, top: p_[1]+d_.h2+off, opacity: 0, "font-size": size};
					$("body").append("<div class='label' id='txt_"+it.id+"'></div>");
					it.txt = $("#txt_"+it.id);
					it.txt.css(css_);
				}

				if (animate) 
				{
					// if label is new, change text immediately and animate
					if (it.size_<MEDIUM)
					{
						it.txt.html(text);
						it.txt.animate(css, SPEED);
					}
					// if level change, first animate then exchange text				
					else
					it.txt.animate(css, SPEED, (function (text) { return function() {
						$(this).html(text);
					}; })(text));							
				}

				else {it.txt.css(css); it.txt.html(text);}

			};

			this.hideLabel = function(it, animate, hover)
			{
				if (typeof hover === "undefined") hover=false;				
				
				if (typeof it.txt !== "undefined")
				{
					if (animate)
					{
						if (hover) var css = {opacity: 0};
						else
						{						
							var d = it.dim;				// new
							var d_ = it.dim_;  		// old

							if (typeof d !== "undefined" && typeof d.p !== "undefined") var h2 = d.h2;					
							else var h2 = d_.h2;					

							var p = this.map(it);					

							var w2 = it.txt.outerWidth()/2;
							var css = {left: p[0]-w2, top: p[1]+h2, opacity: 0};
						}
						
						it.txt.animate(css, SPEED, function(){$(this).remove();});					
					}
					else
					{
						it.txt.remove();
					}

					delete it.txt;
				}
			};
			
		}
		else // textual
		{
			this.showItem = function(it, animate)
			{
				if (it.relevance==0 && DOT_SIZE==0) this.hideItem(it);

				var d = it.dim;				// new
				var d_ = it.dim_;  		// old
				var p = d.p;					// new pos
				var p_ = d_.p; 				// old pos

				var css = {left: p[0]-d.w2, top: p[1]-d.h2, width: d.w, height: d.h, opacity: 1};
				var css2 = {}; // specifically for inner div

				// object was loaded before
				if (typeof it.obj_ !== "undefined")
				{
					it.obj = it.obj_;
					delete it.obj_;
					it.obj.show().css({left: p_[0]-d_.w2, top: p_[1]-d_.h2, width: d_.w, height: d_.h});					
				}
				// brand new item
				else if (typeof it.obj === "undefined")
				{
					$("body").append("<div class='item' id='it_"+it.id+"'><div class='inner'></div></div>");
					it.obj = $("#it_"+it.id).css({left: p_[0]-d_.w2, top: p_[1]-d_.h2, width: d_.w, height: d_.h});				
					it.obj.css({opacity: 0, "border-color": it.color, "background-color": it.color});

					// hover
					it.obj.hover(
						(function (it, that) { return function(e) {
							if (!it.clustered && it.size==TINY) it.inn.animate({opacity: .5}, SPEED/2);
							else it.inn.animate({opacity: 1}, SPEED/2);
						};})(it, this),
						(function (it, that) { return function(e) { 
							it.inn.stop().css({opacity: it.opac});
						};})(it, this)				
					);
					
					// click
					it.obj.click(
						(function (it, that) { return function(e) {
							that.toggleItem(it);							
						}; })(it, this)
					);

					var text = "";

					// remove country in globalvoicesonline titles
					var title = it.title;					
					if (it.link.search("globalvoicesonline")!=1)
					{
						title = it.title.split(":");
						if (title.length==1) title = title[0];
						else if (title.length==2) title = title[1];
						else 
						{
							title.shift();
							title = title.join(":");
						}
					}
					
					text+= "<h1><a>"+this.trimString(title,ITEM_TITLE)+"</a></h1>";
					if (BOOKS)
					{
						if (it.images.length==1) text+= "<img src='"+it.images[0].url+"'>";
						else text+= "<img src='"+it.images[1].url+"'>";
					}
					else text+= "<img src='"+it.images[0].url+"'>";
					
					text+= "<h2><span>"+ this.dateString(it) +"&nbsp;</span>";
					text+=" <span>by&nbsp;"+this.trimString(it.author,ITEM_AUTHOR)+"</span></h2>";

					text+= "<div class='text'>"+this.cleanString(it.text, INCLUDE_TAGS)+"</div>";
					
					// comments
					// if (it.pop==0 || it.pop == null || typeof it.pop === "undefined")
					// 	text+= "<div class='text'><a href='"+it.link+"'>No comments yet.</a></div>";
					// else if (it.pop==1) text+= "<div class='text'>One comment. <a href='"+it.link+"'>Join the conversation.</a></div>";
					// else text+= "<div class='text'>"+it.pop+" comments. <a href='"+it.link+"'>Join the conversation.</a></div>";

					it.inn = it.obj.find(".inner");					
					it.inn.html(text);
					
					it.inn.find(':not(h1) a').css({"color": it.color});	
				}
				// check if anything changed
				else
				{
					if (d.a==d_.a && p[0]==p_[0] && p[1]==p_[1] && !it.hovered)
					{
						// console.log('nochange');
						return;
					}
				}
				
				// stop animations, e.g. cluster fanouts
				// it.obj.stop();

				// font size
				css["font-size"] = this.interval(d.a, TINY_A, MEDIUM_A, 6, 14, true);
				// if (it.size<LARGE) 
				// else css["font-size"] = 15;				
				// else css["font-size"] = this.interval(d.a, MEDIUM_A, LARGE_A, 15, 15, true);
				
				// this allows some styling differences in css
				if (it.size==TINY) it.obj.addClass("tiny"); 		else it.obj.removeClass("tiny");
				if (it.size==SMALL) it.obj.addClass("small"); 	else it.obj.removeClass("small");
				if (it.size==MEDIUM) it.obj.addClass("medium"); else it.obj.removeClass("medium");
				if (it.size==LARGE) it.obj.addClass("large"); 	else it.obj.removeClass("large");
				
				// opacity of inner element
				if (d.a<TINY_A) var opac = 0;
				else if (d.a>SMALL_A) var opac = 1;
				else var opac = this.interval(d.a, TINY_A, SMALL_A, .3, 1, true);
				if (animate) it.obj.find(".inner").animate({opacity: opac}, SPEED);
				else it.obj.find(".inner").css({opacity: opac});
				
				// to go back to, when hover is terminated before timeout
				it.opac = opac;
				
				// unmatched dots to back
				if (it.relevance==0) it.obj.addClass("back");
				else it.obj.removeClass("back");

				if (animate)
				{
					it.obj.animate(css, SPEED);
					it.inn.animate(css2, SPEED);
				}
				else
				{
					it.obj.css(css);
					it.inn.css(css2);
				}
			};

			this.changeItem = function(it, animate)
			{				
				this.showItem(it, animate);
			};

			this.hideItem = function(it, animate)
			{
				if (animate)
				{				
					var p = this.map(it);
					var d = it.dim;
				
					if (typeof it.obj !== "undefined")
						it.obj.animate({left: p[0]-d.w2, top: p[1]-d.h2, opacity: 0}, SPEED, function(){$(this).hide();});
				}
				else
				{
					if (typeof it.obj !== "undefined") it.obj.hide();
				}
				it.obj_ = it.obj;
				delete it.obj;		
				delete it.dim;		
			};
			
		};
				
		this.toggleItem = function(it)
		{	
			if (this.hovered==null) {var detail = true; }
			else if (this.hovered.id==it.id) {var detail = false; }
			else if (this.hovered != null) { this.toggleItem(this.hovered); var detail = true; }
			
			if (detail)
			{
				this.bg.toFront().animate({opacity: .66}, SPEED);
				$(".control").animate({opacity: 0}, SPEED);
				
				this.hovered = it;
				it.hovered = true;

				// save backup
				it.dim_ = Object.clone(it.dim);

				this.sizeItem(HUGE_A, it, it.clustered);
				
				// position on centre				
				if (VISUAL) var offset = 20; else var offset = 0;
				it.dim.p = [this.width/2, this.height/2-offset];
				
				if (VISUAL)
				{
					for (var i=0; i < this.shown.length; i++) this.hideLabel(this.items[this.shown[i]], false);	
					this.handleLabel(it, true);
					it.obj.toFront();
				}
				else
				{
					// add link
					// it.obj.find("h1 > a").removeAttr('href');				
					setTimeout((function (it) { return function() { it.obj.find("h1 > a").attr({href: it.link}); };})(it), SPEED);
					
					// dim other elements
					for (var i=0; i < this.shown.length; i++)
					{
						var other = this.items[this.shown[i]];
						if (it.id!=other.id) other.obj.animate({opacity: .1}, SPEED);
					}
					it.obj.addClass("hovered");
				}
				
				this.changeItem(it, true);
			}
			else
			{
				$(".control").animate({opacity: 1}, SPEED);
				
				this.bg.toBack();
				this.bg.animate({opacity: 0}, SPEED, function(){});
				
				this.hovered = null;
				
				// retrieve backup
				it.dim = Object.clone(it.dim_);
				
				this.sizeItem(it.dim.a, it, it.clustered);

				this.changeItem(it, true);	
				
				if (VISUAL) this.handleLabel(it, true);
				else 
				{
					// remove title link and class
					it.obj.removeClass("hovered");					
					setTimeout((function (it) { return function() { it.obj.find("h1 > a").removeAttr("hrf"); };})(it), SPEED);					
					
					for (var i=0; i < this.shown.length; i++)
					{
						var other = this.items[this.shown[i]];
						// if (it.id!=other.id) 
						other.obj.animate({opacity: 1}, SPEED);
					}
				}
				it.hovered = false;								
			}
		};
				
		this.showCluster = function(cl, animate)
		{			
			var c = cl.c;
			var r = cl.r;
			
			//cursor: default/auto/crosshair/pointer/move/*-resize/text/wait/help;
			
			var attr = {fill: cl.color, stroke: cl.color, opacity: CLUSTER_OPAC, 'stroke-opacity': 1, cursor: 'pointer'};
			
			if (false) //!VISUAL
			{
				attr['stroke-width'] = 1;				
				attr['stroke-opacity'] = 1;
				attr['stroke'] = NEUTRAL_CLUSTER_BORDER;
			}
			
			if (animate)
			{
				var c_ = [0,0]; // get old centre
				for (var i=0; i < cl.items.length; i++)
				{	
					if (typeof cl.items[i].dim === "undefined") var p = this.map(cl.items[i], true);
					else var p = cl.items[i].dim_.p;
				 	c_ = c_.plus(p);
				}
				c_ = c_.div(cl.items.length);
				
				cl.obj = R.circle(c_[0], c_[1], r).attr(attr).attr({opacity: 0});
				cl.obj.animate({cx: c[0], cy: c[1], opacity: CLUSTER_OPAC}, SPEED);
			}
			else 
			{
				cl.obj = R.circle(c[0], c[1], r).attr(attr);
			}
			
			// // hover events
			// cl.obj.hover(
			// 	(function (cl) { return function(e) {
			// 		cl.obj.animate({r: 1.1*cl.r}, 3*SPEED);
			// 	};})(cl),
			// 	(function (cl) { return function(e) { 
			// 		cl.obj.stop().animate({r: cl.r}, SPEED/2);
			// 	};})(cl)				
			// );
			
			// click events
			cl.obj.click((function (cl,that) { return function() {  that.toggleCluster(cl);	}; })(cl,this));
				
			cl.obj.toBack();
			this.bg.toBack();
		};
		
		this.changeCluster = function(cl, animate, toggle)
		{				
			if (typeof toggle === "undefined") toggle = false;
			
			var p = cl.c;
			var r = cl.r;
			var stroke = 0;
			var op = 1;
			
			if (toggle)
			{
				stroke = .8*r;
				r *= 1.4;
				op = 0;
			}
			
			var attr = {cx: p[0], cy: p[1], r:r, "fill-opacity": op, "stroke-width": stroke};
			if (animate) 
			{
				cl.obj.animate(attr, SPEED);
			}
			else cl.obj.attr(attr);
			
			if (toggle) {cl.obj.toBack(); this.bg.toBack();}
		};
		
		this.hideCluster = function(cl, animate)
		{				
			// remove cluster edges			
			for (var i=0; i < cl.items.length; i++)
			{	
				var it = cl.items[i];
				if (typeof it.edge !== "undefined")
				{
					if (animate) it.edge.animate({opacity: 0}, SPEED, function(){this.remove();});
					else it.edge.remove();
					delete it.edge;
				}
			}
			
			// fade clusters away with proper destination positions
			if (animate)
			{
				var c = [0,0]; // get new centre
				for (var i=0; i < cl.items.length; i++)
				{	
					var it = cl.items[i];					
					var p = this.map(it);
				 	c = c.plus(p);
				}
				
				c = c.div(cl.items.length);
				cl.obj.animate({cx: c[0], cy: c[1], opacity: 0}, SPEED, function(){ this.remove(); });				
			}
			else cl.obj.remove();
			
			delete this.clusters[cl.id];			
		};
		
		this.toggleCluster = function(cl)
		{
			if (cl.open) cl.open = false; else cl.open = true;
			var opening = cl.open;
		
			// ARRANGE ITEMS AROUND
			
			// hide everything else
			for (id in this.clusters)
			{
				if (id!=cl.id)
				{
					if (opening) this.clusters[id].obj.animate({opacity: 0.1}, SPEED);
					else this.clusters[id].obj.animate({opacity: CLUSTER_OPAC}, SPEED);
				}
			}
			
			for (var i=0; i < this.shown.length; i++)
			{
				var it = this.items[this.shown[i]];
				
				if (it.cluster!=cl.id)
				{
					if (opening) it.obj.animate({opacity: 0.1}, SPEED);
					else it.obj.animate({opacity: 1}, SPEED);
				}
				
			}

			// get angle around c
			if (opening)
			{
				for (var i=0; i < cl.items.length; i++)
				{
					var it = cl.items[i];
					var p = it.dim.p;
					var u = [-1,0];
					var v = cl.c.sub(p);
					var angle = u.angle(v);
					if (v[1]<0) angle = 360 - angle;
					it.angle = angle;
				}
			}
			else
			{
				for (var i=0; i < cl.items.length; i++)
				{
					var it = cl.items[i];
					delete it.angle;
				}				
			}
			
			// sort items according to angle
			if (opening)
			{
				cl.items = cl.items.sort( function(a,b){return a.angle - b.angle;} );

				var sum_r = 0; // sum of radii 
				for (var i=0; i < cl.items.length; i++)
				{
					var it = cl.items[i];
					var r = it.dim.r;
					sum_r += r;
				}
				
				// get angle for each slice and get actual points
				var running_angle = null;
				for (var i=0; i < cl.items.length; i++)
				{
					var it = cl.items[i];
					var r = it.dim.r;
					
					if (i == 0) var j=cl.items.length-1; else j=i-1;
					
					var it0 = cl.items[j];
					var r0 = it0.dim.r;
					
					var angle = .5 * 360 * r / sum_r; 
					var angle0 = .5 * 360 * r0 / sum_r;
					
					if (running_angle==null) running_angle = 90;
					running_angle += angle+angle0;
					
					var rad = running_angle * (Math.PI / 180);
					
					// backup real p
					it.dim.pb = Object.clone(it.dim.p);
					
					var its_r  = 1.1*cl.r+2*it.dim.r
					
					var x = Math.sin(rad) * its_r;
					var y = Math.cos(rad) * its_r;
					var v = cl.c.sub(it.dim.p);
					it.dim.p = [cl.c[0]+x, cl.c[1]+y];
					
					// double size
					it.dim.w*=ROOT_OF_TWO;
					it.dim.w2*=ROOT_OF_TWO;
					it.dim.h*=ROOT_OF_TWO;
					it.dim.h2*=ROOT_OF_TWO;
					// it.dim.w*=2;
					// it.dim.w2*=2;
					// it.dim.h*=2;
					// it.dim.h2*=2;
					
					// avoid overlap with neighbor
					if (i!=0)
					{
						var checks = 0;
						var overlapped = true;
						while (overlapped && checks<10)
						{
							checks++;
							if (this.overlap(it, cl.items[i-1]))
							{
								var lapped = true;
								its_r += .5*it.dim.r;
								// its_r += it.dim.r;
								x = Math.sin(rad) * its_r;
								y = Math.cos(rad) * its_r;
								v = cl.c.sub(it.dim.pb);
								it.dim.p = [cl.c[0]+x, cl.c[1]+y];
							}
							else overlapped = false;
						}						
					}
					
					// draw edge
					var e0 = this.map(it).join(" ");
					var e1 = it.dim.pb.join(" ");					
					var e2 = it.dim.p.join(" ");
					
					it.edge = R.path("M"+e1+" L"+e0).attr({opacity: 0, stroke: it.color,
						 'stroke-width': it.dim.r/5, "stroke-linecap": 'round'}).toBack();
					it.edge.animate({path: "M"+e2+" L"+e0, opacity: 1}, SPEED);
					
				}
				
				// hide all other items
				
				



			}
			// restore original position
			else
			{
				// cl.obj.animate({opacity: 1}, SPEED);
				
				for (var i=0; i < cl.items.length; i++)
				{
					var it = cl.items[i];
					var p = Object.clone(it.dim.pb);
					
					// it.dim.w/=2;
					// it.dim.w2/=2;
					// it.dim.h/=2;
					// it.dim.h2/=2;					
					it.dim.w/=ROOT_OF_TWO;
					it.dim.w2/=ROOT_OF_TWO;
					it.dim.h/=ROOT_OF_TWO;
					it.dim.h2/=ROOT_OF_TWO;	
					
					// var p_ = Object.clone(it.dim.p_);
					it.dim.p = p;
					// it.dim.p = p_;
					
					var e0 = this.map(it).join(" ");
					var e2 = it.dim.p.join(" ");
					it.edge.animate({path: "M"+e2+" L"+e0, opacity: 0}, SPEED, function(){this.remove();});
					delete it.edge;
				}
			}
			
			// TODO: dim/show all other items

			// make mark on item, to make larger			
			for (var i=0; i < cl.items.length; i++)
			{				
				var it = cl.items[i];
				this.changeItem(it, true);
				if (VISUAL) this.handleLabel(it, true);
			}
			
			
			
			this.changeCluster(cl, true, opening);			
			
			
			
		};
		
		this.closeClusters = function(except)
		{	
			if (typeof except === "undefined") except==null;
			
			for (id in this.clusters)
			{
				var cl = this.clusters[id];
				if (cl.open==true && cl.id != except) 
				{
					this.toggleCluster(cl);
				}
			}
		};
		
		
		/*  -----------------------------------------------------------------------------   */
		
		// mark all as unhovered
		// for (var i=0; i < this.items; i++) this.items[i].hovered = false;		
		if (this.hovered!=null) this.toggleItem(this.hovered);
		
		// go through clusters (first b/c we rely on some items)
		for (id in this.clusters)
		{
			var cl = this.clusters[id];
			if (typeof cl.obj === "undefined") this.showCluster(cl, animate);
			else if (cl.d == false) this.changeCluster(cl, animate);
			else if (cl.d == true) this.hideCluster(cl, animate);
		}
		
		// go through items to be shown or changed
		for (var i=0; i < this.shown.length; i++)
		{	
			var it = this.items[this.shown[i]];
			if (VISUAL) this.handleLabel(it, animate);
			if (typeof it.obj === "undefined") this.showItem(it, animate);
			else this.changeItem(it, animate);
		}
				
		// remove items to be hidden (outside view or facet)
		var hidden = this.hidden.concat(this.missing);
		for (var i=0; i < hidden.length; i++)
		{			
			var it = this.items[hidden[i]];
			if (VISUAL) this.hideLabel(it, animate);
			if (typeof it.obj !== "undefined") this.hideItem(it, animate);
		}
		
		
		
		
		return this;	
	};

	// 1-5) full display pipeline: window, ranking, layout, display
	this.display = function(animate, getWindow)
	{
		// avoid transition into display
		if (!this.drawn)
		{
			animate = false;
			this.drawn = true;
		}
		
		if (typeof getWindow === "undefined") getWindow = true;
		if (getWindow) this.window();
				
		this.ranking(true).spacing().cluster().draw(animate);
	};

	
	/*  helpers  */

	// checks whether item has current facet
	this.hasFacet = function(item)
	{
		// if (typeof item === "undefined") return false;
		
		if (this.facet==0 && typeof item.published != null) return true;
		else if (this.facet==1 && item.lat != null && typeof item.lng != null) return true;
		else if (this.facet==2 && item.mdsx != null && typeof item.mdsy != null) return true;
		else return false;
	};
	
	// get bounding box respecting displacement vector
	this.bbox = function(it)
	{
		var dim = it.dim;
		var p = dim.p;
		var w2 = dim.w2;
		var h2 = dim.h2;
		
		var bb = {
			p1: [p[0]-w2, p[1]-h2],
			p2: [p[0]+w2, p[1]+h2]
		};
		
		return bb;
	};
	
	// check if two items overlap
	this.overlap = function(a,b)
	{
		var A = this.bbox(a);
		var B = this.bbox(b);
		
		if (A.p1[0] < B.p2[0] && A.p2[0] > B.p1[0] &&
				A.p1[1] < B.p2[1] && A.p2[1] > B.p1[1])
		return true;
		else return false;
	};
	
	// get data urls for a color
	this.getColor = function(hex)
	{
		if (typeof this.colors[hex] === "undefined")
		{
			var canvas = document.getElementById("canvas");  			
			var ctx = canvas.getContext("2d");    
			ctx.fillStyle = hex;  
			ctx.fillRect (0, 0, 1, 1);
			var col = canvas.toDataURL("image/png");
			this.colors[hex] = col;
			return col;
		}
		else return this.colors[hex];
	};

	this.hex2rgb = function(hex)
	{
		var r = HexToR(hex);
		var g = HexToG(hex);
		var b = HexToB(hex);

		return [r, g, b];

		function HexToR(h) {return parseInt((cutHex(h)).substring(0,2),16);}
		function HexToG(h) {return parseInt((cutHex(h)).substring(2,4),16);}
		function HexToB(h) {return parseInt((cutHex(h)).substring(4,6),16);}
		function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h;}
	};

	// linear mapping 
	this.interval = function(x, xmin, xmax, ymin, ymax, bound)
	{
		// make sure return value is withiin ymin and ymax
		if (typeof bound === "undefined") bound = false;
		
		// if (xmin==xmax) return (ymin+ymax)/2
		if (xmin==xmax) return ymax;
		
		var m = (ymax - ymin) / (xmax - xmin);
		var n = -xmin * m + ymin;
		var y = x * m + n;
		
		if (bound)
		{
			y = Math.min(ymax, y);
			y = Math.max(ymin, y);			
		}
		
		return y;
	};

	// shorten string if necessary
	this.trimString = function(str,len)
	{
		if (str.length>len) return str.substr(0, len)+"…";
		else return str;					
	};
	
	// remove markup, except
	this.cleanString = function(str, els)
	{
		if (typeof str === "undefined" || str==null) return 'No description.';
		var reg = [];
		var tag = [];

		for (var i=0; i < els.length; i++)
		{
			var tag1 = "<"+els[i]+">";
			var tag2 = "</"+els[i]+">";
			var tag3 = "<"+els[i]+" ";
			
			tag.push(tag1);
			tag.push(tag2);
			tag.push(tag3);			
			
			reg.push(new RegExp(tag1, 'gi'));
			reg.push(new RegExp(tag2, 'gim'));
			reg.push(new RegExp(tag3, 'gim'));
		}
		
		// replace all <tags> to {[tags]}
		var rep = [];
		for (var i=0; i < tag.length; i++)
		{
			rep[i] = tag[i].replace("<", "{[").replace(">", "]}");
			str = str.replace(reg[i], rep[i]);
		}
		
		// get rid of remaining tags
		var txt = $("<p>"+str+"</p>").text();

		txt = txt.replace(/\{\[/gim, "<");
		txt = txt.replace(/\]\}/gim, ">");

		return txt;	
	};
	
	this.dateString = function(it)
	{
		if (BOOKS) return it.year;
		else
		{
			var timestamp = it.published;
		
			var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		
			// for blogs, date: 15 Aug 2011
			var d = new Date(it.published * 1000);
			var str = d.getUTCDate() + " "+ m[d.getUTCMonth()] + " " +d.getUTCFullYear();
		
			// TODO: for books?
		
			return str;		
		}
	};

}


// time basemap (facet: 0, time window: start, end)
function TimeMap(div, view, start, end)
{
	var R = Raphael(div);
	
	this.regions = {};
	this.labels = {};
	this.width = $("#"+div).width();
	this.beyond = 0;

	// set variables..
	this.init = function()
	{
		// time lengths
		SECOND		= 1000;
		TENSEC		= 10 * SECOND;
		MINUTE		= 60 * SECOND;
		TENMIN		= 10 * MINUTE;
		HOUR			= 60 * MINUTE;
		DAY				= 24 * HOUR;
		MONTH 		= 365.25/12 * DAY;
		YEAR 			= 365.25 * DAY;
		DECADE 		= 10 * YEAR;
		CENTURY		= 10 * DECADE;
		MILLENIUM	= 10 * CENTURY;

		SPANMIN		= TENSEC;
		SPANMAX		= 10*MILLENIUM;

		$("#"+div).css({"background-color": COLOR_BG});
		
		if (typeof this.start === "undefined" || typeof this.end === "undefined" )
		{
			// time window as timestamps
			if (typeof start=="number" && typeof end=="number")
			{
				this.start = start;
				this.end = end;
			}
			// time window as dates
			else if (typeof start=="object" && typeof end=="object")
			{
				this.start = start.getTime();
				this.end = end.getTime();
			}
			// no default time window, take bounds from server
			else
			{
				var bounds = view.bounds.time;				
				this.start = bounds.left * 1000;
				this.end = bounds.right * 1000;
			}
		}
		
		this.start_old = this.start;
		this.end_old = this.end;
		
		this.draw(false);		
		
		return this;
	};
	
	this.draw = function(animate)
	{
		if (typeof animate === "undefined" ) animate = true;
		
		// get level
		this.level = this.getLevel();
		if (typeof this.level_old=="undefined") this.level_old = this.level;
		
		// level change, if false: pan or initial start
		var levelChange = false;
		if (this.level!=this.level_old) levelChange = true;
		
		// spans, margins, widths
		var step = this.getStep(this.start, this.level);
		var span = this.end - this.start;
		this.beyond = Math.round(span/2);
		this.fontSize = 6 + Math.round(this.width/175);
		this.margin = Math.round(step/span * this.width / 40 + 1) * 2;
		
		var top_margin = [this.fontSize*6.5, this.fontSize*4.5, this.fontSize*2.5, this.fontSize];
		var bot_margin = 10;		
		var w1 = this.map(this.start+this.getStep(this.start, this.level-1)); if (w1<0) w1 = 0;
		var w2 = this.map(this.start+this.getStep(this.start, this.level)); if (w2<0) w2 = 0;

		// rendering span
		var left = this.round(this.start-this.beyond, this.level);
		var left_outer = this.round(this.start-this.beyond, this.level-1); // for outer regions
		var right = this.end+this.beyond;
		
		// not before christ
		// var year_null = new Date(Date.UTC(0, 0, 0)); year_null.setUTCFullYear(0); year_null = year_null.getTime();
		// if (left < year_null) left = year_null;
		// if (left_outer < year_null) left_outer = year_null;
		
		// inner regions to add or keep
		for (var i=left; i<right; i=i+this.getStep(i))
		{
			var id = this.level+"_"+i;
			if (typeof this.regions[id] == "undefined") this.regions[id] = {l:this.level, i:i};			
			if (typeof this.labels[id] == "undefined") this.labels[id] = {l:this.level, i:i};
		}

		// outer regions to add or keep
		for (var i=left_outer; i<right; i=i+this.getStep(i, this.level-1))
		{	
			var id = (this.level-1)+"_"+i;
			if (typeof this.regions[id] == "undefined") this.regions[id] = {l:this.level-1, i:i}; 
			if (typeof this.labels[id] == "undefined") this.labels[id] = {l:this.level-1, i:i}; 
		}
		
		for (id in this.regions)
		{
			var l = this.regions[id].l; // its level
			var i = this.regions[id].i; // its time id
			
			// new positions
			var x = this.map(i)+this.margin/2;
			var w = this.map(i+this.getStep(i, l))-this.margin/2 - x; if (w<0) w = 0;
			var y = top_margin[1+this.level-l];
			var h = $("#"+div).height() - y - bot_margin;
			
			if (typeof this.labels[id].attr !== "undefined" ) this.labels[id].attr_old = Object.clone(this.labels[id].attr);
			if (typeof this.labels[id].size !== "undefined" ) this.labels[id].size_old = this.labels[id].size;

			if (typeof this.labels[id].txt == "undefined" ) this.labels[id].txts = this.getLabels(i,l);
				
			// final positions and attributes for regions and label
			this.regions[id].attr = { x: x, y: y, width: w, height: h, r: 0, fill: COLOR_R2, opacity: 1,
				'stroke-width': 0, 'stroke-opacity': 0};
			
			if (this.level==5 && this.labels[id].txts[7]) this.regions[id].attr.opacity = .5; // sunday

			this.labels[id].attr = {x: x + w/2, y: y-this.fontSize, fill: COLOR_L2, opacity: 1, "font-size": this.fontSize };
			this.labels[id].size = this.getLabelSize(w2, l, this.level-l);
			
			// adjust font size if small
			if (this.labels[id].size==0 && l==this.level)
			{
				this.labels[id].attr.txt = this.labels[id].txts[1];
				this.labels[id].attr['font-size'] = w2/1.5 ;
			}
			else this.labels[id].attr.txt = this.labels[id].txts[this.labels[id].size];

			if (l==this.level+1) this.labels[id].attr['font-size'] = 5;

			// specific attributes for outer regions/labels
			if (l<this.level)
			{
				this.regions[id].attr.fill = COLOR_R1;
				this.regions[id].attr.r = this.margin + 3;
								
				this.labels[id].attr['font-size']=this.fontSize * 1.25;
				this.labels[id].attr.fill=COLOR_L1;
				this.labels[id].size = this.getLabelSize(w1, l, this.level-l);

				// label is outside of window, but should be visible
				if (w>this.width/3 && l < this.level && x < this.width-75 && x + w > 75 )
				{
					if (x < 0 && x+w > this.width) this.labels[id].attr.x = this.width/2;
					else if ( x < 0 ) this.labels[id].attr.x = (x + w)/2 ; // left 
					else if ( x + w > this.width  ) this.labels[id].attr.x = (x + this.width)/2; // right
				}
				
				// label to removed through zoom-in
				if (l == this.level-2)
				{
					this.labels[id].attr.x = this.labels[id].attr_old.x;
				}				
				
				// decrease font size for labels when small 
				if (this.labels[id].size==0) 
				{
					this.labels[id].attr.txt = this.labels[id].txts[4].join(" ");
					this.labels[id].attr['font-size']= w2/1.1;
				}
				else this.labels[id].attr.txt = this.labels[id].txts[this.labels[id].size].join(" ");
			}

			// add new regions and labels
			if ( (l==this.level && i>=left && i <= right) || (l==this.level-1 && i>=left_outer && i <= right))
			{
				// regions
				if (typeof this.regions[id].el=="undefined")
				{
					// var y = attr.y;					
					if (levelChange)
					{
						var attr = Object.clone(this.regions[id].attr);
						if (l==this.level-1) attr.y = top_margin[3];
						else attr.y = top_margin[0];
					}
					else var attr = this.labels[id].attr;
					
					this.regions[id].el = R.rect(attr.x, attr.y, attr.width, attr.height, attr.r).attr(attr).attr({opacity: 0});
				}
				
				// labels
				if (typeof this.labels[id].el=="undefined") // new label to be added
				{				
					if (levelChange)
					{
						var attr = Object.clone(this.labels[id].attr);
						if (l==this.level-1) attr.y = top_margin[3] - this.fontSize;
						else attr.y = top_margin[0] - this.fontSize;						
					}
					else var attr = this.labels[id].attr;
					
					this.labels[id].el = R.text(attr.x, attr.y, attr.txt).attr(attr).attr({opacity: 0});
				}
				// label exists, but changed in size
				else if (this.labels[id].size != this.labels[id].size_old) 
				{
					// move old label over
					this.labels[id].el_old = this.labels[id].el;
					
					// create new label
					var attr_old = this.labels[id].attr_old;
					var attr = this.labels[id].attr;
					
					this.labels[id].el = R.text(attr_old.x, attr_old.y, attr.txt).attr(attr_old).attr({opacity: 0});
				}
			}
			// remove regions/labels
			else
			{	
				this.regions[id].remove = true;
				this.labels[id].remove = true;

				if (levelChange)
				{
					 this.regions[id].attr.opacity = 0;
					 this.labels[id].attr.opacity = 0;
				}
			}
		}

		for (id in this.regions) if (this.regions[id].l==this.level-2) this.regions[id].el.toFront();
		for (id in this.regions) if (this.regions[id].l==this.level-1) this.regions[id].el.toFront();
		for (id in this.regions) if (this.regions[id].l==this.level) this.regions[id].el.toFront();
		for (id in this.regions) if (this.regions[id].l==this.level+1) this.regions[id].el.toFront();
		for (id in this.regions) if (this.regions[id].l==this.level+2) this.regions[id].el.toFront();
		
		for (id in this.labels) if (typeof this.labels[id].el_old !== "undefined" ) this.labels[id].el_old.toFront();
		for (id in this.labels) this.labels[id].el.toFront();
		
		// animate into position
		var easing = null; //"<>";
		for (id in this.regions)
		{			
			// regions
			if (animate) this.regions[id].el.animate(this.regions[id].attr, SPEED, easing);
			else this.regions[id].el.attr(this.regions[id].attr);
			
			// labels
			if (this.labels[id].size != this.labels[id].size_old && typeof this.labels[id].el_old != 'undefined')
			{
				// old duplicate label

				var attr = Object.clone(this.labels[id].attr);
				attr.opacity = 0;
				
				if (animate)
				{
					this.labels[id].el_old.animate(attr, SPEED, easing);
					setTimeout( (function (el) { return function() { el.remove(); }; })(this.labels[id].el_old), 2*SPEED);
				}				
				else
				{
					this.labels[id].el_old.remove();
				}
				
				delete this.labels[id].el_old;
			}
			
			if (animate) this.labels[id].el.animate(this.labels[id].attr, SPEED, easing);
			else this.labels[id].el.attr(this.labels[id].attr);
			
			if (this.regions[id].remove==true)
			{
				if (animate)
					setTimeout( (function (el) { return function() { el.remove(); }; })(this.regions[id].el), 2*SPEED);
				else this.regions[id].el.remove();
				
				delete this.regions[id];
			}
			
			if (this.labels[id].remove==true)
			{
				if (animate)
					setTimeout( (function (el) { return function() { el.remove(); }; })(this.labels[id].el), 2*SPEED);
				else this.labels[id].el.remove();
				
				delete this.labels[id];
			}
		}
	};
	
	this.within = function(time)
	{
		// if (time > this.start - this.beyond && time < this.end + this.beyond) return true;
		if (time > this.start && time < this.end) return true;
		else return false;
	};
	
	// maps pixels to time
	this.map_ = function(x, old)
	{
		if (typeof old === "undefined" ) old = false;
		
		if (old)
		{
			return view.interval(pixel, 0, this.width, this.start_old, this.end_old);
		}
		else
		{
			return view.interval(pixel, 0, this.width, this.start, this.end);
		}
	};

	// maps time to pixels
	this.map = function(time, old)
	{
		if (typeof old === "undefined" ) old = false;
		
		if (old)
		{
			return view.interval(time, this.start_old, this.end_old, 0, this.width);
		}
		else
		{
			return view.interval(time, this.start, this.end, 0, this.width);
		}
		
		// return [x,y];
		// 
		// 
		// if (old) return (time-this.start_old) * this.width / (this.end_old - this.start_old);
		// else return (time-this.start) * this.width / (this.end - this.start);
	};
	
	// rounds timestamp to beginning of time type
	this.round = function(time, level)
	{
		var date = new Date(time);
		
		var Y = date.getUTCFullYear();
		var M = date.getUTCMonth(); // 0..11
		var d = date.getUTCDate();
		var h = date.getUTCHours();
		var m = date.getUTCMinutes();
		var s = date.getUTCSeconds();
		
		var t = {};
		
		if (level<4)
		{
			switch (level)
			{
				case 0: Y = Math.floor(Y/1000)*1000; break;
				case 1: Y = Math.floor(Y/100)*100; break;
				case 2: Y = Math.floor(Y/10)*10; break;
			}

			t = new Date(Date.UTC(Y, 0, 1));
		}
		else if (level==4) t = new Date(Date.UTC( Y, M, 1 ));
		else if (level==5) t = new Date(Date.UTC( Y, M, d ));
		else if (level==6) t = new Date(Date.UTC( Y, M, d, h ));
		else if (level==7) t = new Date(Date.UTC( Y, M, d, h, Math.floor(m/10)*10 ));
		else if (level==8) t = new Date(Date.UTC( Y, M, d, h, m ));
		else if (level==9) t = new Date(Date.UTC( Y, M, d, h, m, Math.floor(s/10)*10 ));
		else if (level==10) t = new Date(Date.UTC(Y, M, d, h, m, s ));
				
		t.setUTCFullYear(Y);		
		return t.getTime();
	};

	// gets the current level
	this.getLevel = function()
	{
		var diff = this.end-this.start;
		var m1 = 90; // for all levels except days and months as outer:
		var m2 = 110;
		
		var max = [m1*MILLENIUM, m1*CENTURY,m1*DECADE, m1*YEAR, m1*MONTH,
							m2*DAY, m2*HOUR, m1*TENMIN, m1*MINUTE, m1*TENSEC, m1*SECOND, SECOND];

		for (var i=0; i < max.length; i++) if (diff<max[i] && diff>max[i+1]) level = i;
		
		return level;
	};
	
	// time difference between two time regions
	this.getStep = function(time, level)
	{
		if (typeof level=="undefined") level = this.level;
					
		var steps = [MILLENIUM, CENTURY,DECADE,YEAR,MONTH,DAY,HOUR,TENMIN,MINUTE,TENSEC,SECOND];
		
		if (level>4) return steps[level];
		// not reliable, change some years
		else
		{
			var date = new Date(time);
						
			var Y = date.getUTCFullYear();
			var M = date.getUTCMonth(); // 0..11
			
			var y1, y2 = {};
			
			if (level==4) // months
			{
				if (M==0||M==2||M==4||M==6||M==7||M==9||M==11) return 31*DAY;
				else if (M==1) 
				{
					var y1 = new Date(Date.UTC(Y,1,1));
					var y2 = new Date(Date.UTC(Y,2,1));
					y1.setUTCFullYear(Y);
					y2.setUTCFullYear(Y);
				}
				else return 30*DAY;			
			}
			else if (level==3) // year
			{
				var y1 = new Date(Date.UTC(Y,0,1));
				var y2 = new Date(Date.UTC(Y+1,0,1));
				y1.setUTCFullYear(Y);
				y2.setUTCFullYear(Y+1);				
			}
			else if (level == 2) // decade
			{
				Y = Math.round(Y/10)*10;
				var y1 = new Date(Date.UTC(Y,0,1));
				var y2 = new Date(Date.UTC(Y+10,0,1));
				y1.setUTCFullYear(Y);
				y2.setUTCFullYear(Y+10);				
			}
			else if (level == 1) // century
			{
				Y = Math.round(Y/100)*100;
				var y1 = new Date(Date.UTC(Y,0,1));
				var y2 = new Date(Date.UTC(Y+100,0,1));				
				y1.setUTCFullYear(Y);
				y2.setUTCFullYear(Y+100);
			}
			else if (level == 0) // millenium
			{
				Y = Math.round(Y/1000)*1000;
				var y1 = new Date(Date.UTC(Y,0,1));
				var y2 = new Date(Date.UTC(Y+1000,0,1));
				y1.setUTCFullYear(Y);
				y2.setUTCFullYear(Y+1000);
			}

			return y2.getTime()-y1.getTime();			
		}
	};
	
	// get human-readable labels for time regions
	this.getLabels = function(time, level)
	{
		var labels = [' ']; // non-breaking space for smallest size
		
		var date = new Date(time);
		
		var Y = date.getUTCFullYear();
		var M = date.getUTCMonth(); // 0..11
		var d = date.getUTCDate();
		var w = date.getUTCDay(); // 0..6
		var h = date.getUTCHours();
		var m = date.getUTCMinutes();
		var s = date.getUTCSeconds();
		
		var y = Y-Math.floor(Y/100)*100; // y: '23, Y: 1923		
		if (y<10)
		{
			var y_ = "'0"+y;
			var y = "0"+y;
		}
		else y_ = "'"+y;
		
		var months = {
			s: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
			m: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
			l: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
			'October', 'November', 'December']
		};

		var days = {
			s:  ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
			m: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
			l: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
		};

		var hours = ['0am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am',
		'12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'];
		
		var ord = [ 'Zeroth', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh',
		'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth',
		'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth', 'Twenty-First',
		'Twenty-Second', 'Twenty-Third', 'Twenty-Fourth', 'Twenty-Fifth', 'Twenty-Sixth', 'Twenty-Seventh',
		 'Twenty-Eighth', 'Twenty-Ninth', 'Thirtieth', 'Thirty-First'
		];

		// millenium
		if (level==0)
		{
			var y = Math.floor(Y/1000)+1;
			
			labels.push( y +"" );
 			labels.push( y.ordinalize() +  " Mill." );
 			labels.push( y.ordinalize() +  " Millennium");
			
 			labels.push( [ y+".", "M" ] );
 			labels.push( [ y.ordinalize(), "Mill." ] );
			// if (y<32) labels.push( [ ord[y], "Millennium." ] );
			labels.push( [ y.ordinalize(), "Millennium"] );
		}
		// century
		if (level==1)
		{
			var y = Math.floor(Y/100)+1;
			
			labels.push( y +"" );
			labels.push( y.ordinalize() + " Cen.");
			labels.push( y.ordinalize() +" Century");

			labels.push([ y+".", "C" ]);
			labels.push([ y.ordinalize(), "Century" ]);

			// if (y<32) labels.push( [ ord[y], "Century" ] );
			labels.push( [ y.ordinalize(), "Century"] );
		}
		// decade
		else if (level==2)
		{
			var y1 = Math.floor(Y/10)*10-Math.floor(Y/100)*100+"s"; // 20
			if (y1==0) y1="00s";
			var y2 = "'"+y1; // '20s
			var y3 = Math.floor(Y/10)*10 + 's';
			var y4 = y3;
			// var y4 =  Math.floor(Y/10)*10 + " - " + (Math.floor(Y/10)*10+9);
			
			labels.push( y1 );
			labels.push( y2 );
			labels.push( y3 );

			labels.push( [y2] );
			labels.push( [y3] );
			labels.push( [y4] );
		}
		// year
		else if (level==3)
		{
			labels.push( y ); 		// '01
			labels.push( y_ );	// '01
			labels.push( Y );			// 2001
                   
			labels.push( [Y] );
			labels.push( [Y] );
			labels.push( [Y] );
		}
		// month
		else if (level==4)
		{
			labels.push( months.s[M] ); // S
			labels.push( months.m[M] );	// Sep
			labels.push( months.l[M] );	// September
                   
			labels.push( [months.m[M], y] ); // Sep '12
			labels.push( [months.m[M], Y] ); // Sep 2012
			labels.push( [months.l[M], Y] ); // September 2012
		}
		// day
		else if (level==5)
		{
			labels.push(d ); 								// 23
			labels.push(days.s[w]+" "+d );		// M 23
			labels.push(days.m[w]+", "+d );	// Mon, 23
			
			labels.push([d, months.m[M], y] ); 									// 4 Jul `10
			labels.push([days.m[w]+",", d, months.m[M], Y] );		// Wed, 4 Jul 2010
			labels.push([days.l[w]+",", d, months.l[M], Y] );				// Wednesday, 4 July 2010
			
			if (w==0) labels.push(true); else labels.push(false); // sunday or not	
		}
		// hour
		else if (level==6)
		{
			labels.push(h ); 				// 23
			labels.push(h + ":00" );	// 23:00
			labels.push(h + ":00" );	// 23:00
			
			labels.push([hours[h], d+"."+(M+1)+'.'+y] ); 										// 11am 4.7.10
			labels.push([hours[h], " - " + days.m[w], d+"."+(M+1)+'.'+Y] ); 		// 11am - Wed, 4.7.2010
			labels.push([hours[h], " - " + days.l[w], d, months.m[M], Y] );		// 11am - Wednesday, 4 Jul 2010
		}
		// tenmin and minute
		else if (level==7 || level==8)
		{
			if (level==7) m = Math.floor(m/10)*10; if (m<10) m = "00";
			
			labels.push( m ); 				// 13
			labels.push( ":"+m );			// :13
			labels.push( h + ":"+m );	// 23:13
			
			labels.push( [h + ":"+m, d + "." + (M+1)+'.'+y] ); 												// 23:13 4.7.10
			labels.push( [h + ":"+m, " - " + days.m[w] + ", ", d+"."+(M+1)+'.'+Y] ); 	// 23:13 - Wed, 4.7.2010
			labels.push( [h + ":"+m, " - " + days.l[w]+ ", ", d, months.m[M], Y] );		// 23:13 - Wednesday, 4 Jul 2010
		}
		// tensec
		else if (level==9 || level == 10)
		{
			if (level==9) s = Math.floor(s/10)*10;
			
			labels.push(s ); 							// 41
			labels.push(":"+s );						// :41
			labels.push(h + ":"+m + ":" + s );	// 23:13:41
			
			labels.push([h+":"+m+':'+s, d+"."+(M+1)+'.'+y] ); 												// 23:13:41 4.7.10
			labels.push([h+":"+m+':'+s, " - "+d+"."+(M+1)+'.'+Y] ); 	// 23:13:41 - Wed, 4.7.2010
			labels.push([h+":"+m+':'+s, " - "+days.l[w]+", ", d, months.m[M], Y] );	// 23:13:41 - Wednesday, 4 Jul 2010
		}
		return labels;
	};

	this.getLabelSize = function(width, level, inner)
	{
		var fs = this.fontSize;

		var thresholds = [fs*1.5, fs*3, fs*5, fs*1.5, fs*3, fs*7];

		if (level==1) thresholds = [fs*2, fs*4, fs*8, fs*1.5, fs*3, fs*7];
		else if (level>5) thresholds = [fs*1.5, fs*3, fs*5, fs*7.5, fs*12, fs*16];

		// else if (level>6) thresholds = [fs*1.5, fs*3, fs*5, fs*8, fs*13, fs*17];
				
		if (inner==0) // inner
		{
			if (width < thresholds[0]) return 0;
			else if (width < thresholds[1]) return 1;
			else if (width < thresholds[2]) return 2;
			else return 3;
		}
		else // outer
		{
			if (width < thresholds[3]) return 0;
			else if (width < thresholds[4]) return 4;
			else if (width < thresholds[5]) return 5;
			else return 6;			
		}
	};

	this.pan = function(diff)
	{
		var factor = 1;
		
		var w = $("#"+div).width();
		
		var span = this.end-this.start;
		
		var diff = factor* Math.round(diff/w * span);
		
		this.start_old = this.start;
		this.end_old = this.end;
		
		this.start -= diff;
		this.end -= diff;

		this.level_old = this.level;

		this.draw(false);
	};
	
	this.zoom = function(e,d)
	{
		this.start_old = this.start;
		this.end_old = this.end;
		var span_old = this.end-this.start;

		var D = Math.abs(d);

		var zoom = .5;
		var scale = 1 + zoom + D * zoom;

		// if (scale>5) scale = 5;
		
		// get focus time 'f'
		var x = e.pageX;
		var w = $("#"+div).width();
		var f = this.start + x/w * span_old;
		
		if (d>0) var span = span_old / scale; // zoom in
		else if (d<0) var span = span_old * scale; // zoom out
				
		if (span < SPANMIN ) span = SPANMIN;
		else if (span > SPANMAX ) span = SPANMAX;

		this.start = f - x/w * span;
		this.end = f + (w-x)/w * span;

		if (this.start_old != this.start || this.end_old != this.end)
		{
			this.level_old = this.level;
			this.level = this.getLevel();
			this.draw();
		}
	};
}


// geo basemap (facet: 1)
function GeoMap(div, lat, lng, ready)
{
	this.gmap = null;
	this.zoomLevel = 3;
	// this.beyondBounds = null;
	this.bounds = null;
	this.bounds_old = null;
	
	this.init = function()
	{
		this.width = $(window).width();
		this.height = $(window).height();
		
		$('#'+div).css({width: this.width, height: this.height});

		// water lightness -1 > #ddd background
		// water lightness -9 > #ddd background
		
	  var styles = [
	  		  { featureType: "all", stylers: [ { saturation: -100 }, { lightness: 50 }] },
	  		  { featureType: "water", stylers: [ {lightness: -9}, {visibility: 'simplified'}] },
	  		  { featureType: "poi", stylers: [{ visibility: 'off'}, {lightness: 66} ] },
	  		  { featureType: "administrative", stylers: [{visibility: 'off'} ] },
	  		  { featureType: "road", stylers: [{ visibility: 'off'}] },
	  		  { featureType: "transit", stylers: [{ visibility: 'off'}] },
	  		  { featureType: "landscape", stylers: [{ visibility: 'simplified'}, {lightness: -0}] }
	  ];

	  var mapOptions = {
	    zoom: this.zoomLevel,
	    center: new google.maps.LatLng(lat, lng),
			disableDefaultUI: true,
	    mapTypeId: 'main',
			backgroundColor: COLOR_BG
	  };

	  this.gmap = new google.maps.Map(document.getElementById(div), mapOptions);
	  var styledMapOptions = { name: "w" };
	  var bright = new google.maps.StyledMapType(styles, styledMapOptions);

	  this.gmap.mapTypes.set('main', bright);
	
		google.maps.event.addListener(this.gmap, 'idle',
			(function (that) { return function(bar) { that.setBounds(); ready(); that.unbindReady(); }; })(this)
		);
	
		return this;
	};
		
	this.unbindReady = function()
	{
		google.maps.event.clearListeners(this.gmap, 'idle');
	};
	
	this.setBounds = function()
	{
		if (this.bounds!=null)
		{
			var ne = this.bounds.getNorthEast();
			var sw = this.bounds.getSouthWest();
			this.bounds_old = new google.maps.LatLngBounds(sw, ne);
		}

		this.bounds = this.gmap.getBounds();		
		
		if (this.bounds_old==null) this.bounds_old = this.gmap.getBounds();
				
		// var ne = this.bounds.getNorthEast();
		// var sw = this.bounds.getSouthWest();
		// 
		// var lat_span = (ne.lat() - sw.lat()).abs();
		// var lng_span = (ne.lng() - sw.lng()).abs();
		// 
		// if (lat_span>90 || lng_span > 180)
		// {
		// 	var ne_ = new google.maps.LatLng(89.99999, 179.99999);
		// 	var sw_ = new google.maps.LatLng(-89.99999, -179.99999);
		// 	this.beyondBounds = new google.maps.LatLngBounds(sw_, ne_);	
		// }
		// else
		// {			
		// 	var divide = 2;
		// 	var ne_ll = [ne.lat()+lat_span/divide, ne.lng()+lng_span/divide]
		// 	var sw_ll = [sw.lat()-lat_span/divide, sw.lng()-lng_span/divide]
		// 
		// 	var ne_ = new google.maps.LatLng(ne_ll[0], ne_ll[1]);
		// 	var sw_ = new google.maps.LatLng(sw_ll[0], sw_ll[1]);
		// 
		// 	this.beyondBounds = new google.maps.LatLngBounds(sw_, ne_);
		// }
	};
	
	this.within = function(lat, lng)
	{
		var ll = new google.maps.LatLng(lat, lng);

		// return this.beyondBounds.contains(ll);

		return this.bounds.contains(ll);
	};
		
	// map pixel values to coordinates
	this.map_ = function(x, y)
	{
		var xr = x/this.width;
		var yr = y/this.height;
		
		var p = this.gmap.getProjection();		
		// var b = this.gmap.getBounds();
		var ne = p.fromLatLngToPoint(this.bounds.getNorthEast());
		var sw = p.fromLatLngToPoint(this.bounds.getSouthWest());
				
		if (ne.x - sw.x == 256 )
		{
			w = 255;
			var diffx = w*xr;
			var x_ = sw.x + diffx;
		}
		// normal case
		else if (sw.x < ne.x)
		{
			var w = (ne.x-sw.x).abs();
			var diffx = w*xr;
			var x_ = sw.x + diffx;
		}
		// in discontinuity
		else
		{
			var w = (ne.x-sw.x+256).abs();
			var diffx = w*xr;
			var x_ = sw.x + diffx - 256;			
		}
		
		var h = (ne.y-sw.y).abs();
		var diffy = h*yr;
		var y_ = ne.y + diffy;					
				
		var point = new google.maps.Point(x_, y_);
		
		var ll = p.fromPointToLatLng(point);
				
		return ll;
	};
	
	// map coordinates to pixels
	this.map = function(lat, lng, old)
	{
		if (typeof old === "undefined" ) old = false;
		
		var p = this.gmap.getProjection();

		if (old) var b = this.bounds_old;
		else var b = this.bounds;

		var ne = p.fromLatLngToPoint(b.getNorthEast());
		var sw = p.fromLatLngToPoint(b.getSouthWest());

		var pixel = p.fromLatLngToPoint(new google.maps.LatLng(lat,lng));
		
		var discontinuity = false;
		if (sw.x > ne.x) discontinuity = true;
		
		// in discontinuity
		if (discontinuity)
		{
			if (lng > 0) ne.x = ne.x + 256;
			else sw.x = sw.x - 256;
		}
		
		var m = this.width / ( ne.x - sw.x );
		var c = -sw.x * m;
		var x = pixel.x * m + c ;
				
		if (discontinuity && x<0)
		{
			pixel.x += 256;
			x = pixel.x * m + c ;
		}
				
		var n = this.height / ( ne.y - sw.y );
		var d = -sw.y * n;
		var y = this.height - (pixel.y * n + d);
				
		return [x, y];
	};
	
	this.pan = function(x, y)
	{	
		// this.gmap.panBy(-x,-y); // can't use because it animates

		var x_ = this.width/2 - x;
		var y_ = this.height/2 - y;
		
		var centre = this.map_(x_, y_);
		this.gmap.setCenter(centre);
		this.setBounds();
	};
	
	this.zoom = function(e, d)
	{
		var x = e.pageX;
		var y = e.pageY;
		var w = this.width;
		var h = this.height;
		
		if (d>0)
		{
			this.zoomLevel++;
			var w_ = w/2;
			var h_ = h/2;
		}
		else
		{
			if (this.width > 2000 && this.zoomLevel<6) return;
			else if (this.width > 1500 && this.zoomLevel<5) return; 
			else if (this.width > 1000 && this.zoomLevel<4) return; 
			else if (this.zoomLevel<3) return; 
			
			this.zoomLevel--;
			var w_ = w*2;
			var h_ = h*2;
		}
		
		var ax = x - w_ * x/w;
		var bx = x + w_ * (w-x)/w;

		var ay = y - h_ * y/h;
		var by = y + h_ * (h-y)/h;
		
		var cx = (ax+bx) / 2;
		var cy = (ay+by) / 2;
		
		this.gmap.setCenter(this.map_(cx, cy));		
		this.gmap.setZoom(this.zoomLevel);
		this.setBounds();
	};	

}


// tag basemap (facet: 2)
function TagMap(div, view)
{
	var R = Raphael(div);
	
	this.init = function()
	{
		this.width = $("#"+div).width();
		this.height = $("#"+div).height();
		
		this.paths = {};
		this.labels = {};
		
		this.panDiff = [0,0];
		
		this.colors = [COLOR_BG, COLOR_R1, COLOR_R2]; // short grey
		// this.colors = [COLOR_BG, '#bbb', '#ccc', '#ddd', '#eee', '#fff']; // grey
		// this.colors = ['#458AB2', '#629BBB', '#91C67A', '#BDD29C', '#E6DFC8', '#fff']; // blue, green
		// this.colors = ['#79AAC7', '#91C67A', '#C2DC9B', '#E6E5BA', '#F2EEDF']; // blue, green
				
		R.rect(0,0, this.width, this.height).attr({fill: this.colors[0], stroke: this.colors[0]});		
		this.dummy = R.rect(0,0, 0, 0).toBack();
		
		this.setBounds();		
		this.draw();		
		
		return this;
	};
	
	this.setBounds = function()
	{
		var bounds 	= view.bounds.tag;		
		
		this.left = bounds.left;
		this.right = bounds.right;
		this.top = bounds.top;
		this.bottom = bounds.bottom;
		
		this.zoomLevel = 3;

		var centre = [(this.left+this.right)/2, (this.top+this.bottom)/2];

		var spanx = this.right - this.left;
		var spany = this.bottom - this.top;
				
		if (this.width > this.height)
		{
			spanx = spany * this.width/this.height;
			this.left =  centre[0] - spanx/2 ;
			this.right =  centre[0] + spanx/2 ;
		}
		else
		{
			spany = spanx * this.height/this.width;
			this.top =  centre[1] - spany/2 ;
			this.bottom =  centre[1] + spany/2 ;
		}
		
		if (typeof this.left_old === "undefined" )
		{
			this.left_old		= this.left;
			this.right_old	= this.right ;
			this.top_old		= this.top   ;
			this.bottom_old	= this.bottom;
		}
				
	};
	
	this.draw = function(animate)
	{	
		if (typeof animate === "undefined" ) animate = false;
		
		var contours = view.contours;
		
		// draw contours
		// for (var c=0; c < contours.length; c=c+1)
		for (var c=0; c < 2; c=c+1)
		{
			var polygons = contours[c];

			// polygons
			for (var i=0; i < polygons.length; i++)
			{				
				var path_array = polygons[i];
				var pixels = [];
				
				// map mds points to pixels
				for (var j=0; j < path_array.length; j=j+2)
				{
					p = this.map(path_array[j], path_array[j+1]);
					pixels[j] = p[0];
					pixels[j+1] = p[1];
				}
				
				var l = pixels.length;				
				var path = "M "+pixels[l-2]+" "+pixels[l-1]+" C "+pixels.join(" ")+" Z";
				
				var attr = {fill: this.colors[c+1], opacity: 1, stroke: this.colors[c+1]};
				// var attr = {"fill-opacity": 0, opacity: .5, stroke: "#000"};
				
				if (typeof this.paths[c+"_"+i] === "undefined" )
				{
					this.paths[c+"_"+i] = R.path(path).attr(attr);					
				}
				else
				{
					if (animate) this.paths[c+"_"+i].animate({path: path}, SPEED);
					else this.paths[c+"_"+i].attr({path: path});
				}
				
				// R.path(path).attr({fill: '#000', 'fill-opacity': 0, opacity: .5, stroke: "#000"});
			}
		}
		
		// labels
		
		return;
		
		var tags 	= view.tags.tags;
		var stats	= view.tags.stats;
		var max = stats.max;
		var min = stats.min;
		var avg = stats.avg;
		
		var cnt = 0;
		for (t in tags)
		{
			cnt++;
			var size = this.zoomLevel  * view.interval(tags[t].count, min, max, 2, 15);
			
			var mds = tags[t].pos;
			
			if (tags[t].count>50 && this.within(mds[0], mds[1]))
			{
				var p = this.map(mds[0], mds[1]);

				if (typeof this.labels[t] === "undefined" )
				{
					if (animate)
					{
						var old = this.map(mds[0], mds[1], true);
						
						this.labels[t] = R.text(old[0], old[1], tags[t].label)
							.attr({'font-size': size, opacity: .25, fill: "#000"}).toFront();
							
						this.labels[t].animate({x: p[0], y: p[1]}, SPEED);
					}
					else this.labels[t] = R.text(p[0], p[1], tags[t].label)
						.attr({'font-size': size, opacity: .25, fill: "#000"}).toFront();				
				}
				else 
				{
					if (animate) this.labels[t].animate({x: p[0], y: p[1], 'font-size': size}, SPEED).toFront();
					else this.labels[t].attr({x: p[0], y: p[1], 'font-size': size}).toFront();
				}
			}
			else if (typeof this.labels[t] !== "undefined" )
			{
				this.labels[t].remove();
				delete this.labels[t];
			}
		}		
	};
	
	this.within = function(mx, my)
	{	
		if (mx > this.left && mx < this.right && my > this.top && my < this.bottom) return true;
	};
	
	this.map = function(mx, my, old)
	{	
		if (old)
		{
			var x = view.interval(mx, this.left_old, this.right_old, 0, this.width);
			var y = view.interval(my, this.top_old, this.bottom_old, 0, this.height);					
		}
		else
		{
			var x = view.interval(mx, this.left, this.right, 0, this.width);
			var y = view.interval(my, this.top, this.bottom, 0, this.height);					
		}
		
		return [x,y];
	};

	this.map_ = function(x, y)
	{		
		var mx = view.interval(x, 0, this.width, this.left, this.right);
		var my = view.interval(y, 0, this.height, this.top, this.bottom);		
		
		return [mx,my];
	};
	
	this.pan = function(x, y)
	{
		this.left_old = 	this.left;
		this.right_old =	this.right;
		this.top_old = 		this.top;
		this.bottom_old =	this.bottom;
		
		var lt = this.map(this.left, this.top);
		var rb = this.map(this.right, this.bottom);
		
		lt[0]-=x; lt[1]-=y; rb[0]-=x; rb[1]-=y;
		
		lt = this.map_(lt[0], lt[1]);
		rb = this.map_(rb[0], rb[1]);		
		
		this.left = lt[0];
		this.top  = lt[1];
		this.right = rb[0];
		this.bottom = rb[1];
		
		this.panDiff[0]+=x;
		this.panDiff[1]+=y;
		
		for (i in this.paths) this.paths[i].translate(x, y);
		
		// this.draw(false);
	};
	
	this.panRelease = function()
	{
		for (i in this.paths) this.paths[i].translate(-this.panDiff[0], -this.panDiff[1]);
		this.panDiff = [0,0];
		this.draw();		
	};
	
	this.zoom = function(e, d)
	{
		this.left_old = 	this.left;
		this.right_old =	this.right;
		this.top_old = 		this.top;
		this.bottom_old =	this.bottom;
		
		var x = e.pageX;
		var y = e.pageY;
		var w = this.width;
		var h = this.height;
		var spanx = this.right - this.left;
		var spany = this.bottom - this.top;
		
		var factor = 2;
		
		if (d>0)
		{
			var w_ = w/factor;
			var h_ = h/factor;
			this.zoomLevel++;
		}
		else
		{
			var w_ = w*factor;
			var h_ = h*factor;
			this.zoomLevel--;
		}
		
		var ax = x - w_ * x/w;
		var bx = x + w_ * (w-x)/w;

		var ay = y - h_ * y/h;
		var by = y + h_ * (h-y)/h;
		
		var cx = (ax+bx) / 2;
		var cy = (ay+by) / 2;

		var centre = this.map_(cx, cy);
		
		if (d>0)
		{
			var spanx = spanx/factor;
			var spany = spany/factor;
		}
		else
		{
			var spanx = spanx*factor;
			var spany = spany*factor;
		}
		
		this.left = centre[0] - spanx/2;
		this.right = centre[0] + spanx/2;
		this.top = centre[1] - spany/2;
		this.bottom = centre[1] + spany/2;
		
		this.draw(true);
		// this.draw();
	};

}


// add Vector functions to Array

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

Array.prototype.plus = function(v)
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

Array.prototype.dist = function(v)
{
	return Math.sqrt( (this[0]-v[0])*(this[0]-v[0]) + (this[1]-v[1])*(this[1]-v[1]) );
};

Array.prototype.avg = function(v)
{
	return [ (this[0]+v[0])/2, (this[1]+v[1])/2 ];
};

Array.prototype.angle = function(v)
{
	var dot = this.dot(v);
	var rad = Math.acos(this.dot(v)/(this.abs()*v.abs()));
	var deg = rad * 180 / Math.PI;
	return deg;
};

