
var MapCtrlConst = {
	MMPD: 25.4 / 96.0,
	ACCPTBLE_LYRREDRAW_DELAY_MSEC: 10,
	MAPCHANGE_TIMEOUT_MSEC: 8000,
	SPINDEX_STEP: 10,
	MAXSCALE_VALUE: 9999999999,
	CLEARMODE_ALL: 0,
	CLEARMODE_RASTER: 2,
	CLEARMODE_VECTOR: 4,
	REFRESH_VECTORS: 2,
	REFRESH_RASTERS: 4,
	MINSCALE: 100,
	MAXLAYERCOUNT: 300
};

// opt_alternate_Layer - indica se o filtro se destina a ser aplicado APENAS
// quando a layer indicada em lname não está visível
function LayerFilter(p_lname, p_fieldname, p_fieldvalue, opt_alternate_Layer) {
	
	this.lname = p_lname;
	this.fname = p_fieldname;
	this.fvalue = p_fieldvalue;
	
	if (opt_alternate_Layer) {
		this.alternate_Layer = true;
	} else {
		this.alternate_Layer = false;
	}

	this.getLayerName = function() {
		return this.lname;
	}

	this.getIsAlternateLayer = function() {
		return this.alternate_Layer;
	}
	
	this.toURLStr = function() {
		return String.format("{0},{1},{2}", this.lname, this.fname ,this.fvalue);
	}
	
	this.toShortURLStr = function() {
		return String.format("{0},{1}", this.fname ,this.fvalue);
	}
	
}

function rasterLayerCounter(p_name) {
	
	this.loaded = 0;
	this.totalrequests = 0;
	this.errors = 0;
	this.name = p_name;
	
	this.init = function(totalImgRequests) {
		this.loaded = 0;
		this.totalrequests = totalImgRequests;
	};

	this.reset = function() {
		this.loaded = 0;
		this.totalrequests = 0;
		this.errors = 0;
	};

	this.hasRequests = function() {
		return (this.totalrequests > 0);
	};
	
	this.allLoaded = function() {
		return (this.loaded == this.totalrequests);
	};
	
	this.incrementLoaded = function() {
		this.loaded = this.loaded+1;
	};

	this.resetLoaded = function() {
		this.loaded = 0;
	};

	this.decrementRequests = function(p_iserror) {
		this.totalrequests = this.totalrequests - 1;
		if (p_iserror) {
			this.errors++;
		}
	};
	
	this.getRequestsCount = function() {
		return this.totalrequests;
	};

	this.getLoadedCount = function() {
		return this.loaded;
	};

	this.toString = function() {
		return this.loaded + "/" + this.totalrequests;
	};
	
	this.toDiagnosticsString= function() {
		return String.format("total:{0}, loaded:{1}, errors:{2}", this.totalrequests, this.loaded, this.errors);
	};

}

function rasterLayerCounters() {
	
	this.counters = {};
	
	this.init = function(p_rasterlyrname, totalImgRequests) {
		if (this.counters[p_rasterlyrname] === undefined) {
			this.counters[p_rasterlyrname] = new rasterLayerCounter(p_rasterlyrname);
		}
		this.counters[p_rasterlyrname].init(totalImgRequests);
	};

	this.resetLoaded = function(p_rasterlyrname) {
		this.counters[p_rasterlyrname].resetLoaded();
	};

	this.incrementLoaded = function(p_rasterlyrname) {
		this.counters[p_rasterlyrname].incrementLoaded();
	};

	this.reset = function(p_rasterlyrname) {
		if (this.counters[p_rasterlyrname] === undefined) {
			this.counters[p_rasterlyrname] = new rasterLayerCounter(p_rasterlyrname);
		}
		this.counters[p_rasterlyrname].reset();
	};
	
	this.resetAll = function() {
		for (var k in this.counters) {
			if (this.counters.hasOwnProperty(k)) {
				this.reset(k);
			}
		}
	};

	this.decrementRequests = function(p_rasterlyrname, p_iserror) {
		this.counters[p_rasterlyrname].decrementRequests(p_iserror);
	};

	this.toString = function(p_rasterlyrname) {
		return this.counters[p_rasterlyrname].toString();
	};

	this.toDiagnosticsString= function() {
		var outarray = [];
		for (var rnamex in this.counters) 
		{
			if (this.counters.hasOwnProperty(rnamex)) {
				outarray.push(rnamex+": "+this.counters[rnamex].toDiagnosticsString());
			} 
		}
		return outarray.join(",");
	};
	
	this.getRequestsCount = function(p_rasterlyrname) {
		return this.counters[p_rasterlyrname].getRequestsCount();
	};

	this.getLoadedCount = function(p_rasterlyrname) {
		return this.counters[p_rasterlyrname].getLoadedCount();
	};

	this.allLoaded = function() {
		var ret = true;
		for (var rnamex in this.counters) 
		{
			if (this.counters.hasOwnProperty(rnamex)) {
				if (!this.counters[rnamex].allLoaded()) {
					ret = false;
					break;
				}
			} 
			if (!ret) {
				break;
			}
		}
		return ret;
	};

	this.hasRequests = function(p_rasterlyrname) {
		return this.counters[p_rasterlyrname].hasRequests();
	};

}

