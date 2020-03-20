
// TODO - licenca e doc básicos nestas sources

function canvElName(p_layername) {
	return "_dl" + p_layername;
}

function positioningShifted(p_positioning, p_x, p_y, p_dims, out_xylist) {
	out_xylist.length = 2;
	switch(p_positioning) {
		case 'cc':
			out_xylist[0] = p_x - Math.round(p_dims[0]/2.0);
			out_xylist[1] = p_y - Math.round(p_dims[1]/2.0);
			break;
		case 'cb':
			out_xylist[0] = p_x - Math.round(p_dims[0]/2.0);
			out_xylist[1] = p_y - p_dims[1];
			break;
		case 'ct':
			out_xylist[0] = p_x - Math.round(p_dims[0]/2.0);
			out_xylist[1] = p_y;
			break;
		case 'lc':
			out_xylist[0] = p_x;
			out_xylist[1] = p_y - Math.round(p_dims[1]/2.0);
			break;
		case 'lb':
			out_xylist[0] = p_x;
			out_xylist[1] = p_y - p_dims[1];
			break;
		case 'rc':
			out_xylist[0] = p_x - p_dims[0];
			out_xylist[1] = p_y - Math.round(p_dims[1]/2.0);
			break;
		case 'rb':
			out_xylist[0] = p_x - p_dims[0];
			out_xylist[1] = p_y - p_dims[1];
			break;
		case 'rt':
			out_xylist[0] = p_x - p_dims[0];
			out_xylist[1] = p_y;
			break;
		default: // lt
			out_xylist[0] = p_x;
			out_xylist[1] = p_y;
	}
}

function setImageFrame(p_scrscalingfactor, p_width, p_height, b_sizefromimage, opt_forcemindim, out_dims) {
	var dimdefined, ctxw, ctxh, h, w;
	out_dims.length = 2;
	
	if (p_width < 1 || p_height < 1) {
		throw new Error("setImageFrame: zero image width or height");
	}
		
	// If width and height are not actually loaded image dims,
	//  they might need scaling
	if (!b_sizefromimage) {
		ctxw = p_width * p_scrscalingfactor;
		ctxh = p_height * p_scrscalingfactor;
	} else {
		ctxw = p_width;
		ctxh = p_height;
	}

	dimdefined=false;
	if (opt_forcemindim) {
		if (ctxw > ctxh) {
			if (ctxh >  opt_forcemindim) {
				h = opt_forcemindim;
				w = h * (ctxw /ctxh);
				dimdefined = true;
			}
		} else {
			if (ctxw >  opt_forcemindim) {
				w = opt_forcemindim;
				h = w * (ctxw /ctxh);
				dimdefined = true;
			}
		}
	}
	if (!dimdefined) {
		h = ctxh;
		w = ctxw;
	}
	out_dims[0] = w;
	out_dims[1] = h;
}

function canvasAddSingleImage(p_canvas, p_fname, p_x, p_y, b_is_inscreenspace,  
			opt_positioning, opt_width, opt_height, opt_forcemindim, 
			opt_imgfilter_func, opt_imgfilteradicdata, opt_displaylayer) {
	
	let base_image = new Image();
	base_image.src = p_fname;
	
	p_canvas.drawImage(base_image, p_x, p_y, 
			b_is_inscreenspace, opt_positioning, opt_width, opt_height, 
			opt_forcemindim, opt_imgfilter_func, opt_imgfilteradicdata, opt_displaylayer);

	return base_image;
}

function ctxGenericApplyStyle(p_canvasctx, p_styleobj, p_patterns, out_styleflags) {
	
	let foundattrs = [];
	for (let k_attr in p_styleobj) {
		if (!p_styleobj.hasOwnProperty(k_attr)) {
			continue;
		}
		if (foundattrs.indexOf(k_attr) < 0) {
			foundattrs.push(k_attr);
		}
		switch (k_attr) {
			case "strokecolor":
				p_canvasctx.strokeStyle = p_styleobj[k_attr];
				out_styleflags.stroke = true;
				break;
			case "fill":
				if (p_patterns[p_styleobj[k_attr]] !== undefined) {
					if (typeof p_patterns[p_styleobj[k_attr]] == 'string' && (p_patterns[p_styleobj[k_attr]].indexOf('#') == 0)) {
						p_canvasctx.fillStyle = p_patterns[p_styleobj[k_attr]];
					} else {
						p_canvasctx.fillStyle = p_canvasctx.createPattern(p_patterns[p_styleobj[k_attr]], "repeat");
					}
				} else {
					p_canvasctx.fillStyle = p_styleobj[k_attr];
				}
				out_styleflags.fill = true;
				break;
			case "linewidth":
				p_canvasctx.lineWidth = p_styleobj[k_attr];
				break;
			case "linedash":
				p_canvasctx.setLineDash(p_styleobj[k_attr]);
				break;
			case "linejoin":
				p_canvasctx.lineJoin = p_styleobj[k_attr];
				break;
			case "linecap":
				p_canvasctx.lineCap = p_styleobj[k_attr];
				break;
			case "font":
				p_canvasctx.font = p_styleobj[k_attr];
				break;
			case "align":
				p_canvasctx.textAlign = p_styleobj[k_attr].toLowerCase();
				break;
			case "baseline":
				p_canvasctx.textBaseline = p_styleobj[k_attr].toLowerCase();
				break;
			case "shadowcolor":
				p_canvasctx.shadowColor = p_styleobj[k_attr].toLowerCase();
				break;
			case "shadowoffsetx":
				p_canvasctx.shadowOffsetX = p_styleobj[k_attr];
				break;
			case "shadowoffsety":
				p_canvasctx.shadowOffsetY = p_styleobj[k_attr];
				break;
			case "shadowblur":
				p_canvasctx.shadowBlur = p_styleobj[k_attr];
				break;
		}
	}
	
	// valores default
	if (foundattrs.indexOf("linewidth") < 0) {
		p_canvasctx.lineWidth = 1;
	}
	if (foundattrs.indexOf("linedash") < 0) {
		p_canvasctx.setLineDash([]);
	}
	if (foundattrs.indexOf("linejoin") < 0) {
		p_canvasctx.lineJoin = "round";
	}
	if (foundattrs.indexOf("linecap") < 0) {
		p_canvasctx.lineCap = "butt";
	}
	if (foundattrs.indexOf("font") < 0) {
		p_canvasctx.font = "10px sans-serif";
	}
	if (foundattrs.indexOf("align") < 0) {
		p_canvasctx.textAlign = "center";
	}
	if (foundattrs.indexOf("baseline") < 0) {
		p_canvasctx.textBaseline = "alphabetic";
	}

	if (foundattrs.indexOf("shadowcolor") < 0) {
		p_canvasctx.shadowColor = "rgba(0,0,0,0)";
	}
	if (foundattrs.indexOf("shadowoffsetx") < 0) {
		p_canvasctx.shadowOffsetX = 0;
	}
	if (foundattrs.indexOf("shadowoffsety") < 0) {
		p_canvasctx.shadowOffsetY = 0;
	}
	if (foundattrs.indexOf("shadowblur") < 0) {
		p_canvasctx.setShadowBlur = 0;
	}
}


