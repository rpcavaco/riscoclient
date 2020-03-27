
/* Tem DEPENDÊNCIA de:
 *
 * 		m3map.js
 * 		canvasctrl.js
 * 		geom.js
 * 		mapcontrols.js
 * 		labelengine.js
 * 		mapctrllergeomgen.js
 * 		mapctrllerhelpers.js
 * 		spindex.js
 */

var toggle_found = false;

// debounced resize
function resizeExec(p_mapctrl, opt_msg) {
	let timerId = null;
	let waitPeriodMsec = 200;
	return function(e) {
		if (opt_msg) {
			console.log(opt_msg);
		}
		if (timerId != null) {
			window.clearTimeout(timerId);
		}
		timerId = window.setTimeout(function(e) {
			p_mapctrl.refresh(true);
			timerId = null;
		}, waitPeriodMsec);
	}
}
	
/** 
  * Main object to control map display
  * @param {string} p_elemid - The ID of HTML container object to recieve the map display.
  * @param {Object} po_initconfig - Object containing map config attributes
  * @param {boolean} p_debug_callsequence - activate call sequence debugging
  * @constructor 
*/
function MapController(p_elemid, po_initconfig, p_debug_callsequence) {


/** @this MapController 
 *  @returns {string} String containing class name
*/
	this.getClassStr = function() {
		return "MapController";
	};
	this.i18nmsgs = {
			"pt": {
				"NONEW": "'MapController' é classe, o seu construtor foi invocado sem 'new'",
				"NOID": "construtor de 'MapController' invocado sem ID do elemento canvas respectivo",
				"NOCONFIG": "construtor de 'MapController' invocado sem configuração inicial",
				"INVSCL": "valor inválido de escala:",
				"NOSCL": "configuração de mapcontroller sem escala",
				"ERRCEN0": "erro de configuração de coords de centro, primeira coordenada é inválida",
				"ERRCEN1": "erro de configuração de coords de centro, segunda coordenada é inválida",
				"NOCEN": "configuração de mapcontroller sem coords de centro",
				"MISSPARM1X": "getScreenPt, parm. requerido -- coordenada x, foi recebido:",
				"MISSPARM1Y": "getScreenPt, parm. requerido -- coordenada y, foi recebido:",
				"MISSPARM2": "getTerrainPt, parm. requerido -- array de dois elementos, foi recebido:",
				"NOURL": "configuração de mapcontroller sem URL",
				"NOLYRS": "configuração de mapcontroller sem layers",
				"NOVECTLYRS": "configuração de mapcontroller sem layers vetoriais ativas (lnames vazio)",
				"NOSCLLYRS": "sem layers visíveis a esta escala",
				"NOTUSEDLYRS": "layers configuradas mas não usadas em 'lnames':",
				"NOTCONFIGEDLYRS": "layers sem configuração:",
				"NOTSTYLEDLYRS": "layers sem estilo (colocar onlydata=true para servir apenas dados):",
				"MISSLYRS": "layers ativadas em 'lnames' mas sem configuração",
				"MISSSMALLSRCCFG": "layer indicada para vista de escala menor (small_scale_source) não tem configuração",
				"MISSSMALLSRCSCALE": "layer indicada para vista de escala menor tem de ter limite mínimo de escala de visualização definido ('scalelimits' -> 'bottom')",
				"EMPTYSTY": "popStyle: stack vazia",
				"FSUNAVAILA": "serviço de features indisponível, erro {0} ao obter estatísticas",
				"FSUNAVAILB": "serviço de features indisponível, erro {0} ao obter objetos dinâmicos",
				"FSUNAVAILC": "serviço de features indisponível, erro {0} ao obter objetos estáticos",
				"NOTHDRAW": "uma das layers nao tem estilo definido: nada a desenhar",
				"MISSLYRCFG": "A configuração para o tema de id {0} não existe",
				"NOLBLATTRIB": "layer com label mal definida -- sem ATTRIB:",
				"DUPLYRNAME": "nome de layer repetido em 'lnames':",
				"XXFEATSBYCALL": "excedido limite de features na mesma chamada",
				"MISSLYR": "getFeaturesURL: configuração de layers não inclui a layer:",
				"MISSRASTERLYR": "layer não e raster:",
				"SERVERCONTACTED": "servidor contactado",
				"RETRIEVINGLAYER": "a obter a camada ",
				"RETRIEVINGRASTERS": "a obter imagens",
				"RETRIEVEDRASTER": "obtida imagem",
				"RETRIEVINGADICELEMS": "a obter elementos adicionais",
				"MISSLYRINBDCFG": "layer em falta na configuração residente em bd:",
				"NOTHINGTODRAW": "nada a desenhar",
				"GEOMSTRUCT": "erro em geometria do tipo {0}, estrutura",
				"GEOMMINELEMS": "erro em geometria do tipo {0}, minimo de elementos",
				"UNSUPPORTEDGEOMTYPE": "tipo de geometria não suportado: {0}",
				"MISSINGGEOMETRY": "feature sem geometria",
				"IDXNOTFOUND": "índice '{0}' não encontrado",
				"IDXKEYNOTFOUND": "chave de índice {0} não encontrada: {1}",
				"IDXBUILDMISSINGKEY": "atributo chave {0} não encontrado na construção do índice {1}",
				"IDXBUILDMISSINGVAL": "atributo valor {0} não encontrado na construção do índice {1}"

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
		return this.i18nmsgs[lang][p_msgkey];
	};
	this.normalFinishModes = ["retrievetasters", "normal", "toggleTOC"];
	
	this.dodebug = false;
	
	this.callSequence = new CallSequence(p_debug_callsequence);

	if ( !(this instanceof arguments.callee) )
		throw new Error(this.msg("NONEW"));

	if (p_elemid === null)
		throw new Error(this.msg("NOID"));

	if (po_initconfig === null || po_initconfig === undefined)
		throw new Error(this.msg("NOCONFIG"));

	// Flags
	this.activeserver = true;
	this.do_showLayerDrawingCondition = false;
	
	this.showMsg = function (p_msg) {
		window.alert(p_msg);	
	};
	this.showWarn = function (p_msg) {
		window.alert(p_msg);	
	};	
	this.setMessenger = function (p_func) {
		this.showMsg = p_func;
	};
	this.setWarner = function (p_func) {
		this.showWarn = p_func;
	};
	
	this.lang = "pt";
	this.i18n_text = null;
	this.features = {};
	
	this.images = {};
	this.pendingimages = {};
	this.imagecounters = new rasterLayerCounters();
	
	//this.grController = null;
	this.grCtrlrMgr = null;
	this.mapctrlsmgr = null;
	this.floatingWidgetsMgr = null;
	this.baseurl = null;
	this.filename = null;
	this.fanningChunks = [];
	this.pendingChunks = [];
	this.pendingpubscaleval = false;
	this.scalewidgetids = [];
	this.waitingForFirstChunk = false;
	this._xhrs = [];
	this.onDrawFinishFuncs = {};
	this.onDrawFinishTransientFuncs = [];
	this.onClearTransientLayer = [];
	this.onBeforeRefresh = [];
	this.onPanZoom = [];
	this.onDrawing_FeatureTransform = [];
	this.prevhdims = [];
	this.styleStack = {}; // by display layer
	this.currentstyle = null;
	this.altstylemode = null;
	this.lconfig = {};
	this.fillpatterns = {};
	this.small_scale_source = null;
	this.small_scale_limit = null;
	this.globalindex = {};
	this.mapname = null;
	this.bgcolor = null;
	this.env = null;
	this.dataRetrievalEnvExpandFactor = 1.0;
	this.refreshmode = 0;
	this.refreshcapability = 0;
	this.adic_refresh_func = [];
	this.rasterlayersrequested = [];
	this.maxscaleview = null;
	this.drawnrasters = [];
	this.muted_vectors = false;
	this.layernames_to_spatialindex = [];
	this.perattribute_indexing = {
		//revindex: {},
		index: {},
		addToIndex: function(p_layername, p_styleidx, p_oid) {
			if (this.index[p_layername] === undefined) {
				this.index[p_layername] = {};
			}
			/*if (this.revindex[p_layername] === undefined) {
				this.revindex[p_layername] = {};
			} */
			if (this.index[p_layername][p_styleidx] === undefined) {
				this.index[p_layername][p_styleidx] = [];
			}
			if (this.index[p_layername][p_styleidx].indexOf(p_oid) < 0) {
				this.index[p_layername][p_styleidx].push(p_oid);
			}
			/*if (this.revindex[p_layername][p_oid] === undefined) {
				this.revindex[p_layername][p_oid] = p_styleidx;
			} */
		},
		get: function(p_layername, p_styleidx) {
			var ret = null;
			if (this.index[p_layername] !== undefined && this.index[p_layername][p_styleidx] !== undefined) {
				ret = this.index[p_layername][p_styleidx];
			}
			return ret;
		},
		reset: function() {
			//this.revindex = {};
			this.index = {};
		}
	};
	this.addAdicRefreshFunc = function(p_new_func) { // Usually for editor refresh function
		this.adic_refresh_func.push(p_new_func);
	};
	this.lastSrvResponseTransform = {
		cenx: -1,
		ceny: -1,
		pixsz: -1,
		setFromData: function(p_data_obj) {
			this.cenx = p_data_obj.cenx;
			this.ceny = p_data_obj.ceny;
			this.pixsz = p_data_obj.pxsz;
		}
	};
	this.transformsQueue = {
		_queue: [],
		currentTransform: new MapAffineTransformation(),
		checkToStore: function() {
			this._queue.push(clone(this.currentTransform));
			this._queue[this._queue.length-1].setName(String.format("trans n.º {0}", this._queue.length));
		},
		getLastStored: function() {
			let ret = null;
			if (this._queue.length > 0) {
				ret = this._queue[this._queue.length-1];
			}
			return ret;
		}
	};
	
	this.style_visibility = null;
	
	this._cancelCurrentChange = false;
	
	this.getI18NMsg = function(p_key) {
		if (this.lang == null) {
			throw new Error("getI18NMsg, lang is undefined");
		}
		return this.i18n_text[this.lang][p_key];
	};

	this.getI18NMsgFunc = function() {
		return (function (p_self) {
			return function(p_key) {
				if (p_self.lang == null) {
					throw new Error("getI18NMsgFunc, lang is undefined");
				}
				return p_self.i18n_text[p_self.lang][p_key];
			}
		})(this);
	};
	
	// Transform screen coords between last and current tranformations
	this.getScrDiffPt = function(p_x, p_y, outpt) {
		outpt.length = 2;
		let mx1=[], mx2=[], v2=[], v3=[], tmx=[], v, lst = this.transformsQueue.getLastStored();
		var trans = this.transformsQueue.currentTransform;
		if (lst) {
			// if current / transient trans has been changed
			v = [p_x, p_y, 1];
			// get terrain coords from the inverse of previous transformation
			lst.getInvMatrix(mx1);
			m3.vectorMultiply(v, mx1, v2);
			// transform terrain to screen coords according to current trans
			trans.getMatrix(mx2);
			m3.vectorMultiply(v2, mx2, v3);
			
			outpt[0] = v3[0];
			outpt[1] = v3[1];
		} else {
			// if current / transient trans has NOT been changed
			outpt[0] = p_x;
			outpt[1] = p_y;
		}
		
	};
		
	this.trace_oids = [];
	
	this.mapdiv = document.getElementById(p_elemid);

	this.rasterDiag = function() {
		console.log(this.imagecounters.toDiagnosticsString());
	}
	
	this.getMapDiv = function() {
		return this.mapdiv;
	};

	this.setTraceFeatId = function(p_featid) {
		this.trace_oids.push(p_featid);
	};
	this.clearTraceFeatures = function() {
		this.trace_oids.length = 0;
	};
	this.pubScaleVal = function(opt_scale) {
		var scl;
		var ctrans = this.transformsQueue.currentTransform;	
		if (opt_scale) {
			scl = opt_scale;
		} else {
			scl = ctrans.getCartoScaleVal(MapCtrlConst.MMPD);
		}
		for (var i=0; i<this.scalewidgetids.length; i++) {
			var wid = document.getElementById(this.scalewidgetids[i]);
			if (wid) {
				wid.innerHTML = "1:"+parseInt(scl);
			}
		}
	};
	this.setScale = function(p_scale) 
	{
		if (p_scale === null) {
			throw new Error(this.msg("INVSCL")+p_scale);
		}
		var vscale, p1_scale = parseFloat(p_scale);
		if (p1_scale <= 0) {
			throw new Error(this.msg("INVSCL")+p1_scale);
		}
		
		// Arredondar
		if (p1_scale < MapCtrlConst.MINSCALE) {
			vscale = MapCtrlConst.MINSCALE;
		} else {
			vscale = p1_scale;
		}
		
		if (vscale < 250) {
			vscale = parseInt(Math.round(vscale));
		} else if (vscale < 500) {
			vscale = parseInt(Math.round(vscale / 10.0)) * 10.0;
		} else if (vscale < 2000) {
			vscale = parseInt(Math.round(vscale / 10.0)) * 10.0;
		} else if (vscale < 10000) {
			vscale = parseInt(Math.round(vscale / 100.0)) * 100.0;
		} else if (vscale < 100000) {
			vscale = parseInt(Math.round(vscale / 1000.0)) * 1000.0;
		} else if (vscale < 1000000) {
			vscale = parseInt(Math.round(vscale / 10000.0)) * 10000.0;
		} else {
			vscale = parseInt(Math.round(vscale));
		}
		
		var ctrans = this.transformsQueue.currentTransform;	
		ctrans.setScaleFromCartoScale(vscale, MapCtrlConst.MMPD);
		
		if (this.scalewidgetids.length < 1) {
			this.pendingpubscaleval = true;
		} else {
			this.pendingpubscaleval = false;
			this.pubScaleVal();
		}
	};
	this.getScale = function() {
		var ctrans = this.transformsQueue.currentTransform;	
		if (ctrans) {
			return ctrans.getCartoScaleVal(MapCtrlConst.MMPD);
		} else {
			throw new Error("getScale: no current map tranformation");
		}
	};
	this.getScreenScalingFactor = function() {
		var ttrans = this.transformsQueue.currentTransform;		
		return ttrans.getScaling();
	};
	this.getMaxZIndex = function() 
	{
		return this.getGraphicController().maxzindex;
	};
	this.getLayerTitle = function(p_layername) {
		let ret = "";
		if (this.lconfig[p_layername].labelkey !== undefined && this.lconfig[p_layername].labelkey != null) {
			ret = this.getI18NMsg(this.lconfig[p_layername].labelkey);
		}
		return ret;
	};
	this.updateVisibilityWidget = function() {
		this.style_visibility.updateWidget("LEG", this.getI18NMsgFunc(), this.floatingWidgetsMgr);
	};
	this.clearVisibilityData = function(p_typestr) {
		if (p_typestr == "redraw") {
			this.style_visibility.clearvis(false);
		} else {
			this.style_visibility.clearvis(true);
		}
	};
	this.muteVectors = function(p_do_mute) {
		if (this.dodebug) {
			console.trace("muting vectors:"+p_do_mute);
		}
		this.muted_vectors = p_do_mute;
	};
	this.setBackgroundRasterLyrName = function(p_name) {
		this.rcvctrler.setRasterNames([p_name]);
	};
	this.getBackgroundRasterLyrNames = function(p_outlist) {
		this.rcvctrler.getRasterNames(p_outlist);
	};
	this.clearBackgroundRasterLyrNames = function() {
		this.rcvctrler.clearRasterNames();
	};
	
	this.calcPixSize = function() {
		var ttrans = this.transformsQueue.currentTransform;		
		return 1.0 / ttrans.getScaling();
	};
	
	this.calcInitTransformation = function(p_centerx, p_centery, p_scale) {
		
		//console.log(['calcInitTransformation', p_centerx, p_centery, p_scale]);
		
		var ctrans = this.transformsQueue.currentTransform;		
		var k, hwidth, hheight, cdims = this.getGraphicController().getCanvasDims();
	
		if (this.spatialindexer != null) {
			this.spatialindexer.resize();
		}
		
		ctrans.setScaleFromCartoScale(p_scale, MapCtrlConst.MMPD);
		this.setCenter(p_centerx, p_centery);
		
		/*
		k = ctrans.getScaling();
		console.log('calc init k:'+k);
		hwidth = k * (cdims[0] / 2.0);
		hheight = k * (cdims[1] / 2.0);
		
		ox = p_centerx - hwidth;
		oy = p_centery - hheight;

		ctrans.setTranslating(-ox, -(oy + cdims[1] / k));
		* */
		
		
	};


/** Calculate and store map display transformation, between ground and screen units.
  * Original center of transformation should have been provided previously from map configuration, through readConfig function. 
  * Otherwise it will be undefined.
  * Unless mapextent enveleope is used (opt_env), map scale (this.scale) must have been defined previously, 
  * matrix /  scaling factor will be calculated from this scale value.
  * @this MapController
  * @param {boolean} [opt_forceprepdisp] - (optional) force display canvas initialization, is performed automatically at first invocation.
  * @param {number} [opt_centerx] - (optional) force new x-coord center.
  * @param {number} [opt_centery] - (optional) force new y-coord center.
*/
	this.calcMapTransform = function(opt_env, opt_forceprepdisp)
	{
		var pt=[];
		//var orig=[];
		var scale, hwidth, hheight, cx, cy, cen=[];
		var k, _inv = this.callSequence.calling("calcMapTransform", arguments);
		var currentTransform = this.transformsQueue.currentTransform;
		
		//console.log(['calcMapTransform', opt_env, opt_forceprepdisp]);

		// Intializing and dimensioning canvas - canvas size will be used immediately ahead
		this.getGraphicController().prepDisplay(opt_forceprepdisp);
		var cdims = this.getGraphicController().getCanvasDims();

		if (this.spatialindexer != null) {
			this.spatialindexer.resize();
		}
		
		if (opt_env) {
			
			var whRatioCanvas = cdims[0] / cdims[1];
			var new_env = new Envelope2D();
			new_env.setFromOther(opt_env);
			new_env.getCenter(pt);
			
			cx = pt[0];
			cy = pt[1];

			this.setCenter(cx, cy);		

			this.callSequence.addMsg("calcMapTransform", _inv, "center coords set from env");

			if (new_env.getWHRatio() > whRatioCanvas) {
				k = cdims[0] / new_env.getWidth();
			} else {
				k = cdims[1] / new_env.getHeight();
			}	
			scale = k / (MapCtrlConst.MMPD / 1000.0);	
			
			// Keep scale inside valid threshold
			if (scale < MapCtrlConst.MINSCALE) {
				scale = MapCtrlConst.MINSCALE;
				k = scale * (MapCtrlConst.MMPD / 1000.0);
			}

			currentTransform.setScaling(k);

			hwidth = k * (cdims[0] / 2.0);
			hheight = k * (cdims[1] / 2.0);

		} else {
			
			k = currentTransform.getScaling();
			hwidth = k * (cdims[0] / 2.0);
			hheight = k * (cdims[1] / 2.0);

			this.getCenter(cen);

			cx = cen[0];
			cy = cen[1];
			}
		
		this.prevhdims = [hwidth, hheight];

		
		this.callSequence.addMsg("calcMapTransform", _inv, "screen to terrain matrix is set");

		this.getCenter(cen);
		this.env.setNullAround(cen);
		this.getTerrainPt([0,cdims[1]], pt);
		this.env.addPoint(pt);
		this.getTerrainPt([cdims[0],0], pt)
		this.env.addPoint(pt);
		
		this.getTerrainPt([cdims[0]/2,cdims[1]/2], pt)

		this.callSequence.addMsg("calcMapTransform", _inv, "envelope is set");
		
		this.expandedEnv = new Envelope2D();
		this.expandedEnv.setFromOther(this.env);
		this.expandedEnv.expand(this.dataRetrievalEnvExpandFactor);
		
		this.callSequence.addMsg("calcMapTransform", _inv, String.format("expanded envelope is set, expand factor: {0}",this.dataRetrievalEnvExpandFactor));
	};

/** @this MapController 
  * Refresh map display by retrieving data form server
  * @param {boolean} [opt_forceprepdisp] - (optional) force display canvas initialization, is performed automatically at first invocation.
  * @param {number} [opt_centerx] - (optional) force new x-coord center of map transformation.
  * @param {number} [opt_centery] - (optional) force new y-coord center of map transformation.
*/
	this.refresh = function(opt_forceprepdisp) {
		
		this.callSequence.init("refresh");
		this.onChangeStart("refresh");
		
		// clean perattribute object symbolization indexing
		this.perattribute_indexing.reset();

		var gc = MAPCTRL.getGraphicController();
		if (gc) {
			gc.clearImageMarkers();
		}

		this.calcMapTransform(null, opt_forceprepdisp);
		this.transformsQueue.checkToStore();

		this.prepareRefreshDraw();
	};
	
/** @this MapController 
  * Refresh map display by retrieving data form server
  * @param {number} p_minx - min x coordinate of envelope to be taken as new map extent
  * @param {number} p_miny - min y coordinate of envelope to be taken as new map extent
  * @param {number} p_maxx - max x coordinate of envelope to be taken as new map extent
  * @param {number} p_maxy - max y coordinate of envelope to be taken as new map extent
  * @param {LayerFilter} [opt_filter] - (optional) if present, objects obeying filter criteria will be present, despite being or not inside envelope.
*/
	this.refreshFromMinMax = function(p_minx, p_miny, p_maxx, p_maxy, opt_filter) // opt_expandfactor
	{
		var env = new Envelope2D();
		env.setMinsMaxs(p_minx, p_miny, p_maxx, p_maxy);
		this.calcMapTransform(env);
		this.prepareRefreshDraw(opt_filter);
	};
	
/** @this MapController 
  * Refresh map display by retrieving data form server
  * @param {number} p_scale - force scale value (value of fraction denominator - for 1:1000 scale, value to be given is 1000)
  * @param {number} p_centerx - force x coordinate of display
  * @param {number} p_centery - force y coordinate of display
*/
	this.refreshFromScaleAndCenter = function(p_scale, p_centerx, p_centery) {
		this.setScale(p_scale);
		this.changeCenter(p_centerx, p_centery);
	};
	
/** @this MapController 
  * Redraw: refresh map display by reusing previously loaded data. For internal use.
  * @param {boolean} [opt_forceprepdisp] - (optional) force display canvas initialization, it's performed automatically at first refresh invocation.
  * @param {number} [opt_maxallowed_duration] - (optional) timeout value; when reached, redraw process is stopped (used to prevent screen jagging during redraw in interactive pan or zoom).
  * @param {number} [opt_centerx] - (optional) force new x-coord center of map transformation.
  * @param {number} [opt_centery] - (optional) force new y-coord center of map transformation.
*/
	this.redraw = function(opt_forceprepdisp, opt_nottimed) {
		this.onChangeStart("redraw");
		//console.log([opt_forceprepdisp, opt_centerx, opt_centery]);
		this.calcMapTransform(null, opt_forceprepdisp);
		this._localDraw(opt_nottimed);
	};

	// called by pan tool mouse move method - redraw only
	this.transientPan = function(p_x, p_y, p_start_terrain, p_start_screen) {

		let terrain_pt=[];
		
		this.getTerrainPt([p_x, p_y], terrain_pt);

		let deltax = p_start_terrain[0] - terrain_pt[0];
		let deltay = p_start_terrain[1] - terrain_pt[1];
		
		let deltascrx =  p_x - p_start_screen[0];
		let deltascry =  p_y - p_start_screen[1];

		//console.log([ p_start_terrain[0],  p_start_terrain[1], terrain_pt[0], terrain_pt[1],  deltax, deltay]);

		if (Math.abs(deltascrx) > 1 || Math.abs(deltascry) > 1) {
			//this.scrDiffFromLastSrvResponse.moveCenter(deltascrx, deltascry);
			this.moveCenter(deltax, deltay);
			this.redraw(true);
		}

	};

	// called by pan tool mouse up method - redraw only
	this.finishPan = function(p_x, p_y, p_start_screen) {
		
		let muidx=0, ret = false;
		let deltascrx =  Math.abs(p_start_screen[0] - p_x);
		let deltascry =  Math.abs(p_start_screen[1] - p_y);
		if (deltascrx > 0 || deltascry > 0) {	
			this.refresh(false);	
			this.applyRegisteredsOnPanZoom();			
			ret = true;
		}
		
		return ret;
	};
	
	// called by mousewheel scaling - redraw only
	this.quickChangeScale = function(p_scale, p_pagerefx, p_pagerefy) {
		this._changeScale(p_scale, true, p_pagerefx, p_pagerefy);
		
	}

	// called by discrete zoom in / zoom - with refresh	
	this.changeScale = function(p_scale) {
		cdims = this.getGraphicController().getCanvasDims();
		this._changeScale(p_scale, false, cdims[0]/2, cdims[1]/2);
	}

	// apenas para uso interno
	this._changeScale = function(p_scale, p_redrawonly, opt_centerx, opt_centery) {
		
		var changed = false;
		var cen=[], terrain_refpt_from = [];
		var newx, newy, terrain_refpt_to = [];

		// If opt_centerx and opt_centery were given, lets get terrain coords for
		//  that point
		if (opt_centerx) {
			this.getTerrainPt([opt_centerx, opt_centery], terrain_refpt_from);
		}
		
		if (this.maxscaleview) {
			if (p_scale > this.maxscaleview.scale) {
				this.setScale(this.maxscaleview.scale);	
				changed = true;			
			}
		}
				
		if (!changed) {
			this.setScale(p_scale);
			}

		// If opt_centerx and opt_centery were given, lets get new terrain 
		//  coords for same scrren location, apply coord difference
		//  to a map center shift, so that location keeps same postion
		//  in screen
		if (opt_centerx) {
			this.getTerrainPt([opt_centerx, opt_centery], terrain_refpt_to);		
			this.getCenter(cen);		
			newx = cen[0] + terrain_refpt_from[0] - terrain_refpt_to[0];
			newy = cen[1] + terrain_refpt_from[1] - terrain_refpt_to[1];	
			
			this.setCenter(newx, newy);
		}
		
		if (p_redrawonly) {
			this.redraw(false, true);
		} else {
			this.refresh(false);
			this.applyRegisteredsOnPanZoom();		
		}
	};
	this.changeCenter = function(p_centerx, p_centery)
	{
		if (isNaN(p_centerx)) {
			throw new Error("p_centerx is NaN");
		}
		if (isNaN(p_centery)) {
			throw new Error("p_centery is NaN");
		}

		if (p_centerx == null) {
			throw new Error("p_centerx is null");
		}
		if (p_centery == null) {
			throw new Error("p_centery is null");
		}

		this.setCenter(p_centerx, p_centery);
		
		this.refresh(false);
	};
	this.setCenter = function(p_cx, p_cy) {
	
		var ox, oy, ctrans = this.transformsQueue.currentTransform;		
		var k, hwidth, hheight, fheight, cdims = this.getGraphicController().getCanvasDims();
	
		k = ctrans.getScaling();

		hwidth = (cdims[0] / 2.0) / k;
		fheight = cdims[1] / k;
		hheight = fheight / 2.0;
		
		/*console.log(['814 -- ', k, cdims[0], hwidth, p_cx]);
		console.log(['815 -- ', k, cdims[1], hheight, p_cy]); */
		
		ox = p_cx - hwidth;
		oy = p_cy - hheight;

		//console.log([ox, oy]);

		ctrans.setTranslating(-ox, -(oy + fheight));
		//ctrans.setTranslating(-ox, -oy);
	};
	this.getCenter = function(out_center) {
		
		var out_translate = [];
		var ctrans = this.transformsQueue.currentTransform;
		var k, hwidth, hheight, fheight, cdims = this.getGraphicController().getCanvasDims();
		
		ctrans.getTranslate(out_translate);
	
		k = ctrans.getScaling();
		hwidth = (cdims[0] / 2.0) / k;
		fheight = cdims[1] / k;
		hheight = fheight / 2.0;

		out_center.length = 2;
		out_center[0] = -out_translate[0] + hwidth;
		out_center[1] = -out_translate[1] - fheight  + hheight;
	};	
	this.moveCenter = function(p_deltax, p_deltay)
	{
		var ctrans = this.transformsQueue.currentTransform;		

		if (isNaN(p_deltax)) {
			throw new Error("moveCenter: p_deltax is NaN");
		}
		if (isNaN(p_deltay)) {
			throw new Error("moveCenter: p_deltay is NaN");
		}
		if (p_deltax == null) {
			throw new Error("moveCenter: p_deltax is null");
		}
		if (p_deltay == null) {
			throw new Error("moveCenter: p_deltay is null");
		}
		
		ctrans.translate(-p_deltax, -p_deltay);
	};
	
	this.setZoomTMSLevel = function(p_zoomlvl, opt_cx, opt_cy) {
		let sv = scaleValueFromTMSZoomLevel(p_zoomlvl);
		if (sv == null) {
			throw new Error("setZoomXYTMSLevel -- no scale value for level:"+p_zoomlvl);
		}
		if (opt_cx!=null && opt_cy!=null) {
			this.refreshFromScaleAndCenter(sv, opt_cx, opt_cy);
		}
	};
	
	this.checkPointInsideMap = function(p_terrpt, opt_paddingquot) 
	{
		var ret = false;
		
		if (opt_paddingquot) {
			var env = new Envelope2D();
			env.setFromOther(this.env);
			env.expand(opt_paddingquot);
			ret = env.checkPointIsOn(p_terrpt);
		} else {
			ret = this.env.checkPointIsOn(p_terrpt);
		}
		
		return ret;
	};

	this.getScreenPtFromTerrain = function(p_terrpt_x, p_terrpt_y, out_pt)
	{
		if (p_terrpt_x === null || typeof p_terrpt_x != 'number') {
			throw new Error(this.msg("MISSPARM1X")+p_terrpt_x);
		}
		if (p_terrpt_y === null || typeof p_terrpt_y != 'number') {
			throw new Error(this.msg("MISSPARM1Y")+p_terrpt_y);
		}
		
		var v1=[], v2=[], mx1=[];
		var trans = this.transformsQueue.currentTransform;

		out_pt.length = 2;
		v1 = [parseFloat(p_terrpt_x), parseFloat(p_terrpt_y), 1];
		// get screen coords from current transformation
		trans.getMatrix(mx1);
		m3.vectorMultiply(v1, mx1, v2);
		
		out_pt[0] = v2[0];
		out_pt[1] = v2[1];
	};
	this.getScreenPtFromSrvResponse = function(p_data_x, p_data_y, out_pt, opt_dolog)
	{
		if (p_data_x === null || typeof p_data_x != 'number') {
			throw new Error(this.msg("MISSPARM1X")+p_data_x);
		}
		if (p_data_y === null || typeof p_data_y != 'number') {
			throw new Error(this.msg("MISSPARM1Y")+p_data_y);
		}
		var vy, vx, terr_x, terr_y;

		out_pt.length = 2;
		vx = parseFloat(p_data_x);
		vy = parseFloat(p_data_y);
		
		terr_x = this.lastSrvResponseTransform.cenx + this.lastSrvResponseTransform.pixsz * vx;
		terr_y = this.lastSrvResponseTransform.ceny + this.lastSrvResponseTransform.pixsz * vy;
		
		this.getScreenPtFromTerrain(terr_x, terr_y, out_pt)
		
		if (opt_dolog) {
			console.log(String.format("  x:{0} y:{1}  v:{2}", terr_x, terr_y, JSON.stringify(out_pt)));
		}

	};

	this.getTerrainPt = function(p_scrpt, out_pt)
	{
		if (p_scrpt === null || typeof p_scrpt != 'object' || p_scrpt.length != 2) {
			throw new Error(this.msg("MISSPARM2")+p_scrpt);
		}
		
		var v1=[], v2=[], mx1=[];
		var trans = this.transformsQueue.currentTransform;

		out_pt.length = 2;
		v1 = [parseFloat(p_scrpt[0]), parseFloat(p_scrpt[1]), 1];
		// get terrain coords from the inverse of current transformation
		trans.getInvMatrix(mx1);
		m3.vectorMultiply(v1, mx1, v2);
		
		out_pt[0] = v2[0];
		out_pt[1] = v2[1];
	};
		
	this.readConfig = function(p_initconfig) {
		
		var scalev, tobj, tobj1, baseurl, lblscllims=[];

		if (p_initconfig.servertype === undefined || p_initconfig.servertype == "active") {
			this.activeserver = true;
		} else {
			this.activeserver = false;
		}

		if (p_initconfig.mapname !== undefined) {
			this.mapname = p_initconfig["mapname"];
		}
		
		if (p_initconfig.bgcolor !== undefined) {
			this.bgcolor = p_initconfig["bgcolor"];
		}

		if (p_initconfig.scale !== undefined) {
			scalev = parseFloat(p_initconfig["scale"]);
			this.setScale(scalev);
		} else {
			throw new Error(this.msg("NOSCL"));
		}
		
		if (p_initconfig.maxscaleview) {
			this.maxscaleview = new maxScaleView(p_initconfig.maxscaleview.scale, p_initconfig.maxscaleview.terrain_center);
		}
		
		let tc = getCookie("mapscale");
		if (tc.length < 1) {
			if (p_initconfig.terrain_center !== undefined)
			{			
				tc = p_initconfig["scale"];
				scalev = parseFloat(tc);
				
			} else {	
				throw new Error(this.msg("NOSCL"));			
			}
		} else {
			if (isNaN(parseFloat(tc))) {
				throw new Error(this.msg("INVSCL")+ ":" + tc);
			}
			scalev = parseFloat(tc);
			this.setScale(scalev);
		}
				
		tc = getCookie("terrain_center");
		if (tc.length < 1) {
			if (p_initconfig.terrain_center !== undefined)
			{			
				tobj = p_initconfig["terrain_center"];
				
			} else {	
				throw new Error(this.msg("NOCEN"));			
			}
		} else {
			tobj = tc.split("_");
		}
		
		if (tobj) {
			if (isNaN(parseFloat(tobj[0]))) {
				throw new Error(this.msg("ERRCEN0")+ ":" + tobj[0]);
			}
			if (isNaN(parseFloat(tobj[1]))) {
				throw new Error(this.msg("ERRCEN1")+ ":" + tobj[1]);
			}

			this.calcInitTransformation(parseFloat(tobj[0]), parseFloat(tobj[1]), scalev);
		} else {	
			throw new Error(this.msg("NOCEN"));			
		}
		
		this.vectorexclusive_scales = [-1, -1];
		if (p_initconfig.vectorexclusive) {
			if (p_initconfig.vectorexclusive.permanent !== undefined && p_initconfig.vectorexclusive.permanent == "true") {
				this.vectorexclusive_scales = [-1, 9999999999];
			} else {
				if (p_initconfig.vectorexclusive.scalelimits !== undefined) {
					if (p_initconfig.vectorexclusive.scalelimits.bottom !== undefined) {
						this.vectorexclusive_scales[0] = p_initconfig.vectorexclusive.scalelimits.bottom;
					}
					if (p_initconfig.vectorexclusive.scalelimits.top !== undefined) {
						this.vectorexclusive_scales[1] = p_initconfig.vectorexclusive.scalelimits.top;
					}
				}
			}
		}

		if (p_initconfig.controlssetup !== undefined) {
			if (this.mapctrlsmgr) {
				this.mapctrlsmgr.readConfig(p_initconfig["controlssetup"]);
			}
		}
		
		if (p_initconfig.scalewidgets !== undefined) {
			for (var i=0; i<p_initconfig["scalewidgets"].length; i++) {
				this.registerScaleWidget(p_initconfig["scalewidgets"][i]);
			}
		}

		if (p_initconfig.baseurl !== undefined) {
			this.baseurl = p_initconfig["baseurl"];
		} else {
			throw new Error(this.msg("NOURL"));
		}

		if (!this.activeserver) {
			if (p_initconfig.filename !== undefined) {
				this.filename = p_initconfig.filename;
			}
		}
		
		if (p_initconfig.muted_vectors !== undefined ) {
			this.muted_vectors = p_initconfig["muted_vectors"];
		}

		var foundanylayer = false;
		if (p_initconfig.lnames !== undefined && p_initconfig["lnames"].length > 0) {
			this.lnames = p_initconfig["lnames"];
			this.lnames.reverse();
			foundanylayer = true;
		} else {			
			if (console) {
				console.warn(this.msg("NOVECTLYRS"));
			}
			this.lnames = [];
		}
		
		// Duplicate names not allowed in lnames config
		for (var lni=0; lni<this.lnames.length; lni++) {
			if (this.lnames.indexOf(this.lnames[lni]) != this.lnames.lastIndexOf(this.lnames[lni])) {
				throw new Error(this.msg("DUPLYRNAME") + this.lnames[lni]);
			}
		}

		if (p_initconfig.rasternames !== undefined && p_initconfig["rasternames"].length > 0) {
			this.rasternames = p_initconfig["rasternames"];
			this.rasternames.reverse();
			foundanylayer = true;
		} else {
			this.rasternames = [];
		}
		if (foundanylayer) {
			this.rcvctrler.initialSetLayers(this.lnames, this.rasternames, this.activeserver);
		} else {
			throw new Error(this.msg("NOLYRS"));
		}

		if (this.labelengine) {
			this.labelengine.doConfig(this.lnames, p_initconfig);
		}
		
		if (p_initconfig.lang !== undefined) {
			this.lang = p_initconfig.lang;
		}
		
		if (p_initconfig.i18n_text !== undefined) {
			this.i18n_text = p_initconfig.i18n_text;
		}
		
		let notused_lnames = [];
		let noconfig_lnames = [];
		let nostyle_lnames = [];
		let foundlnames = [];

		// Image pattern config
		if (p_initconfig["fillpatterns"] !== undefined) {
			for (var pname in p_initconfig["fillpatterns"]) {
				if (!p_initconfig["fillpatterns"].hasOwnProperty(pname)) {
					continue;
				}
				if (p_initconfig["fillpatterns"][pname].indexOf('#') == 0) {
					this.fillpatterns[pname] = p_initconfig["fillpatterns"][pname];
				} else {
					this.fillpatterns[pname] = new Image();
					this.fillpatterns[pname].src = p_initconfig["fillpatterns"][pname];
				}
			}
		};
		
		// Layer (vector) config
		if (p_initconfig["lconfig"] !== undefined) {
			
			this.lconfig = p_initconfig["lconfig"];
			var lc, bot, top, dc;
			for (var lname in this.lconfig)
			{
				if (!this.lconfig.hasOwnProperty(lname)) {
					continue;
				}
				
				foundlnames.push(lname);

				if (this.lnames.indexOf(lname) < 0 && this.lconfig[lname]['rasterbaseurl'] === undefined) {
					notused_lnames.push(lname);
				}
				
				dc = this.checkLayerDrawingCondition(lname);
				if (dc == "NOCONFIG") {
					noconfig_lnames.push(lname);
				} else {
					if (dc != "OK" && this.lconfig[lname]['rasterbaseurl'] === undefined && (this.lconfig[lname]['onlydata'] === undefined || !this.lconfig[lname]['onlydata'])) {
						if (dc == "NOSTYLE") {
							nostyle_lnames.push(lname);
						}
					}
				}
								
				bot = 0; top = MapCtrlConst.MAXSCALE_VALUE;
				
				lc = this.lconfig[lname];
				
				// prepare structure for symbology usage statistics
				if (lc.scalelimits !== undefined)
				{
					if (lc.scalelimits["bottom"] !== undefined && lc.scalelimits["bottom"] != null) {
						bot = lc.scalelimits["bottom"];
					} else {
						bot = 0;
					}
					if (lc.scalelimits["top"] !== undefined && lc.scalelimits["top"] != null) {
						top = lc.scalelimits["top"];
					} else {
						top = MapCtrlConst.MAXSCALE_VALUE;
					}					
				}
				
/*
				var maxw_wid, maxw_hei
				if (lc.maxwindow !== undefined) 
				{
					if (lc.maxwindow.width !== undefined || lc.maxwindow.height !== undefined) 
					{
						if (lc.maxwindow.width !== undefined) {
							maxw_wid = lc.maxwindow.width;
						} else {
							maxw_wid = -1;
						}
						if (lc.maxwindow.height !== undefined) {
							maxw_hei = lc.maxwindow.height;
						} else {
							maxw_hei = -1;
						}
						..... setMaxWindowLimits(lname, maxw_wid, maxw_hei);
					}
				}
*/
				
				// ter em conta a visibilidade de etiquetas, especialmente se só existirem etiquetas
				if (this.labelengine && lc.style === undefined) 
				{					
					this.labelengine.getLayerScaleLimits(lname, lblscllims);
					
					if (lblscllims.length > 0) 
					{						
						if (lblscllims[0] > 1 && 
								(this.checkLayerDrawingCondition(lname)!='OK' || 
								 lblscllims[0] < bot)) 
						{
							bot = lblscllims[0];
						} 
						
						if (lblscllims[1] < MapCtrlConst.MAXSCALE_VALUE && 
								(this.checkLayerDrawingCondition(lname)!='OK' || 
								 top < lblscllims[1])) 
						{
							top = lblscllims[1];
						}
					}
				}
				
				if (bot > 1 || top < MapCtrlConst.MAXSCALE_VALUE) {
					this.rcvctrler.setLayerScaleLimits(lname, bot, top);					
				}
			}
		}
		
		if (notused_lnames.length > 0) {
			if (console) {
				console.warn(this.msg("NOTUSEDLYRS") + notused_lnames.join(','));
			}
		}

		if (noconfig_lnames.length > 0) {
			if (console) {
				console.warn(this.msg("NOTCONFIGEDLYRS") + noconfig_lnames.join(','));
			}
		}

		if (nostyle_lnames.length > 0) {
			if (console) {
				console.warn(this.msg("NOTSTYLEDLYRS") + nostyle_lnames.join(','));
			}
		}

		let miss_lyrs = [];
		for (var lni=0; lni<this.lnames.length; lni++) {
			if (foundlnames.indexOf(this.lnames[lni]) < 0) {
				miss_lyrs.push(this.lnames[lni]);
			}
		}
		
		if (miss_lyrs.length > 0) {
			throw new Error(this.msg("MISSLYRS") + miss_lyrs.join(','));
		}
		
		if (p_initconfig.small_scale_source) {
			this.small_scale_source = p_initconfig.small_scale_source;
			var lc = this.getLayerConfig(this.small_scale_source);
			if (lc) {
				if (lc.scalelimits !== undefined && lc.scalelimits.bottom !== undefined) {
					this.small_scale_limit = lc.scalelimits.bottom;
				} else {
					throw new Error(this.msg("MISSSMALLSRCSCALE"));
				}
			} else {
				throw new Error(this.msg("MISSSMALLSRCCFG"));
			}
		}
		
		this.style_visibility = new StyleVisibility(this, p_initconfig);
		if (this.mapctrlsmgr) {
			this.style_visibility.setWidgetId(this.mapctrlsmgr.visibility_widget_name);
		}

	};
	
	this.getLayerConfig = function(p_layername) {
		return this.lconfig[p_layername];
	}

/*
	this.getLayerDefaultStyle = function(p_layername) {
		let ret = null, lc = this.lconfig[p_layername];
		if (lc) {
			if (this.altstylemode) {
				ret = lc['altstyle'];
			} else {
				if (lc['style'] !== undefined) {
					ret = lc['style'];
				} else if (lc['condstyle'] !== undefined && lc['condstyle'] != null && lc['condstyle']['default'] !== undefined) {
					ret = lc['condstyle']['default'];
				}
			}
		}
		
		return ret;
	}
*/

	this.checkLayerDrawingCondition = function(p_layername) 
	{
		var ret = "NOSTYLE";
		var lyrconf = this.getLayerConfig(p_layername);
		if (lyrconf === undefined) {
			ret = "NOCONFIG";
		} else if (lyrconf.style !== undefined ||
					lyrconf.condstyle !== undefined ||
					lyrconf.label !== undefined ||
					lyrconf.markerfunction !== undefined) 
		{
			ret = "OK";
		}
		if (this.do_showLayerDrawingCondition) {
			console.log("checkLayerDrawingCondition layer:"+p_layername+", ret:"+ret);	
		}
		return ret;
	}
	
	this.getDrawableLayerList = function(out_drawable_layer_lst, opt_alllayers_returns_emptylist, opt_include_onlydata) 
	{
		out_drawable_layer_lst.length = 0;
		var scale_vlst = [];
		
		
		if (this.rcvctrler) {
			this.rcvctrler.getVisibleLayersList(this.getScale(), scale_vlst, opt_alllayers_returns_emptylist);
		} else {
			for (var lname in this.lconfig) {
				if (!this.lconfig.hasOwnProperty(lname)) {
					continue;
				}
				scale_vlst.push(this.lconfig[lname]);
			}		
		}
		
		var i = 0;
		while (scale_vlst[i] !== undefined && scale_vlst[i] != null) 
		{
			if (this.lconfig[scale_vlst[i]].onlydata !== undefined && this.lconfig[scale_vlst[i]].onlydata) {
				out_drawable_layer_lst.push(scale_vlst[i]);
			} else {		
				if (this.checkLayerDrawingCondition(scale_vlst[i]) == "OK") {
					out_drawable_layer_lst.push(scale_vlst[i]);
				}
			}
			i++;
		}

		//console.log(out_drawable_layer_lst);

	};
	
	this.getRasterURL = function(p_lname) 
	{	
		if (this.lconfig[p_lname] === undefined) {
			throw new Error(this.msg("MISSLYR")+p_lname);
		}
		if (this.lconfig[p_lname].rasterbaseurl === undefined) {
			throw new Error(this.msg("MISSRASTERLYR")+p_lname);
		}
		return this.lconfig[p_lname].rasterbaseurl;
	}

	this.getStatsURL = function(opt_filter) 
	{
		var ret, sep, formatstr, center=[];
		if (this.baseurl.endsWith("/")) {
			sep = "";
		} else {
			sep = "/";
		}
		// TODO: verificar número de casas decimais
		
		this.getCenter(center);
		
		if (isNaN(this.expandedEnv.getWidth())) {
			throw new Error("getStatsURL - env.getWidth() is NaN");
		}
		if (isNaN(this.expandedEnv.getHeight())) {
			throw new Error("getStatsURL - env.getHeight() is NaN");
		}

		var vizlyrs = [];
		this.getDrawableLayerList(vizlyrs, false);
		
		if (vizlyrs.length > 0) {
			formatstr = "{0}{1}stats?map={2}&cenx={3}&ceny={4}&wid={5}&hei={6}&pixsz={7}&vizlrs={8}";
			ret = String.format(formatstr, this.baseurl, sep, this.mapname, formatFracDigits(center[0], 2),
					formatFracDigits(center[1],2), formatFracDigits(this.expandedEnv.getWidth(),2),
					formatFracDigits(this.expandedEnv.getHeight(),2), formatFracDigits(this.calcPixSize(),6),
					vizlyrs.join(','));			

			if (opt_filter) 
			{
				if (opt_filter.getIsAlternateLayer()) 
				{
					if (vizlyrs.indexOf(opt_filter.getLayerName()) < 0) {
						ret = ret + "&filter="+opt_filter.toURLStr();
					}
				} else {
					ret = ret + "&filter="+opt_filter.toURLStr();
				}
			}
		} else {
			formatstr = "{0}{1}stats?map={2}&cenx={3}&ceny={4}&wid={5}&hei={6}&pixsz={7}";
			ret = String.format(formatstr, this.baseurl, sep, this.mapname, formatFracDigits(this.cx, 2),
					formatFracDigits(this.cy,2), formatFracDigits(this.expandedEnv.getWidth(),2),
					formatFracDigits(this.expandedEnv.getHeight(),2), formatFracDigits(this.calcPixSize(),6));						

			// se o filtro for de 'alternate layer', não poderá ser usado uma vez que todas estão visíveis
			if (opt_filter && !opt_filter.getIsAlternateLayer()) {
				ret = ret + "&filter="+opt_filter.toURLStr();
			}

		}
		
		return ret;
	};

	this.getFeaturesURL = function(p_reqid, p_lname, opt_filter) {

		var ret, sep, formatstr, sclfactor, chunknumbs=[];
		if (this.baseurl.length == 0 || this.baseurl.endsWith("/"))
		{
			sep = "";
		} else {
			sep = "/";
		}


		if (this.activeserver)
		{
			if (this.fanningChunks.length > 0) {
				chunknumbs = this.fanningChunks.pop();
				
				formatstr = "{0}{1}feats?map={2}&reqid={3}&lname={4}&chunks={5}&vertxcnt={6}&chunk={7}";
				ret = String.format(formatstr, this.baseurl, sep, this.mapname, p_reqid, p_lname, chunknumbs[0], chunknumbs[1], chunknumbs[2]);
			} else {
				formatstr = "{0}{1}feats?map={2}&reqid={3}&lname={4}&chunks={5}&vertxcnt={6}";
				ret = String.format(formatstr, this.baseurl, sep, this.mapname, p_reqid, p_lname, chunknumbs[0], chunknumbs[1]);
			}
			sclfactor = this.getScale() / 1000.0;
			// TODO: verificar número de casas decimais
			
			
			if (opt_filter) 
			{
				if (p_lname == opt_filter.getLayerName()) {
					ret = ret + "&filter="+opt_filter.toShortURLStr();
				}
			}
		}
		else
		{
			if (this.lconfig[p_lname] === undefined) {
				throw new Error(this.msg("MISSLYR")+p_lname);
			}
			ret = this.baseurl + sep + this.lconfig[p_lname].fname;
		}
		return ret;
	};

	this.toScreenPoints = function(p_points_obj, p_path_levels, out_screencoords)
	{
		var partcollection, part, outpartc, outpart, pt=[];
		var partc_cnt, part_cnt, crd_cnt;
		var partc_idx, part_idx, crd_idx;
		out_screencoords.length = 0;
		
		switch (p_path_levels) 
		{			
			case 3:
				partc_idx = 0;
				partc_cnt = p_points_obj.length;
				while (partc_idx < partc_cnt) 
				{
					partcollection = p_points_obj[partc_idx];
					outpartc = [];
					part_idx = 0;
					part_cnt = partcollection.length;
					while (part_idx < part_cnt-1) 
					{
						part = partcollection[part_idx];
						crd_idx = 0;
						outpart = [];
						crd_cnt = part.length;
						if (crd_cnt % 2 != 0) {
							throw new Error("Internal error - odd number of coords in toScreenPoints (A)");
						}
						while (crd_idx < crd_cnt) 
						{
							try {
								this.getScreenPtFromSrvResponse(part[crd_idx], part[crd_idx+1], pt);
							} catch(e) {
								console.log("Internal error in toScreenPoints, getScreenPt, path levels 3, part:"+partc_idx+" subpart:"+part_idx+", coord:"+crd_idx);
								throw e;
							}
							outpart.push(pt[0]);
							outpart.push(pt[1]);
							crd_idx+=2;
						}
						outpartc.push(outpart)
						part_idx++;
					}
					out_screencoords.push(outpartc);
					partc_idx++;
				}
				break;

			case 2:
				part_idx = 0;
				part_cnt = p_points_obj.length;
				while (part_idx < part_cnt) 
				{
					part = p_points_obj[part_idx];
					crd_idx = 0;
					outpart = [];
					crd_cnt = part.length;
					if (crd_cnt % 2 != 0) {
						throw new Error("Internal error - odd number of coords in toScreenPoints (B)");
					}
					while (crd_idx < crd_cnt) 
					{
						try {
							this.getScreenPtFromSrvResponse(part[crd_idx], part[crd_idx+1], pt);
						} catch(e) {
							console.log("Internal error in toScreenPoints, getScreenPt, path levels 2, part:"+part_idx+", coord:"+crd_idx);
							throw e;
						}
						outpart.push(pt[0]);
						outpart.push(pt[1]);
						crd_idx+=2;
					}
					out_screencoords.push(outpart)
					part_idx++;
				}
				break;
				
			default:
				crd_idx = 0;
				crd_cnt = p_points_obj.length;
				if (crd_cnt % 2 != 0) {
					throw new Error("Internal error - odd number of coords in toScreenPoints (C) crd_cnt:"+crd_cnt+" p_path_levels:"+p_path_levels);
				}
				while (crd_idx < crd_cnt) 
				{
					try {
						this.getScreenPtFromSrvResponse(p_points_obj[crd_idx], p_points_obj[crd_idx+1], pt);
					} catch(e) {
						console.log("Internal error in toScreenPoints, getScreenPt, path levels 1, coord:"+crd_idx);
						throw e;
					}
					out_screencoords.push(pt[0]);
					out_screencoords.push(pt[1]);
					crd_idx+=2;
				}			
		}
	};

	this.clearFeatureData = function(layername)
	{
		if (layername) {
			this.features[layername] = null;
		} else {
			this.features = {};
			this.globalindex = {};
		}
	};
	
	this.clearImageData = function(rasterlayername)
	{
		if (rasterlayername) 
		{
			this.images[rasterlayername] = null;
			this.imagecounters.reset(rasterlayername);
			if (this.pendingimages[rasterlayername] === undefined) 
			{
				this.pendingimages[rasterlayername] = [];
			} 
			else 
			{
				this.pendingimages[rasterlayername].length = 0;
			}
		} 
		else 
		{
			this.imagecounters.resetAll();
			this.images = {};
			this.pendingimages = {};
		}
	};
	
	this._storeImage = function(p_rastername, p_imgurl, 
						p_terraincoords_ul, p_sizes, p_lvl, p_col, p_row,
						p_objforlatevectordrawing) 
	{
		if (this.images[p_rastername] === undefined || 
			this.images[p_rastername] === null) 
		{
			this.images[p_rastername] = {};
		}

		if (this.pendingimages[p_rastername] === undefined) {
			this.pendingimages[p_rastername] = [];
		}
				
		var rkey = rasterkey(p_lvl, p_col, p_row);
		this.images[p_rastername][rkey] = {
			"elem": new Image(),
			"ulterrain": clone(p_terraincoords_ul),
			"sizes": clone(p_sizes),
			"pyrpos": [p_lvl, p_col, p_row],
			"drawn": false
		};
		
		var storedImgObj = this.images[p_rastername][rkey];
		
		var imgelem = storedImgObj.elem;
		var rastername = p_rastername;
		var lvl = p_lvl;
		var row = p_row;
		var col = p_col;
		var imgc = this.imagecounters;
		
		this.progressMessage(this.msg("RETRIEVINGRASTERS") + " (" + this.imagecounters.toString(p_rastername) + ")");

		imgelem.addEventListener('load', 
			(function(p_self, pp_rastername, pp_objforlatevectordrawing) {
				return function(evt) {
					if (p_self.imagecounters.hasRequests(pp_rastername)) {
						p_self.imagecounters.incrementLoaded(pp_rastername);
						p_self.progressMessage(p_self.msg("RETRIEVINGRASTERS") + " (" + p_self.imagecounters.toString(pp_rastername) + ")");
						p_self._pendingImageLoaded(pp_rastername, lvl, col, row, pp_objforlatevectordrawing);
					}
					if (p_self.imagecounters.allLoaded()) {
						p_self.clearTransient();
					}
				}
			})(this, p_rastername, p_objforlatevectordrawing)
		);

		imgelem.addEventListener('error', 
			(function(p_self, pp_rastername, pp_objforlatevectordrawing) {
				return function(error) {
					if (p_self.imagecounters.hasRequests(pp_rastername)) {
						p_self.imagecounters.decrementRequests(pp_rastername, true);
						p_self.progressMessage(p_self.msg("RETRIEVINGRASTERS") + " (" + p_self.imagecounters.toString(pp_rastername) + ")");
						p_self._removePendingImage(pp_rastername, lvl, col, row, pp_objforlatevectordrawing);
					}
					if (p_self.imagecounters.allLoaded()) {
						p_self.clearTransient();
					}
				}
			})(this, p_rastername, p_objforlatevectordrawing)
		);
			
		storedImgObj.elem.src = p_imgurl;
		
		return storedImgObj;
	};

	// returns true if multipart
	this._storeFeat = function(p_buildarray, p_content_obj, p_layername,
			oidkey, p_cenx, p_ceny, p_pixsz, out_readfc)
	{
		var vi, pi, storedfeatdata, readfc = [0];
		var hasparts = false;
		var currpart = null;
		var storedpart = null;
		var strdpartcnt = 0;
		var hw, hh;
		var tmp_pcol;
		var ondr_ftidx = 0;
		// var path_levels, pth_lvl;

		if (this.features[p_layername] === undefined || this.features[p_layername] === null) 
		{
			if (p_buildarray) {
				this.features[p_layername] = [];
			} else {
				this.features[p_layername] = {};
			}
		}
		
		storedfeatdata = {};
		storedfeatdata.oid = oidkey;
		storedfeatdata.type = p_content_obj.typ;
		storedfeatdata.points = [];
		storedfeatdata.path_levels = 0;

		// TODO: attrs transportados numa lista, lista ordenada dos nomes 
		//   respectivos tem de ser transportada no ínicio da transmissão desde a BD
		storedfeatdata.attrs = {};

		if (p_content_obj.crds !== undefined && p_content_obj.crds != null)
		{
			if (p_content_obj.crds.length == undefined && p_content_obj.crds.length < 1)
			{
				return null;
			}

			// validar geometria
			switch (storedfeatdata.type) 
			{
				case 'point':
					if (p_content_obj.crds.length < 1 || typeof p_content_obj.crds[0] != 'number') {
						throw new Error("_storeFeat -- "+String.format(this.msg("GEOMSTRUCT"), storedfeatdata.type) );
					}
					if (p_content_obj.crds.length < 2) {
						throw new Error("_storeFeat -- "+String.format(this.msg("GEOMMINELEMS"), storedfeatdata.type) );
					}
					storedfeatdata.path_levels = 1;
					break;
					
				case 'line':
					if (p_content_obj.crds.length < 1 || typeof p_content_obj.crds[0] != 'number') {
						throw new Error("_storeFeat -- "+String.format(this.msg("GEOMSTRUCT"), storedfeatdata.type) );
					}
					if (p_content_obj.crds.length < 4) {
						throw new Error("_storeFeat -- "+String.format(this.msg("GEOMMINELEMS"), storedfeatdata.type) );
					}
					storedfeatdata.path_levels = 1;
					break;
					
				case 'mline':
				case 'poly':
					if (p_content_obj.crds.length < 1 || p_content_obj.crds[0].length < 1 || typeof p_content_obj.crds[0][0] != 'number') {
						throw new Error("_storeFeat -- "+String.format(this.msg("GEOMSTRUCT"), storedfeatdata.type) );
					}
					for (var pcoi=0; pcoi<p_content_obj.crds.length; pcoi++) {
						if (p_content_obj.crds[pcoi].length < 4) {
							throw new Error("_storeFeat -- "+String.format(this.msg("GEOMMINELEMS"), storedfeatdata.type) );
						}
					}
					storedfeatdata.path_levels = 2;
					break;
					
				case 'mpoly':
					if (p_content_obj.crds.length < 1 || p_content_obj.crds[0].length < 1 || p_content_obj.crds[0][0].length < 1 || typeof p_content_obj.crds[0][0][0] != 'number') {
						throw new Error("_storeFeat -- "+String.format(this.msg("GEOMSTRUCT"), storedfeatdata.type) );
					}
					for (var pcoib=0; pcoib<p_content_obj.crds.length; pcoib++) 
					{
						tmp_pcol = p_content_obj.crds[pcoib];
						for (var pcoia=0; pcoia<tmp_pcol.length; pcoia++) {
							if (tmp_pcol[pcoia].length < 4) {
								throw new Error("_storeFeat -- "+String.format(this.msg("GEOMMINELEMS"), storedfeatdata.type) );
							}
						}
					}
					storedfeatdata.path_levels = 3;
					break;	
									
				case 'mpoint':
					if (p_content_obj.crds.length < 1) {
						throw new Error("_storeFeat -- "+String.format(this.msg("GEOMSTRUCT"), storedfeatdata.type) );
					} 
					if ( typeof p_content_obj.crds[0] != 'number' && p_content_obj.crds[0].length < 1) {
						throw new Error("_storeFeat -- "+String.format(this.msg("GEOMSTRUCT"), storedfeatdata.type) );
					} 
					if (p_content_obj.crds[0] == 'number') {
						storedfeatdata.path_levels = 1;
					} else {
						storedfeatdata.path_levels = 2;
					}
					break;	
									
				default:
					throw new Error("_storeFeat -- "+String.format(this.msg("UNSUPPORTEDGEOMTYPE"), storedfeatdata.type) );
					
			}			
			
			// as coordenadas das features ficam armazenadas como screen coords
			this.toScreenPoints(p_content_obj.crds, storedfeatdata.path_levels, storedfeatdata.points);
			
			ondr_ftidx = 0;

			if (this.onDrawing_FeatureTransform[ondr_ftidx] !== undefined && this.onDrawing_FeatureTransform[ondr_ftidx] != null) {
				this.onDrawing_FeatureTransform[ondr_ftidx](p_layername, storedfeatdata);
				ondr_ftidx++;
			}		

		}
		else if (p_content_obj.gen !== undefined && p_content_obj.gen != null)
		{
			if (p_content_obj.gen.length !== undefined && p_content_obj.gen.length > 0)
			{
				if (p_content_obj.gen.length > 1) {
					hasparts = true;
				} else {
					hasparts = false;
				}

				for (var gi=0; gi<p_content_obj.gen.length; gi++)
				{
					if (hasparts) {
						strdpartcnt = storedfeatdata.points.push([]);
						storedpart = storedfeatdata.points[strdpartcnt-1];
					} else {
						storedpart = storedfeatdata.points;
					}

					generateGeom(p_content_obj.gen[gi], storedpart, p_cenx, p_ceny, p_pixsz);
				}
			}
		} else {
			console.warn(p_content_obj);
			console.warn("_storeFeat -- "+String.format(this.msg("MISSINGGEOMETRY")) );
			return null;
		}

		if (p_content_obj.a !== undefined && p_content_obj.a != null) {
			storedfeatdata.attrs = clone(p_content_obj.a);
		}

		//this.globalindex

		if (this.lconfig[p_layername].index !== undefined)
		{
			var i, itm, itval, kv, curridxreference, attrname;
			var iks = this.lconfig[p_layername].index.keys;
			var nm = this.lconfig[p_layername].index.name;

			if (this.globalindex[nm] === undefined) {
				this.globalindex[nm] = {};
			}
			curridxreference = this.globalindex[nm];
			for (var jk=0; jk<iks.length; jk++) 
			{
				attrname = iks[jk];
				kv = storedfeatdata.attrs[attrname];
				if (kv === undefined) {
					attrname = iks[jk].toLowerCase();
					kv = storedfeatdata.attrs[attrname];
				}
				if (kv === undefined) {
					console.log([p_layername, attrname]);
					throw new Error(String.format(this.msg("IDXBUILDMISSINGKEY"), nm, iks[jk]));
				}
				if (curridxreference[kv] === undefined) {
					curridxreference[kv] = {};
				}
				
				i = 0;
				while (this.lconfig[p_layername].index.items[i] !== undefined && this.lconfig[p_layername].index.items[i] != null)
				{
					itm = this.lconfig[p_layername].index.items[i];
					if (itm.toLowerCase() == 'oid') {
						itval = oidkey;
						itm = 'oid';
					} else {
						itval = storedfeatdata.attrs[itm];
						if (itval === undefined) {
							itm = itm.toLowerCase();
							itval = storedfeatdata.attrs[itm];
							if (itval === undefined) {
								throw new Error(String.format(this.msg("IDXBUILDMISSINGVAL"), nm, this.lconfig[p_layername].index.items[i]));
							}
						}
					}
					if (curridxreference[kv][itm] === undefined) {
						curridxreference[kv][itm] = [];
					}
					if (curridxreference[kv][itm].indexOf(itval) < 0) {
						curridxreference[kv][itm].push(itval);
					}
					i++;
				}
								
				curridxreference = curridxreference[kv];
			}
			//console.log(JSON.stringify(this.globalindex[nm]));
		}

		out_readfc[0] = out_readfc[0] + 1;

		if (p_buildarray) {
			this.features[p_layername].push(storedfeatdata);
			return this.features[p_layername];
		}
		else
		{
			this.features[p_layername][oidkey] = storedfeatdata;
			return this.features[p_layername][oidkey];
		}
		
	};

	this.setFeatureData = function(layername, data, p_dontdraw_flag,
							p_perattribute_style, p_permode_style, 
							p_markerfunction, p_permodemarker, 
							is_inscreenspace, 
							in_styleflags, opt_displaylayer)
	{
		var pixsz, cenx, ceny, content;
		var content = data.cont;
		//var fc = data.fcnt;
		var ci, readfc = [0], feat, ctrlcnt = 10000;
		//var screencoords = [];
		var drawn = false;
		var inerror = false;
		var dodebug = false; // DEBUG

		// TODO: validar SIGN
		if (data.pxsz == undefined) {
			pixsz = 1.0;
		} else {
			pixsz = data.pxsz;
		}

		if (data.cenx == undefined) {
			cenx = 0.0;
		} else {
			cenx = data.cenx;
		}

		if (data.ceny == undefined) {
			ceny = 0.0;
		} else {
			ceny = data.ceny;
		}

		this.lastSrvResponseTransform.setFromData(data);
		
		//this.scrDiffFromLastSrvResponse.set(this.m);
		
		var content_isarray = Array.isArray(content);

		if (content_isarray)
		{
			ci = 0;
			// TODO: Harmonizar o acesso a array de features com o acesso a dicionário (abaixo)
			while (content[ci] !== undefined && content[ci] != null && ctrlcnt > 0)
			{
				ctrlcnt--;
				if (ctrlcnt <= 0) {
					throw new Error("setFeatureData -- "+this.msg("XXFEATSBYCALL"));
				}
				feat = this._storeFeat(content_isarray, content[ci], layername,
										ci, cenx, ceny, pixsz, readfc);
				if (feat == null) {
					continue;
				}
				
				inerror = false;
				drawn = false;
				if (this.labelengine)
				{
					if (this.labelengine.layerHasLabels(layername))
					{
						if (!p_dontdraw_flag) {
							try {
								this._drawFeature(feat, p_perattribute_style, 
									p_permode_style, p_markerfunction, 
									p_permodemarker, is_inscreenspace,
									layername,in_styleflags.fillStroke, 
									dodebug, opt_displaylayer);
							} catch(e) {
								inerror = true;
							}
							drawn = true;
						}
						this.labelengine.addLabel(layername, feat, feat.points);
					}
				}

				if (!inerror && !drawn && !p_dontdraw_flag)
				{					
					this._drawFeature(feat, p_perattribute_style, 
							p_permode_style, p_markerfunction, 
							p_permodemarker, is_inscreenspace,
							layername,
							in_styleflags, dodebug, opt_displaylayer);
				}

				ci++;
			}
		}
		else
		{
			for (var oidkey in content)
			{
				if (!content.hasOwnProperty(oidkey)) {
					continue;
				}
				feat = this._storeFeat(content_isarray, content[oidkey], layername,
														oidkey, cenx, ceny, pixsz, readfc);
														
				// console.log(feat);

				if (feat == null) {
					continue;
				}

				if (this.trace_oids.length > 0) {
					if (this.trace_oids.indexOf(oidkey) >= 0) {
						dodebug = true;
					}
				}
				
				if (dodebug) {
					console.log(".. existe this.labelengine:"+(this.labelengine!=null));
					console.log(".. layer "+layername+" tem labels:"+this.labelengine.layerHasLabels(layername));
				}

				inerror = false;
				drawn = false;
				if (this.labelengine)
				{
					if (this.labelengine.layerHasLabels(layername))
					{
						if (dodebug) {
							console.log(".. setFeatureData, antes LAYERHASLABELS _drawFeature, feat id:"+oidkey);
						}
						if (!p_dontdraw_flag) 
						{
							try {
								this._drawFeature(feat, p_perattribute_style, p_permode_style, 
										p_markerfunction, p_permodemarker,
										is_inscreenspace, layername, in_styleflags, 
										dodebug, opt_displaylayer);
								drawn = true;
							} catch(e) {
								console.trace(e);
								inerror = true;
							}

						}

						this.labelengine.addLabel(layername, feat, feat.points);
					}
				}

				if (!inerror && !drawn && !p_dontdraw_flag)
				{
					this._drawFeature(feat, p_perattribute_style, p_permode_style, 
							p_markerfunction, p_permodemarker,
							is_inscreenspace, layername, in_styleflags,  
							dodebug, opt_displaylayer);
				}

				if (dodebug) {
					console.log(".. setFeatureData, antes SEGUNDO _drawFeature, feat id:"+oidkey);
				}

				if (this.spatialindexer != null && this.checkLayernameIsIndexable(layername))
				{
					// TODO: mpoint
					switch(feat.type)
					{
						case "mline":
						case "line":
							//this.spatialindexer.addLine(feat.points, feat.path_levels, layername, oidkey);
							this.spatialindexer.addLine(feat.points, feat.path_levels, layername, oidkey);
							break;

						case "point":
							this.spatialindexer.addPoint(feat.points[0], feat.points[1], layername, oidkey);
							break;
							
						case "poly":
						case "mpoly":
							this.spatialindexer.addPoly(feat.points, feat.path_levels, layername, oidkey);

					}
				}

			}
		}

	};

	this.clearTransient = function() {
		this.getGraphicController().clearDisplayLayer('transient');
		this._onTransientClear();
	};
	this.clearTemporary = function() {
		this.getGraphicController().clearDisplayLayer('temporary');
	};
	this.clearDispLayer = function(p_displayername) {
		this.getGraphicController().clearDisplayLayer(p_displayername);
	};

	this.clear = function(p_mode)
	{
		
		if (this.spatialindexer && p_mode != MapCtrlConst.CLEARMODE_RASTER) {
			this.spatialindexer.clear();
		}

		if (p_mode == MapCtrlConst.CLEARMODE_ALL) {
			this.getGraphicController().clearDisplay(this.bgcolor);
		} 
		if (p_mode == MapCtrlConst.CLEARMODE_ALL || p_mode == MapCtrlConst.CLEARMODE_VECTOR) {
			this.getGraphicController().clearDisplayLayer('transient');
			this.getGraphicController().clearDisplayLayer('base');
		} 
		if (p_mode == MapCtrlConst.CLEARMODE_ALL) {
			this.getGraphicController().clearDisplayLayer('raster');
		} else if (p_mode == MapCtrlConst.CLEARMODE_RASTER) {
			this.getGraphicController().clearDisplayLayer('transient');
			this.getGraphicController().clearDisplayLayer('raster');
		}
		
	};
	
	
/** Function called after each image load, for a given named raster layer.
  * When all rasters are loaded and drawn in canvas, late vector drawing is 
  * triggered.
  * @this MapController
  * @param {string} p_rastername - name of raster layer in config.
  * @param {number} p_lvl - raster tile level.
  * @param {number} p_col - raster tile column number.
  * @param {number} p_row - raster tile row number
  * @param {number} p_objforlatevectordrawing - data object for late vector drawing process.
*/
	this._pendingImageLoaded = function(p_rastername, p_lvl, p_col, p_row, p_objforlatevectordrawing) 
	{
		var rasterk = rasterkey(p_lvl, p_col, p_row);
		var idx = -1;
		var doLocalDraw = false;
		if (this.pendingimages[p_rastername] !== undefined && this.pendingimages[p_rastername] != null) {
			idx = this.pendingimages[p_rastername].indexOf(rasterk);
		}

		if (idx >= 0) 
		{
			this.pendingimages[p_rastername].splice(idx, 1);			
		} 
		
		if (this.images[p_rastername] === undefined) {
			throw new Error("Missing raster object collection for "+p_rastername);
		}	
		
		if (this.images[p_rastername][rasterk] === undefined) {
			console.error("Missing raster object for "+p_rastername+", raster key:"+rasterk);
		} else {
			this.drawImageInCanvas(p_rastername, this.images[p_rastername][rasterk]);
			this.images[p_rastername][rasterk].drawn = true;
			if (this.drawnrasters.indexOf(p_rastername) < 0) {
				this.drawnrasters.push(p_rastername);
			}			
		}

		if (this.imagecounters.allLoaded()) {
			// Draw all rasters in the end
			//this.localDrawRasters(-1);
			if (p_objforlatevectordrawing.refresh_vectors)	{						
				this._executeVectorRefreshDraw(MapCtrlConst.DEFAULT_USE_SCREEN_COORD_SPACE, p_objforlatevectordrawing.filteringdata);
			}
		}
	};

	this._removePendingImage = function(p_rastername, p_lvl, p_col, p_row, pp_objforlatevectordrawing) 
	{
		var rasterk = rasterkey(p_lvl, p_col, p_row);
		var doLocalDraw = false;
		var idx = -1;
		if (this.pendingimages[p_rastername] !== undefined && this.pendingimages[p_rastername] != null) {
			idx = this.pendingimages[p_rastername].indexOf(rasterk);
		}

		//console.log(" _pendiImageREM "+this.images[p_rastername].length+" pend:"+this.pendingimages[p_rastername].length+" idx:"+idx);
		if (idx >= 0) 
		{
			this.pendingimages[p_rastername].splice(idx, 1);	
			if (this.images[p_rastername][rasterk] !== undefined && this.images[p_rastername][rasterk] != null) {
				delete this.images[p_rastername][rasterk];
			}	
							
			if (this.pendingimages[p_rastername] == 0) {
				doLocalDraw = true;
			}
		}
		else
		{
			if (this.imagecounters.allLoaded(p_rastername)) {
				doLocalDraw = true;
			}
		}
		
		if (doLocalDraw) {
			this.localDrawRasters(false);
			if (pp_objforlatevectordrawing.refresh_vectors)	{						
				this._executeVectorRefreshDraw(MapCtrlConst.DEFAULT_USE_SCREEN_COORD_SPACE, pp_objforlatevectordrawing.filteringdata);
			}
		}

	};

	this.drawImageInCanvas = function(p_rastername, p_imageelem, opt_force, opt_displaylayer) 
	{		
		if (typeof p_imageelem != 'undefined') 
		{
			var rasterkey = rasterkey_from_pyramid_pos(p_imageelem.pyrpos)
			this.getGraphicController().drawImage(p_imageelem.elem, p_imageelem.ulterrain[0], 
				p_imageelem.ulterrain[1], false, 'lt', p_imageelem.sizes[0], p_imageelem.sizes[1], 
				null, null, opt_displaylayer);

			p_imageelem.drawn = true;
		}		
	};

/*
	this.drawImageInCanvas = function(p_rastername, p_imageelem, opt_force, opt_displaylayer) 
	{		
		if (typeof p_imageelem != 'undefined') 
		{
			var rasterkey = rasterkey_from_pyramid_pos(p_imageelem.pyrpos)
			/* if (p_imageelem.elem.complete || opt_force) 
			{
				
				console.log(p_imageelem.elem.complete + ", force:" + opt_force);
				// If image has loaded, let's draw.
				// Update FEV 2020 - this.drawImage version now awaits for full image load before drawing
				//					Image full load is now doubly guaranteed.
				* */
				//console.log(rasterkey + " compl:" + p_imageelem.elem.complete + ", force:" + opt_force + ", opt_displaylayer:" + opt_displaylayer);
/**				
				this.getGraphicController().drawImage(p_imageelem.elem, p_imageelem.ulterrain[0], 
					p_imageelem.ulterrain[1], false, 'lt', p_imageelem.sizes[0], p_imageelem.sizes[1], 
					null, null, opt_displaylayer);

				p_imageelem.drawn = true;
				****/
			/* } 
			else 
			{
				// wait for full image load, increment pending image load for this rasterlayer
				if (this.pendingimages[p_rastername].indexOf(rasterkey) < 0) {
					this.pendingimages[p_rastername].push(rasterkey);
				}
			} 
		}		
	};
*/
	this.drawFeatureInCanvas = function(p_feature,
			p_dostroke, p_dofill, p_markerf, is_inscreenspace, p_dolog, 
			opt_layername,  
			opt_displaylayer)
	{
		let gtype = "NONE";
		switch (p_feature.path_levels) 
		{
			case 3:
				// TODO: fecho automático de polígnos não fechados
				if (p_dolog) {
					console.log(".. drawFeatureInCanvas, before drawMultiplePathCollection");
				}
				gtype = this.getGraphicController().drawMultiplePathCollection(p_feature.points, p_dostroke, p_dofill, 
					is_inscreenspace, opt_displaylayer, p_dolog);
				break;
				
			case 2:
				if (p_dolog) {
					console.log(".. drawFeatureInCanvas, POLY before drawMultiplePath");
				}
				gtype = this.getGraphicController().drawMultiplePath(p_feature.points, p_dostroke, p_dofill, 
					is_inscreenspace, opt_displaylayer, p_dolog);			
				break;
				
			case 1:
				if (p_dolog) {
					console.log(".. drawFeatureInCanvas, LINE/POINT before drawSimplePath");
				}				
				gtype = this.getGraphicController().drawSimplePath(p_feature.points, p_dostroke, p_dofill, 
					p_markerf, is_inscreenspace, p_dolog, p_feature.oid, p_feature.attrs, opt_displaylayer);			
					
				break;
				
			default:
				throw new Error("Internal error in drawFeatureInCanvas");
		
		}

		return gtype;
	};
	
	/* 12 - opt_noincvizstats - Don't increment viz statistics */
	
	this._drawFeature = function(p_featdata, p_perattribute, p_permode, 
									p_markerfunction, p_permodemarker,
									is_inscreenspace, p_layername,
									out_styleflags, opt_dodebug, 
									opt_displaylayer, opt_noincvizstats)
	{
		var pac, paci, attrval, gtype, tsty;
		//var hasperattribstyle = false;
		var stylechanged = false;
		let markerf = null;
		
		var displaylayer;
		if (opt_displaylayer == null) {
			displaylayer = 'base';
		} else {
			displaylayer = opt_displaylayer;
		}
		
		if (typeof p_featdata == 'undefined' || p_featdata == null) {
			throw new Error("_drawFeature, NULL feature data!");
			return;
		}

		if (typeof out_styleflags == 'undefined' || out_styleflags == null) {
			throw new Error("_drawFeature, null out_styleflags");
			return;
		}

		if (typeof out_styleflags != 'object' || out_styleflags.stroke === undefined) {
			throw new Error("_drawFeature, bad out_styleflags:"+JSON.stringify(out_styleflags)+", typeof: "+(typeof out_styleflags));
			return;
		}

		let lbltitle = "";
		if (this.lconfig[p_layername] !== undefined && this.lconfig[p_layername] != null && 
			this.lconfig[p_layername].name !== undefined && this.lconfig[p_layername].name != null) {
				lbltitle = this.lconfig[p_layername].name;
		}

		if (p_markerfunction!=null) {
			markerf = p_markerfunction;
		} else if (p_permodemarker != null && this.altstylemode != null && p_permodemarker[this.altstylemode] !== undefined) {
			markerf = p_permodemarker[this.altstylemode];
		}

		if (p_permode != null && this.altstylemode != null && p_permode[this.altstylemode] !== undefined) {
			// Conditional styling using "mode-oriented" attributes:
			// <mode> is a key inside "condstyle" dictionary and, 
			// if <mode> is active (string in this.altstylemode), style attributes under <mode>
			// are here applied to the map.
			this.pushStyle(p_permode[this.altstylemode], out_styleflags, displaylayer);
			stylechanged = true;	
		} else if (p_perattribute) {
			// Class-oriented thematic mapping, based on attribute values
			for (var attrname in p_perattribute)
			{
				if (!p_perattribute.hasOwnProperty(attrname)) {
					continue;
				}

				attrval = null; 
				if (p_featdata.attrs[attrname] !== undefined && p_featdata.attrs[attrname] != null)
				{
					attrval = p_featdata.attrs[attrname];
				} else {
					if (p_featdata.attrs[attrname.toLowerCase()] !== undefined && p_featdata.attrs[attrname.toLowerCase()] != null)
					{
						attrval = p_featdata.attrs[attrname.toLowerCase()];
					} else {
						if (p_featdata.attrs[attrname.toUpperCase()] !== undefined && p_featdata.attrs[attrname.toUpperCase()] != null)
						{
							attrval = p_featdata.attrs[attrname.toUpperCase()];
						}
					}
				}

				if (attrval != null || attrname == "_#ALL#_")
				{
					paci = 0;
					while (p_perattribute[attrname][paci] !== undefined && p_perattribute[attrname][paci] != null)
					{
						pac = p_perattribute[attrname][paci];						
						if (attrname == "_#ALL#_") {
							if (pac.style !== undefined && pac.style != null) {
								if (
									pac.f !== undefined && pac.f != null &&
									pac.f(p_featdata.attrs)
								)
								{
									this.pushStyle(pac.style, out_styleflags, displaylayer);
									//this.legend_data.add(p_layername, pac.style);
									stylechanged = true;
								}
							} else {
								if (pac.f !== undefined && pac.f != null) {
									tsty = pac.f(p_featdata.attrs, this.fillpatterns);
									if (typeof tsty == 'object' && tsty != null) {
										this.pushStyle(tsty, out_styleflags, displaylayer);
										//this.legend_data.add(p_layername, pac.style);
										//console.log(tsty);
										stylechanged = true;
										this.perattribute_indexing.addToIndex(p_layername, tsty._index, p_featdata.oid);
									/*} else {
										throw new Error("Bad _#ALL#_ type style config in layer '"+p_layername+"', no style defined and function returns no style object."); */
									}
								}
							}
						} else {						
							if (
								pac.f !== undefined && pac.f != null &&
								pac.style !== undefined && pac.style != null &&
								pac.f(attrval)
							)
							{
								this.pushStyle(pac.style, out_styleflags, displaylayer);
								//this.legend_data.add(p_layername, pac.style);
								stylechanged = true;
							}
						}
						paci++;
					}
				}
			}
		}
		
		
		if ((this.currentStyleExists(displaylayer) && 
			(out_styleflags.stroke || out_styleflags.fill)) || 
			markerf!=null )
		{
			gtype = this.drawFeatureInCanvas(p_featdata, out_styleflags.stroke, 
				out_styleflags.fill, markerf, 
				is_inscreenspace, opt_dodebug, 
				p_layername,
				displaylayer);
				
			//console.log(p_layername+" opt_noincvizstats:"+opt_noincvizstats);
			if (!opt_noincvizstats && this.currentstyle!=null) {
				this.style_visibility.incrementElemStats(gtype, this.currentstyle, p_layername);
			}
							
			//let currstyle = this.styleStack[displaylayer][this.styleStack[displaylayer].length-1]

			if (opt_dodebug) {
				console.log("  .. out_styleflags:"+JSON.stringify(out_styleflags)+" strokestyle:"+this.getGraphicController().getStrokeStyle('temporary'));
				console.log("  .. _drawFeature, depois drawFeatureInCanvas");
			}

		}
		
		if (stylechanged) {
			this.popStyle(out_styleflags, displaylayer);
		}

		//return true;
	};
	
	
	// TODO: FALTA DOC
	this.drawCircle = function(p_cx, p_cy, p_radius, is_inscreenspace, p_styleobj, opt_displaylayer) {

		let styleflags = {};
	
		this.getGraphicController().saveCtx(opt_displaylayer);
		this.applyStyle(p_styleobj, styleflags, opt_displaylayer);
		
		this.getGraphicController().drawCircle(p_cx, p_cy, p_radius, styleflags.stroke, styleflags.fill, is_inscreenspace, opt_displaylayer);

		this.getGraphicController().restoreCtx(opt_displaylayer);
	};
		
	this.drawCrossHairs = function(p_x, p_y, p_size, is_inscreenspace, p_styleobj, opt_rotated, opt_inner_radius, opt_displaylayer) {

		let styleflags = {};
	
		this.getGraphicController().saveCtx(opt_displaylayer);
		this.applyStyle(p_styleobj, styleflags, opt_displaylayer);
		
		if (styleflags.stroke) {
			this.getGraphicController().drawCrossHairs(p_x, p_y, p_size, 
				is_inscreenspace, opt_rotated, opt_inner_radius, opt_displaylayer);	
		} else {
			console.warn("drawCrossHairs required without proper stroke style");
		}

		this.getGraphicController().restoreCtx(opt_displaylayer);
	};


	this.drawSimplePath = function(p_points,   
					is_inscreenspace, p_styleobj, opt_displaylayer, dolog) {

		let styleflags = {};
	
		this.getGraphicController().saveCtx(opt_displaylayer);
		this.applyStyle(p_styleobj, styleflags, opt_displaylayer);

		let markerfunc = null;

		this.getGraphicController().drawSimplePath(p_points, styleflags.stroke, styleflags.fill,  
					markerfunc, is_inscreenspace, dolog, null, null, opt_displaylayer);

		this.getGraphicController().restoreCtx(opt_displaylayer);
	};


	/* activateLayerStyle - activates  
	 * the style defined for a given layer (name passed in *layername*) 
	 * in the active Canvas context or in a context passed in optional 
	 * parameter *opt_displaylayer*.
	 * 
	 * If the layer has *defaultdraw = false*, this function has no effect
	 * and returns FALSE.
	 *   
	 * If *opt_style* carries a preconfigured style, this one is applied
	 * instead of the one read from current layer config.
	 * 
	 * TODO -- COMPLETAR
	 * */
	
	 // this.activateLayerStyle = function(layername, out_styleflags, 
		//		out_return, opt_displaylayer, opt_style)
	 // this.activateLayerStyle = function(layername, out_styleflags, 
		//		out_return, opt_displaylayer)
	this.activateLayerStyle = function(layername, out_return_obj, 
				opt_displaylayer, opt_style, opt_symb_modifier)
	{
		'use strict';
		
		// TODO -- FALTA IMPLEMENTAR opt_symb_modifier 
		var ret = true;
		var p_scale_val, selstyle=null,  dep_rendering_scaleval = null;
		var this_has_bgdependent = false;
		
		if (this.lconfig[layername] === undefined || this.lconfig[layername] == null) {
			throw new Error("activateLayerStyle -- layer not configured:" + layername);
		}

		out_return_obj.fillStroke = {
				stroke: false,
				fill: false
		};
		// antigamente hasstyle
		out_return_obj.activestyle = null;
		out_return_obj.perattribute = null;
		out_return_obj.permode = null;
		out_return_obj.markerfunction = null;
		out_return_obj.permodemarker = null;
		
		if (this.lconfig[layername]["markerfunction"] !== undefined && this.lconfig[layername]["markerfunction"] != null) {
			out_return_obj.markerfunction = this.lconfig[layername]["markerfunction"];
		}
		if (this.lconfig[layername]["permodemarker"] !== undefined && this.lconfig[layername]["permodemarker"] != null) {
			out_return_obj.permodemarker = this.lconfig[layername]["permodemarker"];
		}

		if (opt_style)
		{
			out_return_obj.activestyle = opt_style;
			this.pushStyle(opt_style, out_return_obj.fillStroke, opt_displaylayer);
		} else { 
			if (this.lconfig[layername].defaultdraw !== undefined) {
				ret = this.lconfig[layername].defaultdraw;
			}

			if (!ret) {
				return ret;
			}
			
			if (this.lconfig[layername].style !== undefined) {
				selstyle = clone(this.lconfig[layername].style);
				/*
				// scale dependent rendering
				if (this.lconfig[layername].style.scaledependent !== undefined) 
				{
					for (var cls_scl_val in this.lconfig[layername].style.scaledependent) 
					{
						p_scale_val = this.getScale();
						if (this.lconfig[layername].style.scaledependent.hasOwnProperty(cls_scl_val) && 
							(p_scale_val >= cls_scl_val && (dep_rendering_scaleval == null || cls_scl_val > dep_rendering_scaleval))
							) {
								dep_rendering_scaleval = cls_scl_val;
						}
					}
					
					if (dep_rendering_scaleval != null)
					{
						if (this.lconfig[layername].style.scaledependent[dep_rendering_scaleval] !== undefined) {
							selstyle = this.lconfig[layername].style.scaledependent[dep_rendering_scaleval];
						}
					}
				}
				
				if (selstyle != null) {
					if (this.lconfig[layername].style.backgroundependent !== undefined) {
						var lwcr, lr = [];
						this.rcvctrler.getRasterNames(lr, true);
						for (var bkraster in this.lconfig[layername].style.backgroundependent) {
							if (this.lconfig[layername].style.backgroundependent.hasOwnProperty(bkraster)) {
								lwcr = bkraster.toLowerCase();
								if (lr.indexOf(lwcr) >= 0) {
									if (this.lconfig[layername].style.backgroundependent[bkraster] !== undefined) {
										this_has_bgdependent = true;
										selstyle = this.lconfig[layername].style.backgroundependent[bkraster];
										break;
									}
								}
							}
						}
					}
				}
				
				if (selstyle != null) {				
					if (this.drawnrasters.length > 0 && this.lconfig[layername].style.overraster !== undefined && !this_has_bgdependent) {
						selstyle = this.lconfig[layername].style.overraster;
					}
				}
				*/

				
			} else if (this.lconfig[layername]["condstyle"] !== undefined && this.lconfig[layername]["condstyle"] != null) {
				selstyle = clone(this.lconfig[layername]["condstyle"]["default"]);
				out_return_obj.perattribute = clone(this.lconfig[layername]["condstyle"]["perattribute"]);
				out_return_obj.permode = clone(this.lconfig[layername]["condstyle"]["permode"]);
			}
			
			if (selstyle != null) {
				
				// scale dependent rendering
				if (selstyle.scaledependent !== undefined) 
				{
					for (var cls_scl_val in selstyle.scaledependent) 
					{
						p_scale_val = this.getScale();
						if (selstyle.scaledependent.hasOwnProperty(cls_scl_val) && 
							(p_scale_val >= cls_scl_val && (dep_rendering_scaleval == null || cls_scl_val > dep_rendering_scaleval))
							) {
								dep_rendering_scaleval = cls_scl_val;
						}
					}
					
					if (dep_rendering_scaleval != null)
					{
						if (selstyle.scaledependent[dep_rendering_scaleval] !== undefined) {
							for (var styk in selstyle.scaledependent[dep_rendering_scaleval]) {
								if (selstyle.scaledependent[dep_rendering_scaleval].hasOwnProperty(styk)) {
									selstyle[styk] = selstyle.scaledependent[dep_rendering_scaleval][styk];
								}
							}
						}
					}
				}
				
				// background dependent rendering
				if (selstyle != null) {					
					if (selstyle.backgroundependent !== undefined) {
						var lwcr, lr = [];
						this.rcvctrler.getRasterNames(lr, true);
						for (var bkraster in selstyle.backgroundependent) {
							if (selstyle.backgroundependent.hasOwnProperty(bkraster)) {
								lwcr = bkraster.toLowerCase();
								if (lr.indexOf(lwcr) >= 0) {
									if (selstyle.backgroundependent[bkraster] !== undefined) {
										this_has_bgdependent = true;
										//selstyle = selstyle.backgroundependent[bkraster];
										for (var styk in selstyle.backgroundependent[bkraster]) {
											if (selstyle.backgroundependent[bkraster].hasOwnProperty(styk)) {
												selstyle[styk] = selstyle.backgroundependent[bkraster][styk];
											}
										}
										break;
									}
								}
							}
						}
						delete selstyle.backgroundependent;
					}
				}

				if (this.drawnrasters.length > 0 && selstyle.overraster !== undefined && !this_has_bgdependent) {
					for (var styk in this.lconfig[layername].style.overraster) {
						if (selstyle.overraster.hasOwnProperty(styk)) {
							selstyle[styk] = this.lconfig[layername].style.overraster[styk];
						}
						delete selstyle.overraster;
					}
				}

				out_return_obj.activestyle = selstyle;
				this.pushStyle(selstyle, out_return_obj.fillStroke, opt_displaylayer);
			}
		}

		return ret;

	};

	/*
	this.activateLayerLabelStyle = function(layername, out_styleflags, out_return, opt_displaylayer)
	{
		'use strict';

		out_styleflags.length = 0;
		// default style flags
		out_styleflags.push(true);
		out_styleflags.push(false);

		out_return.length = 2;
		out_return[0] = false;
		out_return[1] = null;

		if (this.lconfig[layername] !== undefined && this.lconfig[layername] != this.lconfig[layername].label !== undefined)
		{
			if (this.lconfig[layername].label.style !== undefined) {
				out_return[0] = true;
				this.pushStyle(this.lconfig[layername].label.style, out_styleflags, opt_displaylayer);
			}
		}
	};*/

	this.getFeature = function(p_layername, p_objid)
	{
		var ret = null;

		if (this.features[p_layername] !== undefined && this.features[p_layername] != null)
		{
			if (this.features[p_layername][p_objid] !== undefined && this.features[p_layername][p_objid] != null) {
				ret = this.features[p_layername][p_objid];
			}
		}

		return ret;
	};

	// opt_markerf_modifier - deverá ter correspondência com um modo / chave de permodemarker
	this.drawSingleFeature = function(p_layername, p_objid, is_inscreenspace,
							opt_displaylayer, opt_style, opt_markerf_modifier,
							b_renderlabel, opt_labelstyle, 
							opt_do_debug)
	{
		'use strict';

		var ldata, out_return = {}, out_return_l = {}, lbl_components=[];
		var dodebug = false; // DEBUG
		var feat;

		ldata = this.features[p_layername];
		if (typeof ldata == 'undefined' || ldata == null) {
			console.warn("drawSingleFeature, NULL ldata for layer:"+p_layername);
			return null;
		}

		if (opt_do_debug) {
			dodebug = opt_do_debug;
		}
		
		this.activateLayerStyle(p_layername, out_return, opt_displaylayer, opt_style);		

		if (ldata[p_objid] !== undefined && ldata[p_objid] != null)
		{
			feat = ldata[p_objid];
			if (opt_markerf_modifier) {
				if (out_return.permodemarker == null || out_return.permodemarker[opt_markerf_modifier] === undefined) {
					console.warn("drawSingleFeature, marker modifier mode '"+opt_markerf_modifier+"' given but no config exists to support it (in permodemarker), layer:"+p_layername);
					return null;
				}
				this._drawFeature(feat, out_return.perattribute, out_return.permode, 
									out_return.permodemarker[opt_markerf_modifier], {},
									is_inscreenspace, p_layername,
									out_return.fillStroke, dodebug,  
									opt_displaylayer, true);
			} else {
				this._drawFeature(feat, out_return.perattribute, out_return.permode, 
									out_return.markerfunction, out_return.permodemarker,
									is_inscreenspace, p_layername,
									out_return.fillStroke, dodebug,  
									opt_displaylayer, true);
			}
		} else {
			console.warn("drawSingleFeature, NULL feature data, key:"+p_objid);
			return null;
		}

		if (out_return.activestyle != null) {
			this.popStyle(out_return.fillStroke, opt_displaylayer);
		}
		
		if (b_renderlabel) {
			var placementt, nxtlbl_exists=false;
		
			this.labelengine.activateLayerStyle(p_layername, out_return_l, opt_displaylayer, opt_labelstyle);

			if (out_return_l.placementtype !== undefined) {
				placementt = out_return_l.placementtype;
			} else {
				throw new Error("drawSingleFeature, no placement type for labels in layer " + p_layername);
				return;
			}
			nxtlbl_exists = this.labelengine.fetchLabel(p_layername, p_objid, lbl_components);

			if (nxtlbl_exists) {
				//console.log([lbl_components[0], lbl_components[1], lbl_components[2], placementt, 
										//out_return.fillStroke, out_return.activestyle, opt_displaylayer]);
				this.labelengine.lbl_gen(lbl_components[0], lbl_components[1], lbl_components[2], placementt, 
										out_return_l.fillStroke, out_return_l.activestyle, is_inscreenspace, 
										opt_displaylayer, dodebug);
			}
			
			if (out_return.activestyle !== undefined && out_return_l.activestyle != null) {
				this.popStyle(out_return_l.fillStroke, opt_displaylayer);
			}

		}

		return feat;
	};

	// drawSingleFeatureFeat method is only for new features persistent between 
	//  redraws and refreshes, not read from server. In order to guarantee 
	//  proper continuous placement, only terrain feat coords are allowed. 
	// Server-emitted features are defined in always correct screen coords,
	//  updated by server methods and changed between refreshes.

	this.drawNewFeature = function(p_layername, p_feat, opt_symb_modifier,
							opt_style, opt_displaylayer, opt_do_debug)
	{
		'use strict';
		var opt = false, out_return = {}, mrkrf;

		if (p_layername == null) {
			throw new Error("drawNewFeature: null layername");
		}
		
		this.activateLayerStyle(p_layername, out_return, opt_displaylayer, opt_style, opt_symb_modifier);

		// mudar isto para dentro de activateLayerStyle
		//console.log(opt_symb_modifier);
		//console.log(out_return);

		if (opt_symb_modifier) {
			if (out_return.permodemarker != null && out_return.permodemarker[opt_symb_modifier] !== undefined) {
				opt = true;
				mrkrf = out_return.permodemarker[opt_symb_modifier];
			} else {
				mrkrf = out_return.markerfunction;
			}
			if (!opt) {
				if (out_return.permode != null && out_return.permode[opt_symb_modifier] !== undefined) {
					opt = true;
					//mrkrf = out_return.permodemarker[opt_symb_modifier];
				} else {
					//mrkrf = out_return.markerfunction;
				}
			}
			if (!opt) {
				console.warn("drawSingleFeature, marker modifier mode '"+opt_markerf_modifier+"' given but no config exists to support it (in permodemarker), layer:"+p_layername);
				return null;
			}
		} else {
			mrkrf = out_return.markerfunction;
		}
		

			this._drawFeature(p_feat, out_return.perattribute, out_return.permode, 
								mrkrf, out_return.permodemarker,
								false, p_layername,
								out_return.fillStroke, opt_do_debug, 
								opt_displaylayer, false);

		if (out_return.hasstyle) {
			this.popStyle(out_return.fillStroke, opt_displaylayer);
		}

		return p_feat;
	};

	this._drawRasterLyr = function(p_rastername, opt_maxallowed_duration, opt_force, opt_displaylayer)
	{
		'use strict';

		var maxallowed_duration, t0, t1, rdata, i=0, dodraw = true, ret=false;
		
		if (opt_maxallowed_duration) {
			maxallowed_duration = opt_maxallowed_duration;
		} else {
			maxallowed_duration = -1;
		}

		if (maxallowed_duration > 0) {
			t0 = Date.now();
		}

		rdata = this.images[p_rastername];
		if (typeof rdata == 'undefined') {
			return false;
		} 
		
		var found = false;
		for (var rk in rdata) {
			found = true;
			break;
		}
		if (!found) {
			return false;
		}

		if (this.lconfig[p_rastername].defaultdraw !== undefined) {
			dodraw = this.lconfig[p_rastername].defaultdraw;
		}

		if (!dodraw) {
			return false;
		}	

		this.imagecounters.resetLoaded(p_rastername);
		
		for (var rkey in rdata) 
		{
			if (!rdata[rkey].drawn)
			{
				this.drawImageInCanvas(p_rastername, rdata[rkey], opt_force, opt_displaylayer);
				ret = true;
				if (maxallowed_duration > 0 ) 
				{
					t1 = Date.now();
					if ((t1-t0) > maxallowed_duration) 
					{
						break;
					}
				}
			}
		}
		
		return ret;		
	};
	
	this.featuresFound = function(layername) {
		
		if (this.features[layername] === undefined) {
			return 0;
		}
		let ldata = this.features[layername];
		if (Array.isArray(ldata))
		{
			return ldata.length;
		} else {
			return Object.keys(ldata).length;
		}

	};

	this.drawLyr = function(layername, is_inscreenspace, p_inittime, 
				out_styleflags, opt_maxallowed_duration, opt_displaylayer)
	{
		'use strict';
		
		var ldata, maxallowed_duration, t0, t1;
		
		var ctrlcnt = 10000;
		var dodebug = false; // DEBUG
		var out_return = {};

		if (this.features[layername] === undefined) {
			return;
		}

		if (opt_maxallowed_duration) {
			maxallowed_duration = opt_maxallowed_duration;
		} else {
			maxallowed_duration = -1;
		}

		t0 = p_inittime;

		ldata = this.features[layername];

		var content_isarray = Array.isArray(ldata);
		if (content_isarray)
		{
			if (ldata.length < 1) {
				return;
			}
		} else {
			if (Object.keys(ldata).length < 1) {
				return;
			}
		}
		
		if (!this.activateLayerStyle(layername, out_return, opt_displaylayer)) {
			return;
		}
		
		if (content_isarray)
		{
			ci = 0;
			while (ldata[ci] !== undefined && ldata[ci] != null && ctrlcnt > 0)
			{
				ctrlcnt--;
				if (ctrlcnt <= 0) {
					throw new Error("drawLyr -- "+this.msg("XXFEATSBYCALL"));
				}

				this._drawFeature(ldata[ci], out_return.perattribute, 
									out_return.permode, out_return.markerfunction , 
									out_return.permodemarker, is_inscreenspace, 
									layername, out_return.fillStroke,
									dodebug, opt_displaylayer);
				ci++;
			}
		}
		else
		{
			for (var oidkey in ldata)
			{
				if (this._cancelCurrentChange) {
					break;
				}

				if (!ldata.hasOwnProperty(oidkey)) {
					continue;
				}
				if (ldata[oidkey] == null) {
					throw new Error("drawLyr, NULL feature data, key:"+oidkey);
					return;
				}

				this._drawFeature(ldata[oidkey], out_return.perattribute, 
						out_return.permode, out_return.markerfunction , 
						out_return.permodemarker, is_inscreenspace, layername, 
						out_return.fillStroke, dodebug, opt_displaylayer);
				if (maxallowed_duration > 0)
				{
						t1 = Date.now();
						if ((t1-t0) > maxallowed_duration) {
							break;
						}
					}
				}
			}

		if (out_return.activestyle != null) {
			this.popStyle(out_return.fillStroke, opt_displaylayer);
		}
		
	};

	this.abortAllRequests = function() {
		
		var the_xhr = this._xhrs.pop();
		while (the_xhr !== undefined) {
			the_xhr.abort();
			the_xhr = this._xhrs.pop();
		}
		this.rcvctrler.reset();
		this.pendingChunks.length = 0;
		this.fanningChunks.length = 0;
		
		// images !!!!
		for (var rnamed in this.images) 
		{
			if (this.images.hasOwnProperty(rnamed)) 
			{
				for (var rkey in this.images[rnamed]) 
				{
					if (this.images[rnamed].hasOwnProperty(rkey)) 
					{
						if (this.images[rnamed][rkey] !== undefined && this.images[rnamed][rkey] != null) 
						{
							imgelem = this.images[rnamed][rkey].elem;
							//console.log("2874: "+rnamed+" "+rkey);
							imgelem.onload = function() {};
							imgelem.onerror = function() {};
							if (!imgelem.complete) {
								imgelem.src = emptyImageURL();
							}
						}
					}
				}
			}
		}
	};

	this._sendReadFeatureRequest = function(p_inscreenspace, opt_filterdata)
	{
		var fclen, chunk, lname, dispname;
		let legend_attrnames = null;
		var dontdraw = false;
		var opt_filter_reference = null;
		var reqid = null;
		//var inscreenspace = true;
		var _inv;
		
		lname = this.rcvctrler.getCurrLayerName();				
		fclen = this.fanningChunks.length;
		
		if (lname != null) {
			_inv = this.callSequence.calling("_sendReadFeatureRequest", arguments);		
			this.callSequence.addMsg("_sendReadFeatureRequest", _inv, String.format("lname: {0}, this.activeserver == {1}", lname, this.activeserver));
		}

		if (this.activeserver)
		{
			if (fclen < 1) {
				return;
			};
			
			reqid = this.rcvctrler.getRequestId();
			this.callSequence.addMsg("_sendReadFeatureRequest", _inv, String.format("request id: {0}", reqid));
				
			if (this.lconfig[lname].name !== undefined) {
				dispname = this.lconfig[lname].name;
			} else {
				dispname = lname;
			}

			if (dispname.length > 0) {
				this.progressMessage(this.msg("RETRIEVINGLAYER")+dispname);
			} else {
				this.progressMessage(this.msg("RETRIEVINGADICELEMS"));
			}

			if (opt_filterdata && 
				!this.checkLayerVisibility(lname)) {
					opt_filter_reference = opt_filterdata;
			} else {
				opt_filter_reference = null;
			}

			for (var pci=1; pci<=fclen; pci++)
			{			
				this.callSequence.addMsg("_sendReadFeatureRequest", _inv, String.format("call server, idx: {0}/{1}", pci, fclen));

				this._xhrs.push(ajaxSender(
					this.getFeaturesURL(reqid, lname, opt_filter_reference),
					(function(p_self) {
						return function() {
							var respdata, _inv1, xhri, activateReturn={};
							if (this.readyState === XMLHttpRequest.DONE)
							{
								_inv1 = p_self.callSequence.calling("_sendReadFeatureRequest_callback", arguments);	
								p_self.callSequence.addMsg("_sendReadFeatureRequest_callback", _inv1, String.format("call server returned, ready==done: {0}, status:{1}, resplen:{2}", (this.readyState==XMLHttpRequest.DONE), this.status, this.responseText.length));
								xhri = p_self._xhrs.indexOf(this);
								if (xhri >= 0) {
									p_self._xhrs.splice(xhri, 1);
								}
								try {
									if (this.status == 200 && this.responseText.length > 10)
									{
										if (p_self.waitingForFirstChunk) {
											p_self.waitingForFirstChunk = false;
											p_self.clearFeatureData(null);
											//p_self.clearImageData(null)
											p_self.clear(MapCtrlConst.CLEARMODE_VECTOR);
										}
										respdata = JSON.parse(this.responseText);
										
										chunk = respdata.chnk;
										p_self.pendingChunks.splice(p_self.pendingChunks.indexOf(chunk) , 1);

										// if no active style or layer not active in TOC, dont draw
										if (!p_self.style_visibility.isLyrTOCVisibilityTrueOrUndef(lname) || !p_self.activateLayerStyle(lname, activateReturn)) {
											dontdraw = true;
										}
										/*if (!p_self.style_visibility.isLyrTOCVisibile(lname)) {
											dontdraw = true;
										}*/
										
										p_self.callSequence.addMsg("_sendReadFeatureRequest_callback", _inv1, String.format("before setFeatureData, layer: {0}, dontdraw: {1}", lname, dontdraw));

										try {
											p_self.setFeatureData(lname, respdata, dontdraw, 
											activateReturn.perattribute, activateReturn.permode, 
											activateReturn.markerfunction, activateReturn.permodemarker, 
											p_inscreenspace, activateReturn.fillStroke, legend_attrnames);
										} catch(e) {
											console.log(".. error in _sendReadFeatureRequest, setFeatureData");
											console.trace(e);
											throw e;
										}

										if (activateReturn.activestyle != null) {
											p_self.popStyle(activateReturn.fillStroke);
										}

										try {
											//if (!p_self.muted_vectors) {
												p_self._retrieveVectorsFromServer(p_inscreenspace, opt_filterdata);
											//}
										} catch(e) {
											console.log(e);
											p_self.onChangeFinish('error 1');
										}
									}
									else
									{
										if (this.responseText.length < 1) {
											p_self.onChangeFinish('error '+this.status+', void response');									
										} else {										
											p_self.onChangeFinish('error '+this.status);
										}
										var resp = this.responseText.toLowerCase();
										if (resp.indexOf("unavailable") >= 0 || resp.indexOf("indispon") >= 0) {
											this.showWarn(String.format(p_self.msg("FSUNAVAILB"), this.status));
										} else {
											if (this.responseText.length > 0) {
												p_self.showWarn(this.responseText);
											}
										}
										p_self.clearTransient();
										p_self.clearTemporary();
									}
								} catch(e) {
									console.log("layer:"+lname);
									console.log(e);
								}
							}
						}
					})(this)
				));
			} // for
		}
		else
		{
			lname = this.rcvctrler.getCurrLayerName();
			if (lname != null)
			{
				this._xhrs.push(ajaxSender(
						this.getFeaturesURL(lname, opt_filter_reference),
						(function(p_self) {
							return function() {
								var respdata, xhri, styleflags=[];
								if (this.readyState === XMLHttpRequest.DONE)
								{
									xhri = p_self._xhrs.indexOf(this);
									if (xhri >= 0) {
										p_self._xhrs.splice(xhri, 1);
									}
									if (this.status == 200 && this.responseText.length > 5)
									{
										respdata = JSON.parse(this.responseText);
										p_self.clearFeatureData(lname);
										p_self.clear(MapCtrlConst.CLEARMODE_VECTOR);

										if(!p_self.activateLayerStyle(lname, activateReturn))
										{
											dontdraw = true;
										}

										p_self.setFeatureData(lname, respdata, dontdraw, 
										activateReturn.perattribute, activateReturn.permode,
										activateReturn.markerfunction, activateReturn.permodemarker, 
										p_inscreenspace, styleflags);
										p_self.drawLyr(lname, true, styleflags, 0, respdata)

										if (activateReturn.activestyle != null) {
											p_self.popStyle(activateReturn.fillStroke);
										}

										try {
											p_self._retrieveFromServer(opt_filterdata);
										} catch(e) {
											console.log(e);
											p_self.onChangeFinish('error 3');
										}
									}
									else
									{
										p_self.onChangeFinish('error 4 len:'+this.responseText.length);
										var resp = this.responseText.toLowerCase();
										if (resp.indexOf("unavailable") >= 0 || resp.indexOf("indispon") >= 0) {
											this.showWarn(String.format(p_self.msg("FSUNAVAILC"), this.status));
										} else {
											if (this.responseText.length > 0) {
												this.showWarn(this.responseText);
											}
										}
										p_self.clearTransient();
										p_self.clearTemporary();
									}

								}
							}
						})(this)
					));
			}
		}
	};

	// Function drawMultiplePathCollection -- draw collection of multiple paths in canvas
	// Input parameters:
	// 	 opt_objforlatevectordrawing: object containing attributes to control vector drawing ocurring after the rasters, here retrieved, are fully drawn
	
	this._retrieveRastersFromServer = function(p_objforlatevectordrawing, b_vectorsexpected)
	{
		// layers raster
		var lconfig = this.lconfig;
		var the_map = this;
		var clrimgflag_obj = [false];

		var _inv = this.callSequence.calling("_retrieveRastersFromServer", arguments);
		
		if (this.rcvctrler.existAnyRasterLayerSpecs()) 
		{
			this.callSequence.addMsg("_retrieveRastersFromServer", _inv, "raster specs DO exist");

			this.rcvctrler.cycleRasterLayerSpecs(			
				function (name, rasterLayerSpecs, the_mapcontroller, the_rcvctrler, clrimflag_ref) 
				{				
					if (!clrimflag_ref[0]) {
						clrimflag_ref[0] = true;
						the_mapcontroller.clearImageData();
					}
					if (the_map.checkLayerVisibility(name)) {
						var baseurl = lconfig[name].rasterbaseurl;
						the_mapcontroller._getMapTiles(name, baseurl, rasterLayerSpecs, p_objforlatevectordrawing);		
					}	
				},
				this,
				this.rcvctrler,
				clrimgflag_obj
			);

		} else {
			this.callSequence.addMsg("_retrieveRastersFromServer", _inv, "raster specs DON'T exist");
			this.clearImageData(null);
		}
		
		if (!b_vectorsexpected) {
			this.onChangeFinish("retrieverasters")
		}
		
	};

	this._retrieveVectorsFromServer = function(p_inscreenspace, opt_filterdata)
	{
		var currnumbs, nchunks, nvert;
		var _inv = this.callSequence.calling("_retrieveVectorsFromServer", arguments);
		this.callSequence.addMsg("_retrieveVectorsFromServer", _inv, "pendchunks:"+this.pendingChunks.length);

		// layers vectoriais
		if (!this.activeserver || this.pendingChunks.length == 0)
		{
			while (true) 
			{
				if (!this.rcvctrler.nextCurrLayer()) 
				{
					this.callSequence.addMsg("_retrieveVectorsFromServer", _inv, "next current layer: NONE");
					this.onChangeFinish('normal', p_inscreenspace);
					break;
				} else if (this.activeserver && this.fanningChunks.length == 0) {

					this.callSequence.addMsg("_retrieveVectorsFromServer", _inv, "fanningChunks.length == 0");

					currnumbs = [];
					this.rcvctrler.getCurrNumbers(currnumbs);
					lname = currnumbs[0];

					this.callSequence.addMsg("_retrieveVectorsFromServer", _inv, "lname == "+lname);
					
					if (lname != null)
					{						
						// scale visibility limits and raster obfuscation both ok
						if (this.checkLayerVisibility(lname))
						{
							nchunks = currnumbs[1];
							nvert = currnumbs[2];
							if (nchunks == null || nvert == null) {
								throw new Error(this.msg("MISSLYRINBDCFG")+lname);
							}
							if (nchunks == 0 || nvert == 0) {
								continue;
							}
							for (var pci=nchunks; pci>=1; pci--) {
								this.fanningChunks.push([nchunks,nvert,pci]);
								this.pendingChunks.push(pci);
							}
							break;
						}
					} else {
						throw new Error("_retrieveFromServer: next current layer name is null");
					}
				} else {

					this.callSequence.addMsg("_retrieveVectorsFromServer", _inv, "this.activeserver == FALSE, breaking");

					break;
				}
			}
		}
		this._sendReadFeatureRequest(p_inscreenspace, opt_filterdata);
	};
	
	this.checkLayerScaleDepVisibility = function(layername) {
		return this.rcvctrler.checkLayerScaleDepVisibility(layername, this.getScale());
	};
	
	this.checkLayerVisibility = function(p_layername, opt_rasternames) {
		
		if (this.lconfig[p_layername] === undefined) {
			throw new Error("checkLayerVisibility, layername "+p_layername+" not found.");
		}
		
		var scldep, mutingfilter, ret = false;
		var rasternames = [];
		
		if (opt_rasternames == null) {
			this.rcvctrler.getRasterNames(rasternames);
		} else {
			rasternames = clone(opt_rasternames);
		}
		
		if (this.lconfig[p_layername].visible === undefined || this.lconfig[p_layername].visible) {		
				
			scldep = this.checkLayerScaleDepVisibility(p_layername);
			if (rasternames.indexOf(p_layername) >= 0) {
				mutingfilter = true;
			} else {
				mutingfilter = (!this.muted_vectors || (this.lconfig[p_layername].allowmuting !== undefined && !this.lconfig[p_layername].allowmuting));
			}
			
			if (scldep && mutingfilter)
			{
				ret = true;			
			}	
			
		}	
		
		//console.trace("checkLayerVisibility"+p_layername+" scld:"+scldep+" mutf:"+mutingfilter);
		
		return ret;
	};

/** @this MapController 
  * Prepare and execute data server request
  * @param {LayerFilter} [opt_filterdata] - (optional) if present, objects obeying filter criteria will be present, despite being or not inside envelope.
*/
	this.prepareRefreshDraw = function(opt_filterdata)
	{
		var _inv = this.callSequence.calling("prepareRefreshDraw", arguments);
		
		if (this._xhrs.length > 0 || this.rcvctrler.currentlyRetrieving()) {
			// Está a decorrer um processo de obtenção de geometrias do servidor
			this.callSequence.addMsg("prepareRefreshDraw", _inv, "aborting previous requests");
			this.abortAllRequests();
		} else {
			this.callSequence.addMsg("prepareRefreshDraw", _inv, "resetting 'retrieve controller'");
			this.rcvctrler.reset();
		}

		var obr_i=0;
		var fobj= this.onBeforeRefresh[obr_i];
		while (fobj !== undefined) 
		{
			fobj(this);
			obr_i++;
			fobj = this.onBeforeRefresh[obr_i];
		}
		
		// Verify that small scale limit was runover and activate small scale themes accordingly
		
		this.callSequence.addMsg("prepareRefreshDraw", _inv, String.format("executed {0} 'on before refresh' functions",obr_i));
		
		this.drawnrasters.length = 0;

		var sclval = this.getScale();
		var t0 = Date.now();

		this.refreshmode = 0;
		this.refreshcapability = 0;
		this.rasterlayersrequested.length = 0;

		this.rcvctrler.clearRasterLayerSpecs();
		if (this.labelengine) {
			this.labelengine.addLabelsInit();
		}
		
		var existVectLayersAtScale = this.rcvctrler.hasVisibleLayersAtThisScale(sclval);
		if (existVectLayersAtScale && (this.rcvctrler.getLayerCount() > 0 || !this.activeserver)) {
			this.refreshmode = MapCtrlConst.REFRESH_VECTORS;
		}
		
		if (this.rcvctrler.getRasterCount() > 0) 
		{
			var i=0, rasternames = [];
			this.rcvctrler.getRasterNames(rasternames);
			
			while (rasternames[i] !== undefined && rasternames[i] != null) 
			{
				if (this.rcvctrler.existRasterLayerSpecs(rasternames[i])) {
					i++;
					continue;
				}

				if (!this.checkLayerVisibility(rasternames[i], rasternames)) {
					i++;
					continue;
				}	
				
				this.refreshmode = this.refreshmode | MapCtrlConst.REFRESH_RASTERS;
				break;			
			}			
		}

		var url;
		
		// se há vectores, pedir estatisticas
		if ((this.refreshmode & MapCtrlConst.REFRESH_VECTORS) == MapCtrlConst.REFRESH_VECTORS) 
		{
			url = this.getStatsURL(opt_filterdata);
			
			this.progressMessage(this.msg("SERVERCONTACTED"));
			
			this.callSequence.addMsg("prepareRefreshDraw", _inv, "fetching vector stats from server");

			this._xhrs.push(ajaxSender(
				url,
				(function(p_self) {
					return function()
					{
						var stats_exist = false;
						if (this.readyState === XMLHttpRequest.DONE)
						{
							try {
								if (this.status == 200 && this.responseText.length > 5)
								{
									respdata = JSON.parse(this.responseText);
									stats_exist = p_self.rcvctrler.setLayersStats(respdata);
									p_self._checkRefreshDraw(MapCtrlConst.REFRESH_VECTORS, opt_filterdata);
								} else {
									if (this.responseText.trim().length == 0) {
										return;
									}
									var resp = this.responseText.toLowerCase();
									if (resp.indexOf("unavailable") >= 0 || resp.indexOf("indispon") >= 0) {
										p_self.showWarn(String.format(p_self.msg("FSUNAVAILA"), this.status));
									} else {
										p_self.showWarn(this.responseText);
									}
									p_self.clearTransient();
									p_self.clearTemporary();
								}
							} catch(e) {
								var useless = null;
								console.log(e);
							}
						}
					}
				})(this)
			));
		}

		// se há rasters pedir specs	
		if ((this.refreshmode & MapCtrlConst.REFRESH_RASTERS) == MapCtrlConst.REFRESH_RASTERS) 
		{
			var k=0, lvl, lvldata, rname, rasternames = [];
			this.rcvctrler.getRasterNames(rasternames);

			this.callSequence.addMsg("prepareRefreshDraw", _inv, "fetching raster specs from server");
			
			while (rasternames[k] !== undefined && rasternames[k] != null) 
			{
				rname = rasternames[k];
				if (this.rcvctrler.existRasterLayerSpecs(rname)) {
					k++;
					continue;
				}

				var sclval = this.getScale();
				if (!this.checkLayerVisibility(rname)) {
					k++;
					continue;
				}	
				
				k++;	
				
				if (this.lconfig[rname] === undefined) {
					this.showWarn(String.format(this.msg("MISSLYRCFG"), rname));
					return;
				}		
				
				rurl1 = this.lconfig[rname].rasterbaseurl;
				if (rurl1.endsWith("/")) {
					sep = "";
				} else {
					sep = "/";
				}
				rurl2 = rurl1 + sep + "specs.json";
				
				lvl = scaleLevelFromScaleValue(sclval);
				
				if (this.rasterlayersrequested.indexOf(rasternames[i]) < 0)
				{
					this.progressMessage(this.msg("SERVERCONTACTED"));
					
					this.rasterlayersrequested.push(rasternames[i]);
					this._xhrs.push(ajaxSender(
						rurl2,
						(function(p_mapctrller) {
							return function()
							{
								var ulvlidx;
								if (this.readyState === XMLHttpRequest.DONE)
								{
									try
									{
										if (this.status == 200 && this.responseText.length > 5)
										{
											respdata = JSON.parse(this.responseText);
											if (respdata.minlevel !== undefined || respdata.maxlevel !== undefined) 
											{
												if (lvl < respdata.minlevel) {
													ulvlidx = 0;
												} else {
													ulvlidx = lvl-respdata.minlevel;
												}
												lvldata = respdata.levels[ulvlidx];
												if (lvldata != null) 
												{
													p_mapctrller.rcvctrler.setRasterLayerSpecs(rname, lvldata, respdata);
												}
												p_mapctrller._checkRefreshDraw(MapCtrlConst.REFRESH_RASTERS, opt_filterdata);
											}
										}
									} catch(e) {
										console.log(e);
										var useless = null;
									}
								}
							};
						})(this)
					));
				}

			}			
		}
						
		var rasterFlag = ((this.refreshmode & MapCtrlConst.REFRESH_RASTERS) == MapCtrlConst.REFRESH_RASTERS);
		if (rasterFlag) {
			for (var rnamea in this.images) 
			{
				if (this.images.hasOwnProperty(rnamea)) 
				{
					for (var rkey in this.images[rnamea]) 
					{
						if (this.images[rnamea][rkey] !== undefined && this.images[rnamea][rkey] != null) {
							this.images[rnamea][rkey].drawn = false;
						}
					}
				}
			}
		}
	}

/** @this MapController 
  * Main object to control map display
  * @returns {string} - String containing class name
*/
	this._checkRefreshDraw = function(p_mode, opt_filterdata)
	{
		this.clearTemporary();
		
		var _inv = this.callSequence.calling("_checkRefreshDraw", arguments);

		if (
			((this.refreshmode & MapCtrlConst.REFRESH_VECTORS) == MapCtrlConst.REFRESH_VECTORS) &&
			((this.refreshcapability & MapCtrlConst.REFRESH_VECTORS) != MapCtrlConst.REFRESH_VECTORS) &&
			((p_mode & MapCtrlConst.REFRESH_VECTORS) == MapCtrlConst.REFRESH_VECTORS)
		) {
			if (this.rcvctrler.existLayerStats()) {
				this.refreshcapability = this.refreshcapability | MapCtrlConst.REFRESH_VECTORS;
			} else {
				// Although vector layers exist in configuration, 
				//   (this.refreshmode == MapCtrlConst.REFRESH_VECTORS)
				// respective stats where not found on server. 
				// Consequentely, we now remove vector option
				// from refresh mode 
				this.refreshmode = this.refreshmode ^ MapCtrlConst.REFRESH_VECTORS;
			}
		}

		if (
			((this.refreshmode & MapCtrlConst.REFRESH_RASTERS) == MapCtrlConst.REFRESH_RASTERS) &&
			((this.refreshcapability & MapCtrlConst.REFRESH_RASTERS) != MapCtrlConst.REFRESH_RASTERS) &&
			((p_mode & MapCtrlConst.REFRESH_RASTERS) == MapCtrlConst.REFRESH_RASTERS)
		) {
			var i = 0;
			var found = true;
			while (this.rasterlayersrequested[i] !== undefined && this.rasterlayersrequested[i] != null) {
				if (!this.rcvctrler.existRasterLayerSpecs(this.rasterlayersrequested[i])) {
					found = false;
					break;
				}
				i++;
			}
			if (found) {
				this.refreshcapability = this.refreshcapability | MapCtrlConst.REFRESH_RASTERS;
			}
		}

		var msgstr = String.format("refresh capability {0} == mode {1}", this.refreshcapability.toString(), this.refreshmode);
		this.callSequence.addMsg("_checkRefreshDraw", _inv, msgstr);
		
		//console.log("this.refreshcapability & this.refreshmode == this.refreshcapability, " + (this.refreshcapability & this.refreshmode) +" == "+ this.refreshcapability + ", mode:" + this.refreshmode);
		if (this.refreshcapability == this.refreshmode) {
			this._executeRefreshDraw(opt_filterdata)
		}
		else {
			this.clearTransient();
		}
	}
	
	this.checkVectorsVisible = function() {
		let vectors_visible = false, visvect=0; v_lyrs = [];
		this.rcvctrler.getLayerNames(v_lyrs);
		for (let li=0; li<v_lyrs.length; li++) {
			if (this.checkLayerVisibility(v_lyrs[li])) {
				visvect++;
			}
		}
		if (visvect > 0) {
			vectors_visible = true;
		}
		return vectors_visible;
	}

	this._executeVectorRefreshDraw = function(p_inscreenspace, opt_filterdata)
	{
		var _inv = this.callSequence.calling("_executeVectorRefreshDraw", arguments);
		
		this.waitingForFirstChunk = true;		
		if (this.activeserver && this.rcvctrler.getLayerCount() > 0)
		{
			// checking muted_vectors is not enough, some themes might
			// have allowmuting = false
			let vectors_visible = this.checkVectorsVisible();
			
			this.callSequence.addMsg("_executeVectorRefreshDraw", _inv, "active server, existing stats:"+this.rcvctrler.existLayerStats()+", muted vectors:"+this.muted_vectors);
			if (this.rcvctrler.existLayerStats()) {
				try {	
					if (!this.rcvctrler.hasAnythingToDraw()) {
						this.progressMessage(this.msg("NOTHINGTODRAW"));
						window.setTimeout(function(){ this.clearTransient(); }, 1000);
					} else if (vectors_visible) {
						this._retrieveVectorsFromServer(p_inscreenspace, opt_filterdata);
					}
				} catch(e) {
					console.log(e);
					this.onChangeFinish('error 5');
				}
			}
		} else {
			try {
				if (vectors_visible) {
					this.callSequence.addMsg("_executeVectorRefreshDraw", _inv, "no active server or zero layers");
					this._retrieveVectorsFromServer(p_inscreenspace, opt_filterdata);
				}
			} catch(e) {
				console.log(e);
				this.onChangeFinish('error 6');
			}

		}
 
	}


/** @this MapController 
  * Main object to control map display
  * @returns {string} - String containing class name
*/
	this._executeRefreshDraw = function(opt_filterdata)
	{

		var _inv = this.callSequence.calling("_executeRefreshDraw", arguments);
		var scale = this.getScale();

		if (this.refreshcapability < 1) {
			throw new Error("no refresh capabilities");
		}
		
		if (this.labelengine) {
			this.labelengine.addLabelsInit();
		}	
		
		this.callSequence.addMsg("_executeRefreshDraw", _inv, "label engine inited");
		
		this.clear(MapCtrlConst.CLEARMODE_ALL);
		this.clearFeatureData(null);
		
		var refresh_vectors = ((this.refreshcapability & MapCtrlConst.REFRESH_VECTORS) == MapCtrlConst.REFRESH_VECTORS);
		var refresh_rasters = ((this.refreshcapability & MapCtrlConst.REFRESH_RASTERS) == MapCtrlConst.REFRESH_RASTERS);
		
		var vectors_exclusive = false;
		if (!this.muted_vectors && scale >= this.vectorexclusive_scales[0] && scale <= this.vectorexclusive_scales[1]) {
			vectors_exclusive = true;
		}
		
		let vectors_visible = false;
		if (refresh_vectors) {
			vectors_visible = this.checkVectorsVisible();
		}

		this.callSequence.addMsg("_executeRefreshDraw", _inv, String.format("refreshing vectors: {0}, rasters: {1}, muted vectors: {2}, vectors exclusive: {3}", refresh_vectors, refresh_rasters, this.muted_vectors, vectors_exclusive));
		
		if (refresh_rasters && !vectors_exclusive) 
		{
			this._retrieveRastersFromServer(
				{
					"refresh_vectors": refresh_vectors,
					"filteringdata": opt_filterdata
				},
				(refresh_vectors && vectors_visible)
			);
		}
		else if (refresh_vectors && vectors_visible) 
		{
			this._executeVectorRefreshDraw(MapCtrlConst.DEFAULT_USE_SCREEN_COORD_SPACE, opt_filterdata);
		}

	}
		
/*
	this._executeVectorRefreshDrawAfterRaster = function(p_sclval, opt_filterdata)
	{
		var refresh_vectors = ((this.refreshcapability & MapCtrlConst.REFRESH_VECTORS) == MapCtrlConst.REFRESH_VECTORS);		
		if (refresh_vectors) 
		{
			this._executeVectorRefreshDraw(MapCtrlConst.DEFAULT_USE_SCREEN_COORD_SPACE, opt_filterdata);
		}
	}

 */

	this.localDrawRasters = function(opt_force, opt_nottimed)
	{
		var i=0, rasternames = [];
		this.rcvctrler.getRasterNames(rasternames);
		
		this.clear(MapCtrlConst.CLEARMODE_RASTER);
		let delay;
		if (opt_nottimed) {
			delay = -1;
		} else {
			delay = MapCtrlConst.ACCPTBLE_LYRREDRAW_DELAY_MSEC;
		}
		
		for (var rnameb in this.images) 
		{
			if (this.images.hasOwnProperty(rnameb)) 
			{				
				for (var rkey in this.images[rnameb]) 
				{
					if (this.images[rnameb][rkey] !== undefined && this.images[rnameb][rkey] != null) {
						this.images[rnameb][rkey].drawn = false;
					}
				}
			}
		}
		
		try 
		{
			while (rasternames[i] !== undefined && rasternames[i] != null) 
			{
				if (this._cancelCurrentChange) {
					break;
				}
				if (this.checkLayerVisibility(rasternames[i]))
				{
					if (this._drawRasterLyr(rasternames[i], delay, opt_force)) {
						if (this.drawnrasters.indexOf(rasternames[i]) < 0) {
							this.drawnrasters.push(rasternames[i]);
						}
					}
				}
				i++;
			}
		} catch(e) {
			console.log(e);
		}
		
	}
	
	// p_maxallowed_duration -- limite tempo disponível, -1 ou null desliga
	this.localDrawFeatures = function(do_clear, opt_nottimed)
	{
		var lname, styleflags = [];
		var t0=0, t1=0;
		if (do_clear) {
			this.clear(MapCtrlConst.CLEARMODE_VECTOR);
		}
		
		let delay;
		if (opt_nottimed) {
			delay = -1;
		} else {
			delay = MapCtrlConst.ACCPTBLE_LYRREDRAW_DELAY_MSEC;
		}

		t0 = Date.now();
		try 
		{
			for (var li=0; li<this.lnames.length; li++)
			{
				if (this._cancelCurrentChange) {
					break;
				}
				
				// avoid drawing layers toggled invisible in TOC
				if (!this.style_visibility.isLyrTOCVisibile(this.lnames[li])) {
					continue;
				}

				this.drawLyr(this.lnames[li], true, t0,  styleflags, delay);
				if (delay > 0) {
					t1 = Date.now();
					if ((t1- t0) > delay) {
						break;
					}
				}
			}
		} catch(e) {
			console.log(e);
		}
	};

	this.drawLabels = function(p_inscreeenspace, p_scale_val, opt_displaylayer)
	{
		var out_return_obj = {}, null_opt_style = null, lblcnt=0, genlbl_out;
		
		if (this.labelengine != null)
		{
			var i = 0;
			while (this.lnames[i] !== undefined && this.lnames[i] != null)
			{
				layername = this.lnames[i];
				i++;
				
				genlbl_out = {};

				// avoid drawing labels for layers toggled invisible in TOC
				if (!this.style_visibility.isLyrTOCVisibile(layername)) {
					continue;
				}

				if (this.labelengine.layerHasLabels(layername))
				{
					if (this.labelengine.activateLayerStyle(layername, out_return_obj, opt_displaylayer, null_opt_style)) {
						lblcnt = this.labelengine.genLabels(p_scale_val, layername, out_return_obj, p_inscreeenspace, genlbl_out, opt_displaylayer);
						//console.log([layername,lblcnt]);
						if (out_return_obj.activestyle != null) {
							/* console.log(">>"+layername);
							console.log(out_return_obj.activestyle); */
							this.style_visibility.incrementElemStats("POINT", out_return_obj.activestyle, layername, genlbl_out.label_count, genlbl_out.sample);
							this.popStyle(out_return_obj.fillStroke, opt_displaylayer);
						}
					}
				}
			}
		}
	};

	this._localDraw = function(opt_nottimed) {
		
		this.drawnrasters.length = 0;

		this._cancelCurrentChange = false;
		
		try {
			this.localDrawRasters(false, opt_nottimed);
			// _cancelCurrentChange can be set during draw raster task
			if (!this._cancelCurrentChange) {
				this.localDrawFeatures(true, opt_nottimed);
			}
			// TODO: repor o desenho de Labels -- não seguia o rato durante o pan
			//this.drawLabels();
		} catch(e) {
			console.log(e);
		}	
		this._onDrawFinish('localdraw');
	};
	
	this.onChangeStart = function(p_typestr) {
		
		//console.log("change start "+p_typestr);
		this.clearVisibilityData(p_typestr);
		
		if (this.mapctrlsmgr) {
			let wdg, wdgname;
			for (let i=0; i<this.mapctrlsmgr.widgetnames_hide_during_refresh.length; i++) {
				wdgname = this.mapctrlsmgr.widgetnames_hide_during_refresh[i];
				wdg = document.getElementById(wdgname);
				if (wdg) {
					wdg.style.visibility = "hidden";
				}
			}
		}
	}

	this.onChangeFinish = function(p_type, p_inscreeenspace, opt_displaylayer)
	{
		var scl = this.getScale();

		if (this.normalFinishModes.indexOf(p_type) >= 0) {
			this.drawLabels(p_inscreeenspace, scl, opt_displaylayer);
		}
		this._onDrawFinish(p_type);
		this.pubScaleVal(scl);

		if (this.mapctrlsmgr) {

			let wdg, wdgname, wdghidsmallscale, insmallscaleview = false;
			wdghidsmallscale = this.mapctrlsmgr.widgetnames_hide_small_scale;

			if (this.small_scale_limit !== undefined && scl > this.small_scale_limit) {
				insmallscaleview = true;
			}
			for (let i=0; i<this.mapctrlsmgr.widgetnames_hide_during_refresh.length; i++) {
				wdgname = this.mapctrlsmgr.widgetnames_hide_during_refresh[i];
				wdg = document.getElementById(wdgname);
				if (wdg) {
					if (this.mapctrlsmgr.widgetnames_hide_small_scale.indexOf(wdgname) >= 0 && insmallscaleview) {
						wdg.style.visibility = "hidden";
					} else {
						wdg.style.visibility = "visible";
					}
				}
			}
		}
				
		this.updateVisibilityWidget();
	};

	this._onDrawFinish = function(p_item)
	{
		this.clearTransient();
		this.clearTemporary();

		// In case drawing process is in error, i.e.: an aborted full refresh, prevent any registered "after draw" functions
		if (p_item != 'normal') {
			this._cancelCurrentChange = false;
			//console.log("        changeEnd a:"+(Date.now()-this._changeStart));
			return;
		}

		var dff;
		for (var dffkey in this.onDrawFinishFuncs)
		{
			if (!this.onDrawFinishFuncs.hasOwnProperty(dffkey)) {
				continue;
			}
			dff = this.onDrawFinishFuncs[dffkey];
			try {
				dff(this, p_item);
			} catch(e) {
				delete this.onDrawFinishFuncs[dffkey];
				this._cancelCurrentChange = false;
				console.warn("key:"+dffkey+" json:"+JSON.stringify(this.onDrawFinishFuncs));
				throw(e);
			}
		}		
		
		dff = this.onDrawFinishTransientFuncs.pop();
		try {
			while (dff !== undefined) {
				dff(this, p_item);
				dff = this.onDrawFinishTransientFuncs.pop();
			}
		} catch(e) {
			this._cancelCurrentChange = false;
			throw(e);
		}

		// editor refresh
		if (this.adic_refresh_func.length > 0) {
			for (var arfi=0; arfi<this.adic_refresh_func.length; arfi++) {
				this.adic_refresh_func[arfi]();
			}
		}
		
		this._cancelCurrentChange = false;
	};

	this._onTransientClear = function()
	{
		var i=0;
		var dff = this.onClearTransientLayer[i];
		while (dff !== undefined) {
			dff(this);
			i++;
			dff = this.onClearTransientLayer[i];
		}
	};

	this.registerOnDrawFinish = function(p_key, p_func, opt_noclobber) {
		if (!opt_noclobber || this.onDrawFinishFuncs[p_key] === undefined) {
			this.onDrawFinishFuncs[p_key] = p_func;
		}
	};

	this.unregisterOnDrawFinish = function(p_key) {
		delete this.onDrawFinishFuncs[p_key];
	};

	this.checkOnDrawFinishRegistry = function(p_key) {
		return (this.onDrawFinishFuncs[p_key] !== undefined);
	};

	this.registerOneTimeOnDrawFinish = function(p_func) {
		this.onDrawFinishTransientFuncs.push(p_func);
	};

	this.registerOnPanZoom = function(p_func) {
		this.onPanZoom.push(p_func);
	};

	this.registerScaleWidget = function (p_widgetid) {
		if (this.scalewidgetids.indexOf(p_widgetid) < 0) {
			this.scalewidgetids.push(p_widgetid);
		}
		if (this.pendingpubscaleval) {
			this.pendingpubscaleval = false;
			this.pubScaleVal();
		}
	};
	
	this.registerOnClearTransientLayer = function(p_func) {
		this.onClearTransientLayer.push(p_func);
	};

	this.registerOnBeforeRefresh = function(p_func) {
		this.onBeforeRefresh.push(p_func);
	}

	this.registerOnDrawing_FeatureTransform = function(p_func) {
		this.onDrawing_FeatureTransform.push(p_func);
	}

	this.applyRegisteredsOnPanZoom = function()  {
		let muidx = 0;
		if (this.onPanZoom[muidx] !== undefined && this.onPanZoom[muidx] != null) {
			this.onPanZoom[muidx]();
			muidx++;
		}
	}
	
// TODO - parâmetros de sobreamento não podem ser aplicados ao ctx, tem de despoletar o desenho de
// um segundo texto desviado 
	// APPLY STYLE NO CANVAS, ISTO CHAMA ESSA NOVA FUNC

	this.applyStyle = function(p_styleobj, out_styleflags, opt_displaylayer)
	{
		let gc = this.getGraphicController();
		if (gc == null) {
			throw new Error("applyStyle: no active graphic controller");
		}
		
		gc.applyStyle(p_styleobj, this.fillpatterns, out_styleflags, opt_displaylayer);
		
	};
	
	this.pushStyle = function(p_styleobj, out_styleflags, opt_displaylayer) {
		if (typeof p_styleobj == 'undefined') {
			throw new Error("pushStyle "+this.msg("NOSTYOBJ"));
		}
		var displaylayer;
		if (opt_displaylayer == null) {
			displaylayer = 'base';
		} else {
			displaylayer = opt_displaylayer;
		}
		if (this.styleStack[displaylayer] === undefined) {
			this.styleStack[displaylayer] = [];
		}
		if (this.styleStack[displaylayer].length == 0 || this.currentstyle == null) {
			this.styleStack[displaylayer].push(
				{
					"strokecolor": this.getGraphicController().getStrokeStyle(displaylayer),
					"fill": this.getGraphicController().getFillStyle(displaylayer),
					"linewidth": this.getGraphicController().getLineWidth(displaylayer),
					"font": this.getGraphicController().getFont(displaylayer),
					"align": this.getGraphicController().getTextAlign(displaylayer),
					"baseline": this.getGraphicController().getBaseline(displaylayer)
				});
		} else {
			this.styleStack[displaylayer].push(clone(this.currentstyle));
		}
		this.currentstyle = clone(p_styleobj);
		// alterar ctx
		this.applyStyle(this.currentstyle, out_styleflags, displaylayer);
	};
	this.popStyle = function(out_styleflags, opt_displaylayer)
	{
		var displaylayer;
		if (opt_displaylayer == null) {
			displaylayer = 'base';
		} else {
			displaylayer = opt_displaylayer;
		}
		if (this.styleStack[displaylayer] === undefined || this.styleStack[displaylayer].length < 1) {
			out_styleflags.length = 0;
			out_styleflags.push(false);
			out_styleflags.push(false);
			return;
		}
		this.currentstyle = this.styleStack[displaylayer].pop();
		if (this.currentstyle == null) {
			throw new Error(this.msg("EMPTYSTY"));
		}
		// alterar ctx
		this.applyStyle(this.currentstyle, out_styleflags, opt_displaylayer);
	};
	this.currentStyleExists = function(opt_displaylayer)
	{
		var displaylayer, ret = false;

		if (opt_displaylayer == null) {
			displaylayer = 'base';
		} else {
			displaylayer = opt_displaylayer;
		}

		if (this.styleStack[displaylayer] !== undefined && this.styleStack[displaylayer] != null) {
			ret = (this.styleStack[displaylayer].length > 0);
		}
		
		return ret;
	};
	this.getCurrentStyle = function(opt_displaylayer)
	{
		var displaylayer, idx, ret = null;

		if (opt_displaylayer == null) {
			displaylayer = 'base';
		} else {
			displaylayer = opt_displaylayer;
		}

		if (this.styleStack[displaylayer] !== undefined && this.styleStack[displaylayer] != null && this.styleStack[displaylayer].length > 0) {
			idx = this.styleStack[displaylayer].length-1;
			ret = this.styleStack[displaylayer][idx];
		}
		
		return ret;
	};
	
	this.grCtrlrMgr = new GraphicControllerMgr(this, p_elemid);
	this.getGraphicController = function(opt_key) {
		return this.grCtrlrMgr.get(opt_key);
	};
	
	this.env = new Envelope2D();
	this.mapctrlsmgr = new MapControlsMgr(this);
	this.rcvctrler = new RetrievalController();
	this.labelengine = new MapLabelEngine(this);
	this.spatialindexer = new SpatialIndexer(this, MapCtrlConst.SPINDEX_STEP);
	
	// Frontend
	this.floatingWidgetsMgr = FloatersAndSelectionsManager;

	this.findNearestObject = function(p_scrx, p_scry, p_layername)
	{
		var ret = [];
		var found = false;
		
		var tol = this.mapctrlsmgr.getTolerance(this.getScale());
		
		var ttrans = this.transformsQueue.currentTransform;		
		var pix_radius;
		
		if(('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)) {
			pix_radius = Math.ceil(2.0 * ttrans.getScaling() * tol); 
			//console.log("triple radius:"+pix_radius);
		}else {
			pix_radius = Math.ceil(ttrans.getScaling() * tol);
			//console.log("single radius:"+pix_radius);
		}

		if (this.spatialindexer) {
			ret = this.spatialindexer.findNearestObject([p_scrx, p_scry], pix_radius, p_layername);
			if (ret.length > 0) {
				found = true;
			}
		}
		
		if (false && found != toggle_found) {
			console.log(String.format("fnd:{0} scr:[{1},{2}] pxrad:{3} rad:{4} lyr:{5}", found, p_scrx, p_scry, pix_radius, p_radius, p_layername));
			toggle_found = found; 
		}
		
		return ret;
	}

	this.setMarkVertexFunc = function(p_func) {
		this.getGraphicController().setMarkVertexFunc(p_func);
	};
	this.setMarkVertices = function(p_flag) {
		this.getGraphicController().setMarkVertices(p_flag);
	};
	this.setMarkMidpointFunc = function(p_func) {
		this.getGraphicController().setMarkMidpointFunc(p_func);
	};
	this.setMarkMidpoints = function(p_flag) {
		this.getGraphicController().setMarkMidpoints(p_flag);
	};

	this.drawFromIndex = function(p_layername, p_ixname, p_keyvalue, in_inscreenspace, opt_displaylayer,
							opt_style, opt_markerf_modifier, b_drawlabel, opt_labelstyle, opt_do_debug)
	{
		var idx_found= true;
		if (this.globalindex[p_ixname] === undefined) {
			console.warn(String.format(this.msg("IDXNOTFOUND"), p_ixname));
			idx_found= false;
		}
		else if (this.globalindex[p_ixname][p_keyvalue] === undefined) {
			console.warn(String.format(this.msg("IDXKEYNOTFOUND"), p_ixname, p_keyvalue));
			idx_found= false;
		}

		var gid, i = 0;
		var oidscol;
		
		if (idx_found) {
			oidscol = this.globalindex[p_ixname][p_keyvalue]["oid"];
			while (oidscol[i] !== undefined && oidscol[i] != null)
			{
				gid = oidscol[i];
				this.drawSingleFeature(p_layername, gid, in_inscreenspace, 
						opt_displaylayer, opt_style, opt_markerf_modifier, b_drawlabel, opt_labelstyle, opt_do_debug);
				i++;
			}
		}
	};
	
	this.getGlobalIndex = function(p_index_name) {
		return this.globalindex[p_index_name];
	};
	
	this.getValueFromGlobalIndex = function(p_ixname, p_keyvalue, p_fieldname) {
		
		if (this.globalindex[p_ixname] === undefined) {
			return null;
		}
		if (this.globalindex[p_ixname][p_keyvalue] === undefined) {
			return null;
		}
		
		return this.globalindex[p_ixname][p_keyvalue][p_fieldname];
		
	};
	
	this._getMapTiles = function(p_rasterlayername, p_baseurl, p_rasterSpecs, p_objforlatevectordrawing, opt_displaylayer) 
	{
		var imgurl, terraincoords=[], scrcoords = [];
		var expandedEnv = this.expandedEnv;
		var _inv = this.callSequence.calling("_getMapTiles", arguments);
	
		// elementos do envelope em coordenadas inteiras (coluna e linha)
		var mincol = Math.floor((expandedEnv.minx - p_rasterSpecs.easting) / 
					p_rasterSpecs.colwidth);
		var maxcol = Math.ceil((expandedEnv.maxx - p_rasterSpecs.easting) / 
					p_rasterSpecs.colwidth);
		var maxrow = Math.ceil((p_rasterSpecs.topnorthing - expandedEnv.miny) / 
					p_rasterSpecs.rowheight);
		var minrow = Math.floor((p_rasterSpecs.topnorthing - expandedEnv.maxy) / 
					p_rasterSpecs.rowheight);					
		
		var cols = maxcol - mincol + 1;
		var rows = maxrow - minrow + 1;
		var tiles = cols * rows;
		
		this.imagecounters.init(p_rasterlayername, tiles);
		this.callSequence.addMsg("_getMapTiles", _inv, String.format("minrow: {0}, mincol: {1}, maxrow: {2}, maxcol: {3}",minrow,mincol,maxrow,maxcol));
		
		var cnt = 0;
				
		for (var col=mincol; col<=maxcol; col++) 
		{
			for (var row=minrow; row<=maxrow; row++) 
			{
				if (col < 0 || row < 0) {
					this.imagecounters.decrementRequests(p_rasterlayername);
					continue;
				}
				
				cnt++;
				
				topLeftCoordsFromRowCol(col, row, p_rasterSpecs, terraincoords);	
				imgurl = String.format("{0}/{1}/{2}/{3}.{4}", p_baseurl, p_rasterSpecs.level, col, row, p_rasterSpecs.outimgext);

				var storedimg = this._storeImage(p_rasterlayername, imgurl, 
					terraincoords, [p_rasterSpecs.colwidth, 
					p_rasterSpecs.rowheight], p_rasterSpecs.level, col, row,
					p_objforlatevectordrawing);
			}	
		}
	};	
	
	this.checkUndrawnRasters = function() 
	{
		var udcount = null;
		for (var rnamec in this.images) 
		{
			if (this.images.hasOwnProperty(rnamec)) 
			{
				for (var rkey in this.images[rnamec]) 
				{
					if (this.images[rnamec].hasOwnProperty(rkey)) {
						if (this.images[rnamec][rkey] !== undefined && this.images[rnamec][rkey] != null) 
						{
							if (udcount === null) {
								udcount = 0;
							}
							if (!this.images[rnamec][rkey].drawn) {
								udcount++;
							};
						}
					}
				}
			}
		}	
		
		return 	udcount;
	};
	
	this.setLayernameAsIndexable = function(p_layername)
	{
		if (this.layernames_to_spatialindex.indexOf(p_layername) < 0) {
			this.layernames_to_spatialindex.push(p_layername);
		}
	};

	this.checkLayernameIsIndexable = function(p_layername)
	{
		ret = false;
		if (this.layernames_to_spatialindex.indexOf(p_layername) >= 0) {
			ret = true;
		}
		return ret;
	};
	
	this.getIndexableLayernames = function()
	{
		return this.layernames_to_spatialindex;
	};
	
	/*
	 * @memberOf MapController
	 */
	this.progressMessage = function(p_msg)
	{

		var txtsz, winsize = {
			width: window.innerWidth || document.body.clientWidth,
		};
		
		var LVL3 = 430;


		// TODO: Externalizar a configuração deste "banner"
		var ctxlyr = 'transient';
		var inscreenspace = true;
		var msg = p_msg;
		this.getGraphicController().saveCtx(ctxlyr);
		this.getGraphicController().clearDisplayLayer(ctxlyr);

		if (winsize.width > LVL3) {
			txtsz = 12;
		} else {
			txtsz = 9;
		}
		this.getGraphicController().setFont(txtsz+"px Arial", ctxlyr);
		var tw = this.getGraphicController().measureTextWidth(msg, ctxlyr);
		var margin, height, mask_offset_y;

		if (winsize.width > LVL3) {
			margin = 40;
			height = 18;
		} else {
			margin = 20;
			height = 15;
		}

		mask_offset_y = height + 1;

		var wid = 2 * margin + tw;
		var mask_y = this.getGraphicController().getCanvasDims()[1]-mask_offset_y;
		var text_y = mask_y + txtsz + 2;


		this.getGraphicController().setFillStyle('rgba(255, 0, 0, 0.5)', ctxlyr);

		this.getGraphicController().drawRect(0, mask_y, wid, height, false, true, inscreenspace, ctxlyr);
		this.getGraphicController().setFillStyle('white', ctxlyr);
		this.getGraphicController().plainText(msg, [margin, text_y], ctxlyr);
		this.getGraphicController().restoreCtx(ctxlyr);
	}

	try {
		this.readConfig(po_initconfig);
	} catch(e) {
		console.log(e);
	}

	// criar controles visiveis
	if (this.mapctrlsmgr) {
		this.mapctrlsmgr.createVisibleControls();
	}

	attEventHandler(this.getGraphicController().getTopCanvasElement(),
			'mousedown',
			(function (p_mapctrlsmgr) {
				return function(e) {
					p_mapctrlsmgr.mousedown(e);
				}
			})(this.mapctrlsmgr)		
	);
	attEventHandler(this.getGraphicController().getTopCanvasElement(),
			'mouseup',
			(function (p_mapctrlsmgr) {
				return function(e) {
					p_mapctrlsmgr.mouseup(e);
				}
			})(this.mapctrlsmgr)		
	);

	window.addEventListener("mousemove", 
		(function (p_mapctrlsmgr) {
			return function(e) {
				p_mapctrlsmgr.mousemove(e);
			}
		})(this.mapctrlsmgr)
	);
	
	attEventHandler(this.getGraphicController().getTopCanvasElement(),
			'mouseleave',
			(function (p_mapctrlsmgr) {
				return function(e) {
					p_mapctrlsmgr.mouseleave(e);
				}
			})(this.mapctrlsmgr)	
	);

	addWheelListener(this.getGraphicController().getTopCanvasElement(),
			(function (p_mapctrlsmgr) {
				return function(e) {
					p_mapctrlsmgr.mouseWheelCtrler.mousewheel(e);
				}
			})(this.mapctrlsmgr)				
	);

	attEventHandler(this.getGraphicController().getTopCanvasElement(),
			'touchstart',
			(function (p_mapctrlsmgr) {
				return function(e) {
					var te = p_mapctrlsmgr.touchController.touchstart(e);
					//console.log('touchstart');
					if (te) {
						// no mouse buttons
						p_mapctrlsmgr.mousedown(te, true);
					}
				}
			})(this.mapctrlsmgr)					
	);

	attEventHandler(this.getGraphicController().getTopCanvasElement(),
			'touchmove',
			(function (p_mapctrlsmgr) {
				return function(e) {
					var te = p_mapctrlsmgr.touchController.touchmove(e);
					//console.log('touchmove');
					if (te) {
						p_mapctrlsmgr.mousemove(te);
					}
				}
			})(this.mapctrlsmgr)					
	);

	attEventHandler(this.getGraphicController().getTopCanvasElement(),
			'touchend',
			(function (p_mapctrlsmgr) {
				return function(e) {
					var te = p_mapctrlsmgr.touchController.touchend(e);
					//console.log('touchend');
					if (te) {
						//console.log('touch end mouseup');
						p_mapctrlsmgr.mouseup(te, p_mapctrlsmgr.touchController.zoomcenter);
					}
				}
			})(this.mapctrlsmgr)					
	);

	/*
	attEventHandler(this.getGraphicController().getTopCanvasElement(),
			'pointerleave',
			(function (p_mapctrlsmgr) {
				return function(e) {
					if (p_mapctrlsmgr.gestureCtrler.pointerup(e)) {
		console.log("pointerleave mouseleave");
						p_mapctrlsmgr.mouseleave(e);
					}
				}
			})(this.mapctrlsmgr)					
	);*/

	attEventHandler(this.getGraphicController().getTopCanvasElement(),
			'touchcancel',
			(function (p_mapctrlsmgr) {
				return function(e) {
					var te = p_mapctrlsmgr.touchController.touchend(e);
					//console.log('touchcancel');
					if (te) {
						p_mapctrlsmgr.mouseup(te);
					}
				}
			})(this.mapctrlsmgr)					
	);

	window.addEventListener("resize", resizeExec(this));

}