function scaleLevelFromScaleValue(p_sclvalue) {
	var ret;
	if (p_sclvalue < 200) {
		ret = 0;
	} else if (p_sclvalue >= 200 && p_sclvalue < 375) {
		ret = 1;
	} else if (p_sclvalue >= 375 && p_sclvalue < 750) {
		ret = 2;
	} else if (p_sclvalue >= 750 && p_sclvalue < 1500) {
		ret = 3;
	} else if (p_sclvalue >= 1500 && p_sclvalue < 3000) {
		ret = 4;
	} else if (p_sclvalue >= 3000 && p_sclvalue < 6000) {
		ret = 5;
	} else if (p_sclvalue >= 6000 && p_sclvalue < 12000) {
		ret = 6;
	} else if (p_sclvalue >= 12000 && p_sclvalue < 24000) {
		ret = 7;
	} else if (p_sclvalue >= 24000 && p_sclvalue < 48000) {
		ret = 8;
	} else if (p_sclvalue >= 48000 && p_sclvalue < 126000) {
		ret = 9;
	} else if (p_sclvalue >= 252000 && p_sclvalue < 500000) {
		ret = 10;
	} else if (p_sclvalue >= 500000 && p_sclvalue < 1000000) {
		ret = 11;
	} else if (p_sclvalue >= 1000000 && p_sclvalue < 2000000) {
		ret = 12;
	} else {
		ret = 13;
	}
	
	return ret;
};

function topLeftCoordsFromRowCol(p_col, p_row, p_rasterSpecs, out_terraincoords) {
	
	out_terraincoords.length = 0;	
	
	out_terraincoords[0] = (p_col * p_rasterSpecs.colwidth) + p_rasterSpecs.easting;
	out_terraincoords[1] = p_rasterSpecs.topnorthing - (p_row * p_rasterSpecs.rowheight);
	
}
 