function ImageMarkerManager(p_canvasctrllr) {
	this.canvasctrllr = p_canvasctrllr;
	this.images = {};
	this.marker_instances = {};	
	this.clearInstances = function() {
		this.marker_instances = {};
	};
	this.redrawMarkers = function(p_fname, opt_limitkey) {
		var inst, insts;
		if (this.images[p_fname].complete) {
			if (opt_limitkey) {
				inst = this.marker_instances[p_fname][opt_limitkey];					
				this.canvasctrllr.drawImage(this.images[inst.fname], inst.anchor[0], inst.anchor[1], 
					inst.inscrspc, inst.pos, inst.optdims[0], inst.optdims[1], 
					inst.optforcemindim, null, null, 
					inst.optdisplaylayer);	
			} else {
				insts = this.marker_instances[p_fname];
				for (var key in insts) {		
					if (insts.hasOwnProperty(key)) {			
						inst = insts[key];					
						this.canvasctrllr.drawImage(this.images[inst.fname], inst.anchor[0], inst.anchor[1], 
							inst.inscrspc, inst.pos, inst.optdims[0], inst.optdims[1], 
							inst.optforcemindim, null, null, 
							inst.optdisplaylayer);	
					}
				}
			}	
		}	
	};
	this.setMarker = function(p_path, p_layername, p_oid, p_x, p_y, b_is_inscreenspace,  
			opt_positioning, opt_width, opt_height, opt_forcemindim, 
			opt_displaylayer) {
		
		let pos, fname, reres, key, bfnamepatt = new RegExp("([^/\.]+)\.[^\.]+$");
		
		reres = bfnamepatt.exec(p_path);
		if (reres!=null && reres.length >= 2) {
			fname = reres[1];
		} else {
			throw new Error("addMarker: unable to get filename (wo ext.) from "+p_path);
		}
		
		if (typeof p_oid == 'undefined' || p_oid == null) {
			throw new Error("addMarker: invalid objectid "+p_oid);
		}
		
		if (opt_positioning) {
			pos = opt_positioning;
		} else {
			pos = 'lt';
		}
		
		key = p_layername + "_" + p_oid;
		
		if (this.marker_instances[fname] === undefined) {
			this.marker_instances[fname] = {};
		}
		
		this.marker_instances[fname][key] = {
			'fname': fname, 
			'anchor': [p_x, p_y], 
			'pos': pos,
			'inscrspc': b_is_inscreenspace,
			'optdims': [opt_width, opt_height],
			'optforcemindim': opt_forcemindim,
			'optdisplaylayer': opt_displaylayer
		};
		
		if (this.images[fname] === undefined) {
			this.images[fname] = new Image(); 
			this.images[fname].src = p_path;
			(function(p_mrkmgr, p_fname, p_imageobj) {
				p_imageobj.onload = function() {
					p_mrkmgr.redrawMarkers(p_fname);
				}
			})(this, fname, this.images[fname]);
		} else {
			this.redrawMarkers(fname, key);
		}
	};

}