function Envelope2D() {

	this.i18nmsgs = {
			"pt": {
				"NONEW": "'Envelope2D' é classe, o seu construtor foi invocado sem 'new'",					
				"INVALIDPT": "Ponto inválido"					
			}
		};
	this.msg = function(p_msgkey) {
		// TODO: resolver detecção automática lang
		//var langstr = navigator.language || navigator.userLanguage;
		//var lang = langstr.splice(1,2);
		var lang = "pt";
		return this.i18nmsgs[lang][p_msgkey];
	};
			
	if ( !(this instanceof arguments.callee) )
		throw new Error(this.msg("NONEW"));
	
	this.getClassStr = function() {
		return "Envelope2D";
	};
	
	this.minx = 0;
	this.miny = 0;
	this.maxx = 0;
	this.maxy = 0;
	
	this.setMinsMaxs = function(p_minx, p_miny, p_maxx, p_maxy) {
		this.minx = Math.min(p_minx, p_maxx);
		this.maxx = Math.max(p_minx, p_maxx);
		this.miny = Math.min(p_miny, p_maxy);
		this.maxy = Math.max(p_miny, p_maxy);
	};

	this.setFromOther = function(p_other) {
		this.minx = Math.min(p_other.minx, p_other.maxx);
		this.maxx = Math.max(p_other.minx, p_other.maxx);
		this.miny = Math.min(p_other.miny, p_other.maxy);
		this.maxy = Math.max(p_other.miny, p_other.maxy);
	};
	
	this.setNullAround = function(p_center) {
		if (p_center === null || typeof p_center != 'object' || p_center.length != 2) 
			throw new Error(this.msg("INVALIDPT"));

		this.minx = p_center[0];
		this.miny = p_center[1];
		this.maxx = p_center[0];
		this.maxy = p_center[1];		
	};
	
	this.addPoint = function(p_pt) 
	{
		if (p_pt[0] < this.minx) {
			this.minx = p_pt[0];
		}
		if (p_pt[0] > this.maxx) {
			this.maxx = p_pt[0];
		}
		if (p_pt[1] < this.miny) {
			this.miny = p_pt[1];
		}
		if (p_pt[1] > this.maxy) {
			this.maxy = p_pt[1];
		}
	};
	
	this.getCenter = function(out_pt) 
	{
		var w = this.maxx - this.minx;
		var h = this.maxy - this.miny;
		out_pt[0] = this.minx + (w / 2.0);
		out_pt[1] = this.miny + (h / 2.0);		
	};
	
	this.expand = function(p_mult) 
	{		
		var w = this.maxx - this.minx;
		var h = this.maxy - this.miny;
		var cx = this.minx + (w / 2.0);
		var cy = this.miny + (h / 2.0);
		
		var expw = w * p_mult;
		var exph = h * p_mult;
		
		this.minx = cx - (expw / 2.0);
		this.maxx = this.minx + expw;
		this.miny = cy - (exph / 2.0);
		this.maxy = this.miny + exph;		
	};
	
	this.toString = function() {
		var fmt = "minx:{0} miny:{1} maxx:{2} maxy:{3}";
		return String.format(fmt, formatFracDigits(this.minx,2), formatFracDigits(this.miny,2), formatFracDigits(this.maxx,2), formatFracDigits(this.maxy,2));
	};	
	
	this.getWidth = function() {
		return this.maxx - this.minx;
	};
	
	this.getHeight = function() {
		return this.maxy - this.miny;
	};

	this.getWHRatio = function(opt_esv, opt_elv) 
	{
		var ret = 0, esv = 0.00001, elv = 9999999;
		
		if (opt_esv) {
			esv = opt_esv;
		}
		if (opt_elv) {
			elv = opt_elv;
		}
		
		var h = this.getHeight();
		
		if (Math.abs(h) < esv) {
			ret = elv;
		} else {
			ret = this.getWidth() / h;			
		}
		
		return ret;
	};
	
	this.widthIsBigger = function() {
		return this.getWidth() > this.getHeight();
	};
	
	this.checkPointIsOn = function(p_pt) {
		return (p_pt[0] >= this.minx && p_pt[0] <= this.maxx &&
				p_pt[1] >= this.miny && p_pt[1] <= this.maxy);
	};
	
}

function RetrievalController() {
	
	this.p_orderedlayers = null;
	this._layersandstats = null;
	this._requestid = null;
	this._currlayerindex = null;
	this._rasterlayersspecs = {};
	this.layerscalelimits = {};
	this._orderedlayernames = [];
	this._ordrasterlayernames = [];
	this.layercount = 0;
	this.dolog = false;

	this.reset = function() {
		this._layersandstats = null;
		this._currlayerindex = null;
	};
	this.getLayerCount = function() {
		return this.layercount;
	};
	this.getRequestId = function() {
		return this._requestid;
	};
	this.getRasterCount = function() {
		return this._ordrasterlayernames.length;
	};
	this.getRasterNames = function(p_retlist, opt_tolower) 
	{
		if (this.dolog) {
			console.trace("getRasterNames");
		}
		p_retlist.length = 0;
		var grn_i=0;
		while (this._ordrasterlayernames[grn_i] !== undefined && this._ordrasterlayernames[grn_i] != null) 
		{
			if (opt_tolower) {
				p_retlist.push(this._ordrasterlayernames[grn_i].toLowerCase());
			} else {
				p_retlist.push(this._ordrasterlayernames[grn_i]);
			}
			grn_i++;
			if (grn_i > MapCtrlConst.MAXLAYERCOUNT) {
				throw new Error("excess layer name cycling");
			}
		}
	};
	this.clearRasterNames = function() {
		if (this.dolog) {
			console.trace("clearRasterNames");
		}
		this._ordrasterlayernames.length = 0;
	};
	this.setRasterNames = function(p_rasternameslist) {
		if (p_rasternameslist.length < 1) {
			return;
		}
		if (this.dolog) {
			console.trace("setRasterNames");
		}
		this._ordrasterlayernames.length = 0;
		var i=0;
		while (p_rasternameslist[i] !== undefined && p_rasternameslist[i] != null) {
			this._ordrasterlayernames.push(p_rasternameslist[i]);
			i++;
		}
	};
	this.setLayerScaleLimits = function(p_lname, p_bottom, p_top) {
		this.layerscalelimits[p_lname] = [p_bottom, p_top];
	};
	// Set layers during initial read
	this.initialSetLayers = function (p_orderedlayers, p_orderedrasterlayers, p_layers_with_stats) {
		this._orderedlayernames = clone(p_orderedlayers);
		this._ordrasterlayernames = clone(p_orderedrasterlayers);
		this.layercount = this._orderedlayernames.length;
		if (!p_layers_with_stats) {
			this._currlayerindex = -1;
		}
	};
	
	this.setRasterLayerSpecs = function(p_name, p_obj, p_general_obj) {
		this._rasterlayersspecs[p_name] = clone(p_obj);
		this._rasterlayersspecs[p_name].outimgext = p_general_obj.outimgext;
		this._rasterlayersspecs[p_name].pixsize = p_general_obj.pixsize;
		this._rasterlayersspecs[p_name].topnorthing = p_general_obj.topnorthing;
		this._rasterlayersspecs[p_name].easting = p_general_obj.easting;
		this._rasterlayersspecs[p_name].level = p_obj.level;
		//this._rasterlayersspecs[p_name].pixsize = p_general_obj.pixsize;
	};
	this.getRasterLayerSpecs = function(p_name) {
		return this._rasterlayersspecs[p_name];
	};
	this.clearRasterLayerSpecs = function() {
		this._rasterlayersspecs = {};
	};
	this.existRasterLayerSpecs = function(p_name) {
		return (this._rasterlayersspecs[p_name] !== undefined && this._rasterlayersspecs[p_name] != null);
	};
	this.existAnyRasterLayerSpecs = function() {
		return !isEmpty(this._rasterlayersspecs);
	};
	this.cycleRasterLayerSpecs = function(p_function, p_mapctrller, the_rcvctrler, p_sclval, p_clrimgflagref)
	{
		for (var name in this._rasterlayersspecs) {
			if (this._rasterlayersspecs.hasOwnProperty(name)) {
				p_function(name, this._rasterlayersspecs[name], p_mapctrller, the_rcvctrler, p_sclval, p_clrimgflagref);
			}
		}
	};
	this.existLayerStats = function() {
		ret = false;

		if (this._layersandstats != null) {
			ret = !isEmpty(this._layersandstats);
		}
		return ret;
	};
	this.setLayersStats = function (p_obj) {
		this._currlayerindex = -1;
		this._requestid = p_obj.reqid;
		
		if (p_obj.stats) {
			this._layersandstats = clone(p_obj.stats);
		}
		
		return (p_obj.stats != null);
	};
	this.hasAnythingToDraw = function() {
		var lname, lstats, ret = false;		
		for (var i=0; i<this._orderedlayernames.length; i++) 
		{
			lname = this._orderedlayernames[i];
			lstats = this._layersandstats[lname];
			if (lstats != null) {
				if (lstats.nvert > 0) {
					ret = true;
					break;
				}
			}
		}
		return ret;
	};

	this.hasCurrLayer = function() {
		var ret = false;
		if (this._currlayerindex < (this._orderedlayernames.length-1)) {
			ret = true;
		}
		return ret;
	};
	
	this.checkLayerScaleDepVisibility = function(p_lname, p_scale) {
		var ret = false;
		if (this.layerscalelimits[p_lname] === undefined) {	
			ret = true;
		} else {
			if (p_scale >= this.layerscalelimits[p_lname][0] && p_scale <= this.layerscalelimits[p_lname][1]) {
				ret = true;
			}				
		}		
		return ret;
	};
	this.hasVisibleLayersAtThisScale = function(p_scale) {
		var lname, ret = false;	
		
		//if (this.existLayerStats())
		
		if (!ret) {
			for (var i=0; i<this._orderedlayernames.length; i++) {
				lname = this._orderedlayernames[i];
				ret = this.checkLayerScaleDepVisibility(lname, p_scale);
				if (ret) {
					break;
				}
			}
		}
		return ret;
	};
	this.getVisibleLayersList = function(p_scale, out_list, opt_alllayers_returns_emptylist) {
		out_list.length = 0;
		var lname, cnt=0, is_ok = false;	
		
		if (opt_alllayers_returns_emptylist) 
		{
			for (var i=0; i<this._orderedlayernames.length; i++) 
			{
				lname = this._orderedlayernames[i];
				if (this.layerscalelimits[lname] === undefined) {		
					cnt++;
				} else {
					if (p_scale >= this.layerscalelimits[lname][0] && p_scale <= this.layerscalelimits[lname][1]) {
						cnt++;
					}				
				}
			}
			
			if (cnt == this.layercount) {
				is_ok = true;
			}
		} 
		
		if (!is_ok) 
		{
			for (var i=0; i<this._orderedlayernames.length; i++) {
				lname = this._orderedlayernames[i];
				if (this.layerscalelimits[lname] === undefined) {		
					out_list.push(lname);
				} else {
					if (p_scale >= this.layerscalelimits[lname][0] && p_scale <= this.layerscalelimits[lname][1]) {
						out_list.push(lname);
					}				
				}
			}
		}
	};

	// Como os limites de escala já foram testados no pedido de estatísticas,
	// basta verificar se a próxima layer está presente no último resultado de 
	// estatísticas, com núm. vértices > 0
	this.nextCurrLayer = function() 
	{
		var lname, lstats, found = false;
		var idx = this._currlayerindex;
		while (idx < (this._orderedlayernames.length-1)) {
			idx++;
			lname = this._orderedlayernames[idx];
			lstats = this._layersandstats[lname];
			if (lstats !== undefined && lstats != null) 
			{
				if (lstats != null) {
					if (lstats.nvert > 0) {
						found = true;
						this._currlayerindex = idx;
					}
				}
			}
			if (found) {
				break;
			}
		}
		if (!found) {
			this._currlayerindex = -1;
		}
		//console.log("nextCurrLayer lyr:"+lname+" found:"+found);
		return found;
	};
	this.getCurrLayerName = function() {
		var ret = null;
		if (this._currlayerindex !== null && this._currlayerindex >= 0) {
			ret = this._orderedlayernames[this._currlayerindex];
		}
		return ret;
	};
	this.getCurrNumbers = function(p_retobj) {
		var lname;
		p_retobj.length = 3;
		p_retobj[0] = null;
		if (this._currlayerindex !== null && this._currlayerindex >= 0) {
			lname = this._orderedlayernames[this._currlayerindex];
			p_retobj[0] = lname;
			if (this._layersandstats[lname] !== undefined && this._layersandstats[lname] != null) 
			{
				p_retobj[1] = this._layersandstats[lname].nchunks;
				p_retobj[2] = this._layersandstats[lname].nvert;
			} 
			else {
				p_retobj[1] = null;
				p_retobj[2] = null;				
			}
		}
	};
	this.currIsFirstLayer = function() {
		return (this._currlayerindex === 0);
	};
	this.currentlyRetrieving = function() {
		return (this._currlayerindex !== null && this._currlayerindex >= 0);
	};
	
	
}