/** 
  * Object to control HTML Canvas rendering, usually automatically created at MapController instantiation
  * @param {string} p_elemid - The ID of HTML container object to recieve the canvases objects.
  * @param {Object} p_mapcontroller - The RISCO MapController object 
  * @param {number} opt_basezindex - (optional) base value for zIndex: zIndex of first canvas (raster), zIndex of secessive canvas is incremented to ensure superposition
  * @constructor 
*/
function CanvasController(p_elemid, p_mapcontroller, opt_basezindex) {
	
	this.getClassStr = function() {
		return "CanvasController";
	};
	// TODO Mensagens em Ingles
	this.i18nmsgs = {
		"pt": {
			"NONEW": "'CanvasController' é classe, o seu construtor foi invocado sem 'new'",
			"NOID": "construtor de 'CanvasController' invocado sem ID do elemento canvas respectivo",
			"NOCANVAS": "Este browser não suporta Canvas",
			"NOSTYOBJ": "objecto de style inválido",
			"NOTHDRAW": "uma das layers nao tem estilo definido: nada a desenhar",
			"MISSLYRNAME": "nome de layer 'canvas' não encontrado:",
			"MISSVRTMRKFUNC": "função de marcação de véritces não definida",
			"MISMIDPMRKFUNC": "função de marcação de pontos médios não definida"
		}
	};
	this.msg = function(p_msgkey) {
		let langstr = navigator.language || navigator.userLanguage;
		let lang = langstr.substring(0,2);		
		if (this.i18nmsgs[lang] === undefined) {
			for (let k in this.i18nmsgs) {
				if (this.i18nmsgs.hasOwnProperty(k)) {
					lang = k;
					break;
				}
			}
		}
		return this.i18nmsgs[lang][p_msgkey]
	};
	
	if ( !(this instanceof arguments.callee) )
		throw new Error(this.msg("NONEW"));

	if (p_elemid === null) 
		throw new Error(this.msg("NOID"));
		
	this._ctxdict = {
		"raster": null,
		"base": null,
		"temporary": null,
		"transient": null
	};
	this._ctxorder = [
	                  "raster",
	                  "base",
	                  "temporary",
	                  "transient"
	                  ];
	this._internalstyles = {};
	this.defaultDisplayLayer = this._ctxorder[0];
	this.activeDisplayLayer = this.defaultDisplayLayer;
	this._canvasAncestorElId = p_elemid;
	this.preppedDisplay = false;
	this.canvasDims = [0,0];
	this.markVertices = false;
	this.markVertexFunc = null;
	this.markMidpoints = false;
	this.markMidpointFunc = null;
	this.maxzindex = -1;
	this.imgmarkermgr = new ImageMarkerManager(this);
	
	// TODO: agarrar eventos do canvas ao refresh do mapcontroller
	this._mapcontroller = p_mapcontroller;

	var canvasDiv = document.getElementById(this._canvasAncestorElId);
	this.canvasDims[0] = canvasDiv.clientWidth;
	this.canvasDims[1] = canvasDiv.clientHeight;
	canvasDiv.style.position = 'relative'; 
	
	/*
	console.log(this.canvasDims);
	console.log(canvasDiv.getBoundingClientRect());
	*/	
	
	var li, bzi, ctx, canvasel, displayer, cnvname;
	
	if (opt_basezindex) {
		bzi = parseInteger(opt_basezindex);
	} else {
		bzi = 1;
	}

	canvasDiv.addEventListener("resize", function(e) { console.log("resize DIV"); });
	
	for (li=0; li<this._ctxorder.length; li++) 
	{
		displayer = this._ctxorder[li];
		cnvname = canvElName(displayer);
		
		canvasel = document.createElement('canvas');
		canvasel.setAttribute('style', 'position:absolute;top:0;left:0;z-index:'+(li+bzi));
		canvasel.setAttribute('id', cnvname);
		canvasel.setAttribute('width', this.canvasDims[0]);
		canvasel.setAttribute('height', this.canvasDims[1]);
		
		canvasel.addEventListener("resize", function(e) { console.log("resize canvas "+cnvname); });

		this.maxzindex = li+bzi;
		
		canvasDiv.appendChild(canvasel);
		
		this._ctxdict[displayer] = canvasel.getContext("2d");
	    if (!this._ctxdict[displayer]) {
	    	throw new Error(this.msg("NOCANVAS")+": "+displayer);
	    }
	    
	    // Transient layer style
	    /*
	    if (displayer == "transient") {
	    	this._ctxdict[displayer].strokeStyle = '#f00'; 
	    	this._ctxdict[displayer].fillStyle = 'rgba(0, 229, 130, 0.5)'; 
	    }*/
	}
	this.topcanvasel = canvasel;

	this.getTopCanvasElement = function() {
	    return this.topcanvasel;		
	};
	this.getDefaultDisplayLayer = function() {
	    return this.defaultDisplayLayer;		
	};
	this.setActiveDisplayLayer = function(p_displayer) {
		if (this._ctxdict[p_displayer] === undefined) {
			throw new Error(this.msg("MISSLYRNAME")+" "+p_displayer);
		}
	    this.activeDisplayLayer = p_displayer;		
	};

	this.getImageData = function(p_x, p_y, p_ctxw, p_ctxh, p_displayer) {
		return this._ctxdict[layer].getImageData(p_x, p_y, p_ctxw, p_ctxh);
	};
	
	this.getCtx = function(p_displayer) {		
		var layer;
		if (!p_displayer) {
			layer = "base";
		} else {
			layer = p_displayer;			
		}
	    return this._ctxdict[layer];		
	};

	this.saveCtx = function(p_displayer) {		
		var layer;
		if (!p_displayer) {
			layer = "base";
		} else {
			layer = p_displayer;			
		}
	    this._ctxdict[layer].save();		
	};

	this.restoreCtx = function(p_displayer) {		
		var layer;
		if (!p_displayer) {
			layer = "base";
		} else {
			layer = p_displayer;			
		}
	    this._ctxdict[layer].restore();		
	};
	
	this.prepDisplay = function(opt_force)
	{
	    var li, displayer, failed = false;
		if (opt_force!=null || !this.preppedDisplay) {
			for (li=0; li<this._ctxorder.length; li++) 
	    	{
	    		displayer = this._ctxorder[li];
	    		canvasel = document.getElementById(canvElName(displayer));
	    		if (!this.resizeCanvasToDisplaySize(canvasel)) {
			    	failed = true;
			    	break;
			    }
	    	}
	    }
		
		if (!failed) {
			this.preppedDisplay = true;
		}
	};
	this.clearImageMarkers = function() {
		if (this.imgmarkermgr) {
			this.imgmarkermgr.clearInstances();
		}
	};
	this.clearDisplay = function(opt_background)
	{
		var displayer;
		
		this.clearImageMarkers();
		for (var li=0; li<this._ctxorder.length; li++) 
    	{
    		displayer = this._ctxorder[li];
    		if (li==0) {
				this.clearDisplayLayer(displayer, opt_background);
			} else {
				this.clearDisplayLayer(displayer);
			}
    	}
	};

	this.clearDisplayLayer = function(p_layername, opt_background)
	{
		this._ctxdict[p_layername].clearRect(0, 0, this.canvasDims[0], this.canvasDims[1]);
		
		/*console.log("     clearing "+p_layername);
		console.trace();*/
		
		if (opt_background) {
			this._ctxdict[p_layername].save();
			this._ctxdict[p_layername].fillStyle = opt_background;
			this._ctxdict[p_layername].fillRect(0, 0, this.canvasDims[0], this.canvasDims[1]);
			this._ctxdict[p_layername].restore();
		}
	};
	
	this.getCanvasDims = function() {
	    return this.canvasDims;
	};	
	
	// TODO: USAR opt_displaylayer
	this.getStrokeStyle = function(opt_displaylayer) 
	{
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		if (this._ctxdict[dlayer] === undefined) {
			console.trace("missing dlayer '"+dlayer+"' opt display:'"+opt_displaylayer+"'");
			throw new Error('getStrokeStyle: missing layer');
		}
		return this._ctxdict[dlayer].strokeStyle;
	};
	this.getFillStyle = function(opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		return this._ctxdict[dlayer].fillStyle;
	};	
	this.getLineWidth = function(opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		return this._ctxdict[dlayer].lineWidth;
	};	
	this.getLineDash = function(opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		return this._ctxdict[dlayer].getLineDash;
	};		
	this.getFont = function(opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		return this._ctxdict[dlayer].font;
	};	
	this.getTextAlign = function(opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		return this._ctxdict[dlayer].textAlign;
	};
	this.getBaseline = function(opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		return this._ctxdict[dlayer].textBaseline;
	};
	this.setStrokeStyle = function(p_style, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		this._ctxdict[dlayer].strokeStyle = p_style;
	};
	this.setFillStyle = function(p_style, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		//console.log("dlayer:"+dlayer+" style:"+p_style);
		this._ctxdict[dlayer].fillStyle = p_style;
	};
	this.setLineWidth = function(p_val, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		this._ctxdict[dlayer].lineWidth = p_val;
	};
	this.setLineDash = function(p_arrval, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		this._ctxdict[dlayer].setLineDash(p_arrval);
	};
	this.setLineJoin = function(p_val, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		this._ctxdict[dlayer].lineJoin = p_val;
	};
	this.setLineCap = function(p_val, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		this._ctxdict[dlayer].lineCap = p_val;
	};
	this.setFont = function(p_style, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		if (navigator.appVersion.indexOf("MSIE")!=-1) {
			this._ctxdict[dlayer].font = parseInt(p_style) + "px Helvetica";
		} else {
			this._ctxdict[dlayer].font = p_style;
		}
		
	};	
	this.setTextAlign = function(p_style, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		this._ctxdict[dlayer].textAlign = p_style;
	};
	this.setBaseline = function(p_style, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		this._ctxdict[dlayer].textBaseline = p_style;
	};
	this.getFontSize = function(opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		return parseInt(this._ctxdict[dlayer].font.replace(/([\d]+)[^\d]+/, "$1"));
	};
	this.setFontSize = function(p_sz, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}		
		this._ctxdict[dlayer].font = this._ctxdict[dlayer].font.replace(/[\d]+([^\d]+)/, String.format("{0}$1",p_sz));
		return(this._ctxdict[dlayer].font);
	}

	this.setShadowColor = function(p_style, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		this._ctxdict[dlayer].shadowColor = p_style;
	};
	this.getShadowColor = function(opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		return this._ctxdict[dlayer].shadowColor;
	};
	this.setShadowOffsetX = function(p_style, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		this._ctxdict[dlayer].shadowOffsetX = p_style;
	};
	this.getShadowOffsetX = function(opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		return parseInt(this._ctxdict[dlayer].shadowOffsetX);
	};

	this.setShadowOffsetY = function(p_style, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		this._ctxdict[dlayer].shadowOffsetY = p_style;
	};
	this.getShadowOffsetY = function(opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		return parseInt(this._ctxdict[dlayer].shadowOffsetY);
	};

	this.setShadowBlur = function(p_style, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		this._ctxdict[dlayer].shadowBlur = p_style;
	};
	this.getShadowBlur = function(opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		return parseInt(this._ctxdict[dlayer].shadowBlur);
	};
	this.setGlobalCompositeOperation = function(p_op, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		this._ctxdict[dlayer].globalCompositeOperation = p_op;
	};

	this.setLabelBackground = function(p_style) {
		this._internalstyles.label_background = p_style;
	};
	this.getLabelBackground = function() {
		return this._internalstyles.label_background;
	};

	this.measureTextWidth = function(p_txt, opt_displaylayer) {
		var dlayer;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		return this._ctxdict[dlayer].measureText(p_txt).width;	
	};