function rasterkey(p_lvl, p_col, p_row) {
	//console.log("lvl col row:"+p_lvl+","+p_col+","+p_row);
	return formatPaddingDigits(p_lvl,0,3) + "_" + 
			formatPaddingDigits(p_col,0,5) + "_" + 
			formatPaddingDigits(p_row,0,5);
}

function rasterkey_from_pyrpos(p_pyrposarray) {
	//console.log("p_pyrposarray:"+JSON.stringify(p_pyrposarray));
	return formatPaddingDigits(p_pyrposarray[0],0,3) + "_" + 
			formatPaddingDigits(p_pyrposarray[1],0,5) + "_" + 
			formatPaddingDigits(p_pyrposarray[2],0,5);
}

function maxScaleView(p_scale, p_center) {
	this.scale = p_scale;
	this.terrain_center = [p_center[0], p_center[1]];
}

function emptyImageURL() {
	return '';
}

function legendData() {
	
	this.orderedkeys = [];
	this.data = {};
	this.widget_id = null;
	
	this.setWidgetId = function(p_widget_id) {
		this.widget_id = p_widget_id;
	};	
	this.clear = function() {
		this.orderedkeys.length = 0;
		this.data = {};
	};
	this.doset = function(p_layername, p_layertitle, p_style_obj) {
		let key;
		if (p_style_obj['labelkey'] === undefined) {
			return;
		}
		key = p_layername + "_" + p_style_obj['labelkey'].toUpperCase();
		if (this.orderedkeys.indexOf(key) < 0) {
			this.orderedkeys.push(key);
		}
		this.data[key] = {
			"lname": p_layername,
			"ltitle": p_layertitle,
			"style": clone(p_style_obj),
			"count": 0
		};
	};
	
	this.add = function(p_layername, p_layertitle, p_style_obj) {
		let key;
		if (p_style_obj['labelkey'] === undefined) {
			return;
		}
		key = p_layername + "_" + p_style_obj['labelkey'].toUpperCase();
		if (this.orderedkeys.indexOf(key) >= 0) {
			this.data[key]['count'] = this.data[key]['count'] + 1;
		} else {
			this.orderedkeys.push(key);
			this.data[key] = {
				"lname": p_layername,
				"ltitle": p_layertitle,
				"style": clone(p_style_obj),
				"count": 1
			};
		}
	};
	
	this.updateLegendWidget = function(p_title_caption_key, p_i18n_function) {
		console.log(JSON.stringify(this.data));	
		let leg_container = null;	
		let t, r, d, w, x, k, prevtitle=null, title, st;
		if (this.widget_id) {
			
			leg_container = document.getElementById(this.widget_id);
			if (leg_container) {
				
				while (leg_container.firstChild) {
					leg_container.removeChild(leg_container.firstChild);
				}	
				t = document.createElement("table");
				leg_container.appendChild(t);
				r = document.createElement("tr");	
				t.appendChild(r);				
				d = document.createElement("td");	
				r.appendChild(d);				
				w = document.createElement("p");	
				d.appendChild(w);
				
				x = document.createTextNode(p_i18n_function(p_title_caption_key));				
				w.appendChild(x);				
				setClass(w, "visctrl-h1");
				
				for (var i=0; i<this.orderedkeys.length; i++) {
					
					k = this.orderedkeys[i];
					title = this.data[k]["ltitle"];
					
					if (prevtitle != title) {				
						r = document.createElement("tr");	
						t.appendChild(r);				
						d = document.createElement("td");	
						r.appendChild(d);	
						
						d.insertAdjacentHTML('afterbegin',title);
									
						//x = document.createTextNode(title);				
						//d.appendChild(x);
							
						setClass(d, "visctrl-entry");
					}
					prevtitle = title;
					
					st = this.data[k]["style"];
					if (st) {
						r = document.createElement("tr");	
						t.appendChild(r);				
						d = document.createElement("td");	
						r.appendChild(d);				
						x = document.createTextNode(p_i18n_function(st["labelkey"]));
						d.appendChild(x);	
						setClass(d, "visctrl-subentry");
					}
					
							
				}
											
			}
		}
	};

	
	/*
	this.getStyle = function(p_key) {
		let key = p_key.toUpperCase();
		return this.styles[key];
	};
	
	this.getElemCount = function(p_key) {
		let key = p_key.toUpperCase();
		return this.elemcounter[key];
	};
	* */
}

function GraphicControllerMgr(p_mapctrler, p_elemid) {
	
	this.orderedkeys = [];
	this.graphicControllerCollection = {};
	this.activekey = null;
	
	this.create = function(p_mapctrler, p_elemid, p_canvaskey) {
		if (this.orderedkeys.indexOf(p_elemid) >= 0) {
			throw new Error(String.format("graphicControllerMgr: key already in use: {0}",p_canvaskey));
		}
		this.orderedkeys.push(p_elemid);
		this.graphicControllerCollection[p_canvaskey] = new CanvasController(p_elemid, p_mapctrler);
		this.activekey = p_canvaskey;
	};
	
	this.get = function(opt_canvaskey) {
		let key;
		if (this.orderedkeys.length == 0) {
			throw new Error("graphicControllerMgr: no controllers available");
		}
		if (opt_canvaskey) {
			if (this.graphicControllerCollection[opt_canvaskey] === undefined) {
				throw new Error(String.format("graphicControllerMgr: get - no key: {0}", opt_canvaskey));
			}
			key = opt_canvaskey;
		} else {
			if (this.activekey == null) {
				throw new Error("graphicControllerMgr: no active key");
			}
			key = this.activekey;
		}
		return this.graphicControllerCollection[key];
	};
	
	this.setActive = function(p_canvaskey) {
		if (this.orderedkeys.length == 0) {
			throw new Error("graphicControllerMgr: no controllers available");
		}
		if (this.graphicControllerCollection[p_canvaskey] === undefined) {
			throw new Error(String.format("graphicControllerMgr: setActive - no key: {0}", p_canvaskey));
		}
		this.activekey = p_canvaskey;
	};
	
	this.create(p_mapctrler, p_elemid, "main");
}
	