//	this.plainText = function (p_txt, p_pt, opt_displaylayer, opt_p_chheight, 
//					opt_p_chhwid, opt_p_isfirst, opt_p_islast) 
	this.plainText = function (p_txt, p_pt, opt_displaylayer, opt_p_bgwid, opt_p_bgheight) 
	{
		var dlayer, ctx;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		ctx = this._ctxdict[dlayer];

		if (this.getLabelBackground() !== undefined) 
		{
			ctx.save();
			ctx.fillStyle = this.getLabelBackground();
			
			if (opt_p_bgwid!=null && opt_p_bgheight!=null) {
				ctx.fillRect(p_pt[0]-2, p_pt[1]-opt_p_bgheight+2, opt_p_bgwid+2, opt_p_bgheight+1);
			}
			
			ctx.restore();
		}

		ctx.fillText(p_txt.toString(), p_pt[0], p_pt[1]);
	};	
	
	this.rotatedText = function (p_txt, p_pt, p_angle, p_fillstroke, opt_displaylayer, 
							opt_p_chheight, opt_p_chhwid, opt_p_isfirst, opt_p_islast) 
	{
		var dlayer, ctx;
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}

		ctx = this._ctxdict[dlayer];

		ctx.save();
		ctx.translate(p_pt[0], p_pt[1]);
		ctx.rotate(p_angle);

		if (this.getLabelBackground() !== undefined) 
		{
			ctx.save();
			ctx.fillStyle = this.getLabelBackground();
			if (opt_p_isfirst) {
				ctx.fillRect(-opt_p_chhwid-4, -(opt_p_chheight/2.0), 4 + opt_p_chhwid*2, opt_p_chheight);
			} else if (opt_p_islast) {
				ctx.fillRect(-opt_p_chhwid, -(opt_p_chheight/2.0), 4 + opt_p_chhwid*2, opt_p_chheight);
			} else {
				ctx.fillRect(-opt_p_chhwid, -(opt_p_chheight/2.0), opt_p_chhwid*2, opt_p_chheight);
			}
			ctx.restore();
		}

		if (p_fillstroke.fill) {
			ctx.fillText(p_txt, 0, 0);
		}
		if (p_fillstroke.stroke) {
			ctx.strokeText(p_txt, 0,0);
		}
		if (!p_fillstroke.fill && !p_fillstroke.stroke) {
			throw new Error("rotatedText: no fill, no stroke");
		}
		ctx.restore();
	};	
	
	this.applyStyle = function(p_styleobj, p_patterns, out_styleflags, opt_displaylayer)
	{
		out_styleflags.stroke = false;
		out_styleflags.fill = false;
		var foundattrs = [];

		if (typeof p_styleobj == 'undefined') {
			throw new Error("applyStyle "+this.msg("NOSTYOBJ"));
		}
		
		let ctx = this.getCtx(opt_displaylayer);
		if (ctx == null) {
			throw new Error("applyStyle: no active graphic controller ccontext");
		}

		// apply generic canvas symbology attributes
		ctxGenericApplyStyle(ctx, p_styleobj, p_patterns, out_styleflags);
		
		for (var attr in p_styleobj)
		{
			if (!p_styleobj.hasOwnProperty(attr)) {
				continue;
			}
			if (foundattrs.indexOf(attr) < 0) {
				foundattrs.push(attr);
			}
			switch (attr) {

				case "bgstyle":
					this.setLabelBackground(p_styleobj[attr], opt_displaylayer);
					break;
				/*
				case "marker":
					this.setMarker(p_styleobj[attr], opt_displaylayer);
					break;
				case "markersize":
					this.setMarkerSize(p_styleobj[attr], opt_displaylayer);
					break;*/
			}
		}
		if (out_styleflags.stroke === undefined ||  out_styleflags.fill === undefined || (!out_styleflags.stroke && !out_styleflags.fill)) {
			throw new Error("applyStyle "+this.msg("NOTHDRAW"));
		}
	};
		
	// TODO: FAZER DOC
	// Function drawSimplePath -- draw simple path in canvas
	// Input parameters:
	// 	 p_points: consecutive coordinate values, unpaired, in map units or screen space;in this latter case,
	//	 	is_inscreenspace should be 'true'
	//   p_stroke: boolean flag - do stroke
	//   p_fill: boolean flag - do fill 
	// 	 is_inscreenspace: object defined in screen space coordinates
	//	 opt_displaylayer: optional -- null or service layer identifiers, usually 'transient' or 'temporary'
	// 	 dolog: boolean flag -- log messages to console

	this.drawSimplePath = function(p_points, p_stroke, p_fill,  
					p_markerfunc, is_inscreenspace,  
					b_dolog, opt_oid, opt_featattrs, opt_displaylayer) 
	{
		let dlayer, retgtype = "NONE";
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		
		if (p_points.length < 1) {
			return;
		}
		if (p_points.length % 2 != 0) {
			throw new Error("Internal error: odd coordinate number in drawSimplePath:"+p_points.length);
		}
		
		if (p_points.length < 3) {
			retgtype = "POINT";
		} else {
			if (p_points[p_points.length-1] == p_points[0] && p_points[p_points.length-2] == p_points[1]) {
				retgtype = "POLY";
			} else {
				retgtype = "LINE";
			}
		}

		var prevmidpt=[0,0], midpt=[0,0], prevpt=[0,0], pt=[];
		if (retgtype == "POINT" && p_markerfunc != null && p_markerfunc.length > 0) {

			if (is_inscreenspace) {
				//this._mapcontroller.scrDiffFromLastSrvResponse.getPt(p_points[0], p_points[1], pt);
				this._mapcontroller.getScrDiffPt(p_points[0], p_points[1], pt);
			} else {
				this._mapcontroller.getScreenPtFromTerrain(p_points[0], p_points[1], pt);
			}
			window[p_markerfunc](this, pt, this._mapcontroller, opt_oid, opt_featattrs, dlayer);
			
		} else {
		
			this._ctxdict[dlayer].beginPath();

			for (var cpi=0; cpi<p_points.length; cpi+=2) 
			{
				pt.length = 2;
				
				if (is_inscreenspace) {
					//this._mapcontroller.scrDiffFromLastSrvResponse.getPt(p_points[cpi], p_points[cpi+1], pt);
					this._mapcontroller.getScrDiffPt(p_points[cpi], p_points[cpi+1], pt);
				} else {
					this._mapcontroller.getScreenPtFromTerrain(p_points[cpi], p_points[cpi+1], pt);
				}

				if (this.markVertices) {
					this.markVertexFunc(pt[0], pt[1]);
				}
				if (this.markMidpoints) {
					if (cpi > 0)
					 {
						midpt=[ 
								prevpt[0] + ((pt[0]-prevpt[0])/2.0), 
								prevpt[1] + ((pt[1]-prevpt[1])/2.0)
								], 
						this.markMidpointFunc( midpt[0], midpt[1] );
						if (cpi > 1) {
							this._ctxdict['transient'].moveTo(prevmidpt[0], prevmidpt[1]);
							this._ctxdict['transient'].quadraticCurveTo(prevpt[0], prevpt[1], midpt[0], midpt[1]);
							this._ctxdict['transient'].stroke();
						}
						prevmidpt[0] = midpt[0];
						prevmidpt[1] = midpt[1];
					}
					prevpt[0] = pt[0];
					prevpt[1] = pt[1];
				}
				
				if (cpi==0) {
					this._ctxdict[dlayer].moveTo(pt[0], pt[1]);
				} else {
					this._ctxdict[dlayer].lineTo(pt[0], pt[1]);
				}
				
				if (b_dolog) {
					console.log("draw simple path on '"+dlayer+"', input:"+p_points[cpi]+","+p_points[cpi+1]+', screen:'+JSON.stringify(pt));
				}
			}
			if (p_stroke) {
				this._ctxdict[dlayer].stroke();
				if (b_dolog) {
					console.log(dlayer+" stroking");
				}
			} 
			if (p_fill) {
				this._ctxdict[dlayer].fill();
				if (b_dolog) {
					console.log(dlayer+" filling");
				}
			}
		}
		
		return retgtype;
	};


	// Function drawMultiplePath -- draw multiple path in canvas
	// Input parameters:
	// 	 p_parts_of_points: lists of consecutive coordinate values, unpaired
	//   p_stroke: boolean flag - do stroke
	//   p_fill: boolean flag - do fill 
	// 	 is_inscreenspace: object defined in screen space coordinates
	//	 opt_displaylayer: optional -- null or service layer identifiers, usually 'transient' or 'temporary'
	// 	 dolog: boolean flag -- log messages to console

	this.drawMultiplePath = function(p_parts_of_points, p_stroke, p_fill, 
			is_inscreenspace, opt_displaylayer, dolog) 
	{
		if (dolog) {
			console.log('---- p_parts_of_points -----');
			console.log(JSON.stringify(p_parts_of_points));
			console.log('--------------------------------');
		}

		if (p_parts_of_points.length < 1) {
			return;
		}

		var dlayer, retgtype = "NONE";
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}

		this._ctxdict[dlayer].beginPath();
		var pt=[], points;
		
		for (var pidx=0; pidx<p_parts_of_points.length; pidx++)
		{
			points = p_parts_of_points[pidx];
			
			//console.log(points);

			if (pidx == 0) {
				if (points.length < 3) {
					retgtype = "POINT";
				} else {
					if (points[points.length-2] == points[0] && points[points.length-1] == points[1]) {
						retgtype = "POLY";
					} else {
						retgtype = "LINE";
					}
				}
			}
			
			for (var cpi=0; cpi<points.length; cpi+=2) 
			{
				pt.length = 2;

				if (is_inscreenspace) {
					//this._mapcontroller.scrDiffFromLastSrvResponse.getPt(points[cpi], points[cpi+1], pt, (x_oid == 6536));
					this._mapcontroller.getScrDiffPt(points[cpi], points[cpi+1], pt);
				} else {
					this._mapcontroller.getScreenPtFromTerrain(points[cpi], points[cpi+1], pt);
				}

				if (cpi==0) {
					this._ctxdict[dlayer].moveTo(pt[0], pt[1]);
				} else {
					this._ctxdict[dlayer].lineTo(pt[0], pt[1]);
				}
				if (dolog) {
					console.log("draw multiple path, input:"+points[cpi]+','+points[cpi+1]+', screen:'+pt);
				}
			}
		}
		if (p_stroke) {
			this._ctxdict[dlayer].stroke();
			if (dolog) {
				console.log("stroking");
			}
		} 
		if (p_fill) {
			this._ctxdict[dlayer].fill('evenodd');
			if (dolog) {
				console.log("filling");
			}
		}
		
		return retgtype;
	};
	
	// Function drawMultiplePathCollection -- draw collection of multiple paths in canvas
	// Input parameters:
	// 	 p_parts_of_points: lists of consecutive coordinate values, unpaired
	//   p_stroke: boolean flag - do stroke
	//   p_fill: boolean flag - do fill 
	// 	 is_inscreenspace: object defined in screen space coordinates
	//	 opt_displaylayer: optional -- null or service layer identifiers, usually 'transient' or 'temporary'
	// 	 dolog: boolean flag -- log messages to console
											
	this.drawMultiplePathCollection = function(p_part_collection, p_stroke, p_fill, 
			is_inscreenspace, opt_displaylayer, dolog) 
	{
		
		if (p_part_collection.length < 1) {
			return;
		}

		var dlayer, retgtype = "NONE";
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		this._ctxdict[dlayer].beginPath();
		var pt=[], parts_of_points, points;

		for (var pcidx=0; pcidx<p_part_collection.length; pcidx++)
		{
			parts_of_points = p_part_collection[pcidx];
			for (var pidx=0; pidx<parts_of_points.length; pidx++)
			{
				points = parts_of_points[pidx];
				if (pcidx == 0 && pidx == 0) {
					if (points.length < 3) {
						retgtype = "POINT";
					} else {
						if (points[points.length-1] == points[0] && points[points.length-2] == points[1]) {
							retgtype = "POLY";
						} else {
							retgtype = "LINE";
						}
					}
				}

				for (var cpi=0; cpi<points.length; cpi+=2) 
				{
					pt.length = 2;

					if (is_inscreenspace) {
						// this._mapcontroller.scrDiffFromLastSrvResponse.getPt(points[cpi], points[cpi+1], pt);
						this._mapcontroller.getScrDiffPt(points[cpi], points[cpi+1], pt);
					} else {
						this._mapcontroller.getScreenPtFromTerrain(points[cpi], points[cpi+1], pt);
					}
					
					if (cpi==0) {
						this._ctxdict[dlayer].moveTo(pt[0], pt[1]);
					} else {
						this._ctxdict[dlayer].lineTo(pt[0], pt[1]);
					}
					if (dolog) {
						console.log("draw multiple path coll, input:"+points[cpi]+','+points[cpi+1]+', screen:'+pt);
					}
				}
			}
		}
		if (p_stroke) {
			this._ctxdict[dlayer].stroke();
			if (dolog) {
				console.log("stroking");
			}
		} 
		if (p_fill) {
			this._ctxdict[dlayer].fill('evenodd');
			if (dolog) {
				console.log("filling");
			}
		}
		
		return retgtype;
	};
	
	this.drawCenteredRect = function(p_cx, p_cy, p_width, p_height, 
			p_stroke, p_fill, 
			is_inscreenspace, 
			opt_displaylayer) {
				
		var dlayer, pt=[];
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}

		pt.length = 2;

		if (is_inscreenspace) {
			pt[0] = p_cx;
			pt[1] = p_cy; 
		} else {
			this._mapcontroller.getScreenPtFromTerrain(p_cx, p_cy, pt);
		}
		
		if (p_stroke) {
			this._ctxdict[dlayer].strokeRect(pt[0]-(p_width/2.0), pt[1]-(p_height/2.0), p_width, p_height);
		}
		if (p_fill) {
			this._ctxdict[dlayer].fillRect(pt[0]-(p_width/2.0), pt[1]-(p_height/2.0), p_width, p_height);
		}
	}
	
	this.drawCrossHairs = function(p_x, p_y, 
			p_radius, is_inscreenspace, opt_rotatedegs,
			opt_inner_radius, opt_displaylayer) 
	{
		var dlayer, pt=[], cpt=[];
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		
		pt.length = 2;
		cpt.length = 2;
		var adeltaw, adeltah,  bdeltaw, bdeltah;
		var in_adeltaw, in_adeltah,  in_bdeltaw, in_bdeltah;
		
		if (opt_rotatedegs) {
			adeltaw = Math.abs(p_radius * Math.cos(opt_rotatedegs * (Math.PI/180)));
			adeltah = Math.abs(p_radius * Math.sin(opt_rotatedegs * (Math.PI/180)));
		} else {
			adeltaw = 0;
			adeltah = p_radius;
		}
		bdeltaw = adeltah;
		bdeltah = adeltaw;

		if (p_x!=null && p_y!=null) 
		{
			if (is_inscreenspace) {
				cpt[0] = p_x;
				cpt[1] = p_y; 
			} else {
				this._mapcontroller.getScreenPtFromTerrain(p_x, p_y, cpt);
			}
		
			var sz = p_radius;
			
			if (opt_inner_radius) {

				if (opt_rotatedegs) {
					in_adeltaw = Math.abs(opt_inner_radius * Math.cos(opt_rotatedegs * (Math.PI/180)));
					in_adeltah = Math.abs(opt_inner_radius * Math.sin(opt_rotatedegs * (Math.PI/180)));
				} else {
					in_adeltaw = 0;
					in_adeltah = opt_inner_radius;
				}
				in_bdeltaw = in_adeltah;
				in_bdeltah = in_adeltaw;
				
				//console.log(['diff h:', adeltah, in_adeltah]);
		
				// 'vertical top'
				this._ctxdict[dlayer].beginPath();
				pt = [cpt[0] - adeltaw, cpt[1] - adeltah];
				this._ctxdict[dlayer].moveTo(pt[0], pt[1]);
				pt = [cpt[0] - in_adeltaw, cpt[1] - in_adeltah];
				this._ctxdict[dlayer].lineTo(pt[0], pt[1]);

				this._ctxdict[dlayer].stroke();			

				// 'vertical bottom'
				this._ctxdict[dlayer].beginPath();
				pt = [cpt[0] + in_adeltaw, cpt[1] + in_adeltah];
				this._ctxdict[dlayer].moveTo(pt[0], pt[1]);
				pt = [cpt[0] + adeltaw, cpt[1] + adeltah ];
				this._ctxdict[dlayer].lineTo(pt[0], pt[1]);

				this._ctxdict[dlayer].stroke();			

				// 'horizontal left'
			this._ctxdict[dlayer].beginPath();
				pt = [cpt[0] - bdeltaw, cpt[1] + bdeltah ];
			this._ctxdict[dlayer].moveTo(pt[0], pt[1]);
				pt = [cpt[0] - in_bdeltaw, cpt[1] + in_bdeltah];
			this._ctxdict[dlayer].lineTo(pt[0], pt[1]);

			this._ctxdict[dlayer].stroke();
			
				// 'horizontal right' 
			this._ctxdict[dlayer].beginPath();
				pt = [cpt[0] + in_bdeltaw, cpt[1] - in_bdeltah];
				this._ctxdict[dlayer].moveTo(pt[0], pt[1]);
				pt = [cpt[0] + bdeltaw, cpt[1] - bdeltah];
				this._ctxdict[dlayer].lineTo(pt[0], pt[1]);
				
			} else {		
				// 'vertical'
				this._ctxdict[dlayer].beginPath();
				pt = [cpt[0] - adeltaw, cpt[1] - adeltah];
			this._ctxdict[dlayer].moveTo(pt[0], pt[1]);
				pt = [cpt[0] + adeltaw, cpt[1] + adeltah];
			this._ctxdict[dlayer].lineTo(pt[0], pt[1]);

				this._ctxdict[dlayer].stroke();

				// 'horizontal'
				this._ctxdict[dlayer].beginPath();
				pt = [cpt[0] - bdeltaw, cpt[1] + bdeltah];
				this._ctxdict[dlayer].moveTo(pt[0], pt[1]);
				pt = [cpt[0] + bdeltaw, cpt[1] - bdeltah];
				this._ctxdict[dlayer].lineTo(pt[0], pt[1]);
			}

			this._ctxdict[dlayer].stroke();			
			
		}
	};

	this.drawDiamond = function(p_x, p_y, p_stroke, p_fill, 
			p_size, is_inscreenspace,
			opt_displaylayer) 
	{
		var dlayer, pt=[], cpt=[];
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}

		pt.length = 2;
		cpt.length = 2;
		var sz = p_size;
		
		if (p_x!=null && p_y!=null) 
		{
			if (is_inscreenspace) {
				cpt[0] = p_x;
				cpt[1] = p_y; 
			} else {
				this._mapcontroller.getScreenPtFromTerrain(p_x, p_y, cpt);
			}

			this._ctxdict[dlayer].beginPath();
			pt = [cpt[0] - sz, cpt[1]];
			this._ctxdict[dlayer].moveTo(pt[0], pt[1]);
			pt = [cpt[0], cpt[1] - sz];
			this._ctxdict[dlayer].lineTo(pt[0], pt[1]);
			pt = [cpt[0] + sz, cpt[1]];
			this._ctxdict[dlayer].lineTo(pt[0], pt[1]);
			pt = [cpt[0], cpt[1] + sz];
			this._ctxdict[dlayer].lineTo(pt[0], pt[1]);
			pt = [cpt[0] - sz, cpt[1]];
			this._ctxdict[dlayer].lineTo(pt[0], pt[1]);

			if (p_stroke) {
				this._ctxdict[dlayer].stroke();
			}
			if (p_fill) {
				this._ctxdict[dlayer].fill();
			}
		}
	};

	this.drawSquare = function(p_x, p_y, p_stroke, p_fill, 
		p_size, is_inscreenspace,
		opt_displaylayer) 
	{
		var pt, sz;

		var dlayer, pt=[], cpt=[];
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		
		pt.length = 2;
		cpt.length = 2;
		var sz = p_size;
		
		if (p_x!=null && p_y!=null) 
		{
			if (is_inscreenspace) {
				cpt[0] = p_x;
				cpt[1] = p_y; 
			} else {
				this._mapcontroller.getScreenPtFromTerrain(p_x, p_y, cpt);
			}

			// vertical
			this._ctxdict[dlayer].beginPath();
			pt = [cpt[0] - sz, cpt[1] - sz];
			this._ctxdict[dlayer].moveTo(pt[0], pt[1]);
			pt = [cpt[0] + sz, cpt[1] - sz];
			this._ctxdict[dlayer].lineTo(pt[0], pt[1]);
			pt = [cpt[0] + sz, cpt[1] + sz];
			this._ctxdict[dlayer].lineTo(pt[0], pt[1]);
			pt = [cpt[0] - sz, cpt[1] + sz];
			this._ctxdict[dlayer].lineTo(pt[0], pt[1]);
			pt = [cpt[0] - sz, cpt[1] - sz];
			this._ctxdict[dlayer].lineTo(pt[0], pt[1]);

			if (p_stroke) {
				this._ctxdict[dlayer].stroke();
			}
			if (p_fill) {
				this._ctxdict[dlayer].fill();
			}
		}
	};

	this.drawCircle = function(p_cx, p_cy, p_radius, p_stroke, p_fill, 
		is_inscreenspace, opt_displaylayer) 
	{
		var dlayer, rad, pt=[];
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		
		pt.length = 2;
		if (p_cx!=null && p_cy!=null && p_radius!=null) 
		{
			if (is_inscreenspace) {
				rad = p_radius;
				pt[0] = p_cx;
				pt[1] = p_cy; 
			} else {
				rad = this._mapcontroller.m * p_radius;
				this._mapcontroller.getScreenPtFromTerrain(p_cx, p_cy, pt);
			}
			
			this._ctxdict[dlayer].beginPath();
			this._ctxdict[dlayer].arc(pt[0], pt[1], rad, 0, 2*Math.PI);

			if (p_stroke) {
				this._ctxdict[dlayer].stroke();
			}
			if (p_fill) {
				this._ctxdict[dlayer].fill();
			}
		}
	};

	this.drawRect = function(p_llx, p_lly, p_width, p_height, p_stroke, p_fill, 
		is_inscreenspace,
		opt_displaylayer) 
	{
		var pt, sz;

		var dlayer, pt=[], cpt=[];
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = this.activeDisplayLayer;
		}
		
		pt.length = 2;
		cpt.length = 2;

		if (p_llx!=null && p_lly!=null) 
		{
			if (is_inscreenspace) {
				cpt[0] = p_llx;
				cpt[1] = p_lly; 
			} else {
				this._mapcontroller.getScreenPtFromTerrain(p_llx, p_lly, cpt);
			}

			// vertical
			this._ctxdict[dlayer].beginPath();
			pt = [cpt[0], cpt[1]];
			this._ctxdict[dlayer].moveTo(pt[0], pt[1]);
			pt = [cpt[0] + p_width, cpt[1]];
			this._ctxdict[dlayer].lineTo(pt[0], pt[1]);
			pt = [cpt[0] + p_width, cpt[1] + p_height];
			this._ctxdict[dlayer].lineTo(pt[0], pt[1]);
			pt = [cpt[0], cpt[1] + p_height];
			this._ctxdict[dlayer].lineTo(pt[0], pt[1]);
			pt = [cpt[0], cpt[1]];
			this._ctxdict[dlayer].lineTo(pt[0], pt[1]);

			if (p_stroke) {
				this._ctxdict[dlayer].stroke();
			}
			if (p_fill) {
				this._ctxdict[dlayer].fill();
			}
		}
	};
	
	this.tintImgFilter = function(p_ctx, p_imgobj, p_x, p_y, p_ctxw, p_ctxh, p_filteradicdata) {
		
		var alpha, rgbcolorlist = p_filteradicdata['rgbcolorlist'];
		if (p_filteradicdata['alpha'] !== undefined) {
			alpha = p_filteradicdata['alpha'];
		} else {
			alpha = 1.0;
		}

		try {
			var imageData = p_ctx.getImageData(p_x, p_y, p_ctxw, p_ctxh);
			var data = imageData.data;

			for(var i = 0; i < data.length; i += 4) {
			  if (data[i+3] == 0) {
				  continue;
			  }
			  /*if (data[i+3] < 1) {
				  //console.log([data[i], data[i+1], data[i+2], data[i+3]]);
				  continue;
			  }*/
			  // red
			  data[i] =  data[i] + (rgbcolorlist[0]-data[i]) * alpha;
			  // green
			  data[i+1] =  data[i+1] + (rgbcolorlist[1]-data[i+1]) * alpha;
			  // blue
			  data[i+2] =  data[i+2] + (rgbcolorlist[2]-data[i+2]) * alpha;
			}

			// overwrite original image
			p_ctx.putImageData(imageData, p_x, p_y);    			
			
		} catch(e) {
			var accepted = false
			if (e.name !== undefined) {
				if (["NS_ERROR_NOT_AVAILABLE"].indexOf(e.name) >= 0) {
					accepted = true;
				}
			}
			if (!accepted) {
				console.log("... drawImage ERROR ...");
				console.log(p_imgobj);
				console.log(e);
			}
				
		}
	};
		
	this.toGrayScaleImgFilter = function(p_ctx, p_imgobj, p_x, p_y, p_ctxw, p_ctxh, null_filteradicdata) {
		
		try {
			var imageData = p_ctx.getImageData(p_x, p_y, p_ctxw, p_ctxh);
			var data = imageData.data;

			for(var i = 0; i < data.length; i += 4) {
			  var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
			  // red
			  data[i] = brightness;
			  // green
			  data[i + 1] = brightness;
			  // blue
			  data[i + 2] = brightness;
			}

			// overwrite original image
			this._ctxdict[dlayer].putImageData(imageData, p_x, p_y);    			
			
		} catch(e) {
			var accepted = false
			if (e.name !== undefined) {
				if (["NS_ERROR_NOT_AVAILABLE"].indexOf(e.name) >= 0) {
					accepted = true;
				}
			}
			if (!accepted) {
				console.log("... drawImage ERROR ...");
				console.log(p_imgobj);
				console.log(e);
			}
				
		}
	};
	
	this.drawImage = function(p_imageobj, p_x, p_y, 
			b_is_inscreenspace, opt_positioning, opt_width, opt_height, 
			opt_forcemindim, opt_imgfilter_func, opt_imgfilteradicdata, 
			opt_displaylayer) {
				
		var pos, dlayer, dimdefined, pt = [], outxy=[], dims=[];
		if (opt_displaylayer) {
			dlayer = opt_displaylayer;
		} else {
			dlayer = "raster";
		}

		if (opt_positioning && opt_positioning.length == 2) {
			pos = opt_positioning.toLowerCase();
		} else {
			pos = 'cc';
		}
			
		if (b_is_inscreenspace) {
			pt[0] = p_x;
			pt[1] = p_y; 
		} else {
			this._mapcontroller.getScreenPtFromTerrain(p_x, p_y, pt);
		}

		if (p_imageobj.complete) {
			if (opt_width!=null && opt_height!=null) {
				setImageFrame(this._mapcontroller.getScreenScalingFactor(), 
					opt_width, opt_height, false, opt_forcemindim, dims);
			} else {
				setImageFrame(this._mapcontroller.getScreenScalingFactor(), 
					p_imageobj.width, p_imageobj.height, true, opt_forcemindim, dims);
			}
			positioningShifted(pos, pt[0], pt[1], dims, outxy);
			try {
				this._ctxdict[dlayer].drawImage(p_imageobj, outxy[0], outxy[1],  dims[0], dims[1]);
			} catch(e) {
				
				if (e.name !== undefined && (e.name == 'NS_ERROR_NOT_AVAILABLE' || e.name == 'InvalidStateError')) {
					console.warn(String.format("drawImage - image not found:{0}", p_imageobj.src));
					return;
				} else {
					console.log("Invalid image, error name:"+e.name);
					throw new Error(e);
				}
			}
			if (opt_imgfilter_func) {
				opt_imgfilter_func(this._ctxdict[dlayer], p_imageobj, outxy[0], outxy[1], dims[0], dims[1], opt_imgfilteradicdata);
			}
		} else {
			(function(p_pctx, p_sclfactor, p_img, p_pos, p_px, p_py, p_optw, p_opth, p_opt_imgfilter_func, p_imgfilteradicdata) {
				p_img.onload = function() {
					if (p_optw!=null && p_opth!=null) {
						setImageFrame(p_sclfactor, 
							p_optw, p_opth, false, opt_forcemindim, dims);
					} else {
						setImageFrame(p_sclfactor, 
							p_imageobj.width, p_imageobj.height, true, opt_forcemindim, dims);
					}
					positioningShifted(p_pos, p_px, p_py, dims, outxy);
					try {
						p_pctx.drawImage(p_img, outxy[0], outxy[1],  dims[0], dims[1]);
					} catch(e) {						
						if (e.name !== undefined && (e.name == 'NS_ERROR_NOT_AVAILABLE' || e.name == 'InvalidStateError')) {
							console.warn(String.format("drawImage async - image not found:{0}", p_imageobj.src));
							return;
						} else {
							console.log("Invalid async image, error name:"+e.name);
							throw new Error(e);
						}
					}
						
					if (p_opt_imgfilter_func) {
						p_opt_imgfilter_func(p_pctx, p_img, outxy[0], outxy[1],  dims[0], dims[1], p_imgfilteradicdata);
					}
				}
			})(this._ctxdict[dlayer],  this._mapcontroller.getScreenScalingFactor(),
					p_imageobj, pos, pt[0], pt[1], opt_width, opt_height, opt_imgfilter_func, opt_imgfilteradicdata);
		}
		
	};
	
	this.setMarkVertexFunc = function(p_func) {
		this.markVertexFunc = p_func;
	};
	this.setMarkVertices = function(p_flag) {
		if (p_flag && this.markVertexFunc==null) {
			throw new Error(this.msg("MISSVRTMRKFUNC"));
		}
		this.markVertices = p_flag;
	};
	this.setMarkMidpointFunc = function(p_func) {
		this.markMidpointFunc = p_func;
	};
	this.setMarkMidpoints = function(p_flag) {
		if (p_flag && this.markMidpointFunc==null) {
			throw new Error(this.msg("MISMIDPMRKFUNC"));
		}
		this.markMidpoints = p_flag;
	};
	this.resizeCanvasToDisplaySize = function(p_canvas) 
	{
			if (typeof p_canvas != 'object') {
				throw new Error("** resizeCanvasToDisplaySize: canvas element not defined or invalid.");
			} 
			
			var width  = p_canvas.clientWidth | 0;
			var height = p_canvas.clientHeight | 0;
			if (p_canvas.width !== width ||  p_canvas.height !== height) {
				p_canvas.width  = width;
				p_canvas.height = height;
				this.canvasDims[0] = width;
				this.canvasDims[1] = height;
				//console.log("A canvas w:"+p_canvas.width+" h:"+p_canvas.height);
				return true;		
			} else {
				var parElem = p_canvas.parentNode;
				if (parElem) {
					width  = parElem.clientWidth | 0;
					height = parElem.clientHeight | 0;
					if (p_canvas.width !== width ||  p_canvas.height !== height) {
						p_canvas.width  = width;
						p_canvas.height = height;
						this.canvasDims[0] = width;
						this.canvasDims[1] = height;
						//console.log("B canvas w:"+p_canvas.width+" h:"+p_canvas.height);
						return true;		
					}
				}
			}
			//console.log("C canvas w:"+p_canvas.width+" h:"+p_canvas.height);
			
			return false;
	};
	
	
	this.setMarker = function(p_fpath, p_layername, p_oid, p_x, p_y, b_is_inscreenspace,  
			opt_positioning, opt_width, opt_height, opt_forcemindim, 
			opt_displaylayer) {

		if (this.imgmarkermgr) {
			this.imgmarkermgr.setMarker(p_fpath, p_layername, p_oid, p_x, p_y, b_is_inscreenspace,  
				opt_positioning, opt_width, opt_height, opt_forcemindim, 
				opt_displaylayer)
		}	
	}



	
}
