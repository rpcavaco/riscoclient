
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
				"MISSLYRS": "layers ativadas em 'lnames' mas sem configuração",
				"NOSTYOBJ": "objecto inválido",
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
		//var langstr = navigator.language || navigator.userLanguage;
		//var lang = langstr.splice(1,2);
		var lang = "pt";
		return this.i18nmsgs[lang][p_msgkey];
	};
	
	this.dodebug = true;
	
	this.callSequence = new CallSequence(p_debug_callsequence);

	if ( !(this instanceof arguments.callee) )
		throw new Error(this.msg("NONEW"));

	if (p_elemid === null)
		throw new Error(this.msg("NOID"));

	if (po_initconfig === null)
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
	
	this.scale = 1;
	this.m = 1;
	this.cx = null;
	this.cy = null;
	this.ox = 0;
	this.oy = 0;
	this.nx = 0;
	this.ny = 0;
	this.lang = "pt";
	this.i18n_text = null;
	this._terrainToScreenMx = null;
	this._screenToTerrainMx = null;
	this.useMatrix = false;
	this.features = {};
	
	this.images = {};
	this.pendingimages = {};
	this.imagecounters = new rasterLayerCounters();
	
	//this.grController = null;
	this.grCtrlrMgr = null;
	this.mapctrlsmgr = null;
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
	this.altstylemode = false;
	this.lconfig = {};
	this.small_scale_source = null;
	this.globalindex = {};
	this.mapname = null;
	this.bgcolor = null;
	this.env = null;
	this.dataRetrievalEnvExpandFactor = 1.0;
	this.refreshmode = 0;
	this.refreshcapability = 0;
	this.rasterlayersrequested = [];
	this.maxscaleview = null;
	this.drawnrasters = [];
	this.muted_vectors = false;
	this.layernames_to_spatialindex = [];
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
	
	//this.legend_data = new LegendData(this.lconfig);
	this.element_stats = null;
	this.layer_visibility = null;
	
	
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
	
	// scrDiffFromLastSrvResponse: object to retain the differences, 
	//  in linear transformation parameters (translation and scale),
	//  from current mapview to mapview resulting from last server 
	//	response, to be used during dynamic changes like interactive 
	//  panning or zooming.
	
	this.scrDiffFromLastSrvResponse = {
		origcenter: [0,0],
		currcenter: [0,0],
		origm: 1.0,
		m: 1.0,
		set: function(p_mval) {
			this.origcenter = [0,0];
			this.currcenter = [0,0];
			this.origm = p_mval;
			this.m = this.origm;
		},
		moveCenter: function(p_deltaScrX, p_deltaScrY) {
			this.currcenter = [ this.origcenter[0]+p_deltaScrX, this.origcenter[1]+p_deltaScrY ];
		},
		setCenter: function(p_scrX, p_scrY) {
			this.currcenter = [ p_scrX, p_scrY ];
		},
		updateM: function(p_mval) {
			this.m = p_mval;
		},
		getCenterX: function() {
			return this.currcenter[0];
		},
		getCenterY: function() {
			return this.currcenter[1];
		},
		getMRatio: function() {
			return this.m / this.origm;
		},
		scaleFromCenter: function(p_scrX, p_scrY) {
			var ratio =  this.m / this.origm;
			this.currcenter = [ p_scrX * (1-ratio), p_scrY * (1-ratio) ];
		},
		getPt: function(p_x, p_y, outpt) {
			outpt.length = 2;
			outpt[0] = this.getMRatio() * p_x + this.getCenterX();
			outpt[1] = this.getMRatio() * p_y + this.getCenterY();
		}
	}

	this.updateM_scrDiffFromLastSrvResponse = function() {
		this.scrDiffFromLastSrvResponse.updateM(this.m);
	};
	
	this.setScaledCenter_scrDiffFromLastSrvResponse = function(p_scrx, p_scry) {
		
		var dx = p_ptX - this.cx;
		var dy = p_ptY - this.cy;
		var scrpt = [];
		
		var cdims = this.getGraphicController().getCanvasDims();

		var hwidth = (cdims[0] / 2.0) / this.m;
		var hheight = (cdims[1] / 2.0) / this.m;
		
		var newcx = this.cx;
		var newcy = this.cy;

		newcx -= (hwidth * ( dx / this.prevhdims[0])) - dx;
		newcy += dy -(hheight * ( dy / this.prevhdims[1]));
		
		this.getScreenPtFromTerrain(newcx, newcy, scrpt);	
		
		this.scrDiffFromLastSrvResponse.setCenter(scrpt[0], scrpt[1]);

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
	this.pubScaleVal = function() {
		for (var i=0; i<this.scalewidgetids.length; i++) {
			var wid = document.getElementById(this.scalewidgetids[i]);
			if (wid) {
				wid.innerHTML = "1:"+parseInt(this.getScale());
			}
		}
	};
	this.setScale = function(p_scale) 
	{
		if (p_scale === null) {
			throw new Error(this.msg("INVSCL")+p_scale);
		}
		p1_scale = parseFloat(p_scale);
		if (p1_scale <= 0) {
			throw new Error(this.msg("INVSCL")+p1_scale);
		}
		var vscale;
		
		// Arredondar
		if (p1_scale < MapCtrlConst.MINSCALE) {
			vscale = MapCtrlConst.MINSCALE;
		} else {
			vscale = p1_scale;
		}
		
		if (vscale < 100) {
			vscale = parseInt(Math.round(vscale));
		} else if (vscale < 1000) {
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
		
		this.scale = vscale;
		if (this.scalewidgetids.length < 1) {
			this.pendingpubscaleval = true;
		} else {
			this.pendingpubscaleval = false;
			this.pubScaleVal();
		}
	};
	this.getScale = function() {
		return this.scale;
	};
	this.getScreenScalingFactor = function() {
		// TODO: ADAPTAR À TRANSFORMAÇÃO POR MATRIZ
		return this.m;
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
	this.updateLegend = function() {
		//console.log(this.legend_data);
		//this.legend_data.updateLegendWidget("LEG", this.getI18NMsgFunc());
	};
	this.clearLegendData = function() {
		//this.legend_data.clear();
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
		return 1.0 / this.m;
	};

	this._calcTransformFromEnv = function(p_env)
	{
		var k, pt=[], new_env = new Envelope2D(), expfact=1.05;

		new_env.setFromOther(p_env);
		new_env.getCenter(pt);
		this.cx = pt[0];
		this.cy = pt[1];
		
		if (isNaN(this.cx)) {
			throw new Error("_calcTransformFromEnv: this.cx is NaN");
		}
		if (isNaN(this.cy)) {
			throw new Error("_calcTransformFromEnv: this.cy is NaN");
		}

		//new_env.expand(expfact);

		var cdims = this.getGraphicController().getCanvasDims();
		var whRatioCanvas = cdims[0] / cdims[1];
		if (new_env.getWHRatio() > whRatioCanvas) {
			k = new_env.getWidth() / cdims[0];
		} else {
			k = new_env.getHeight() / cdims[1];
		}
		this.m = 1.0 / k;

		this.scale = k / (MapCtrlConst.MMPD / 1000.0);
		
		if (this.scale < MapCtrlConst.MINSCALE) {
			this.scale = MapCtrlConst.MINSCALE;
			k = this.scale * (MapCtrlConst.MMPD / 1000.0);
			this.m = 1.0 / k;
		}

		var hwidth = k * (cdims[0] / 2.0);
		var hheight = k * (cdims[1] / 2.0);
		this.prevhdims = [hwidth, hheight];

		this.ox = this.cx - hwidth;
		this.oy = this.cy - hheight;

		this.ny = (this.oy + cdims[1] * k) / k;
		this.nx = -this.m * this.ox;
		
		//console.log(String.format("  cx:{0}, hw:{1}, ox:{2}, m:{3}, nx:{4}",this.cx,hwidth,this.ox,-this.m,this.nx));

		this._terrainToScreenMx = [
		    this.m, 0, 0,
		    0, -this.m, 0,
		    this.nx, this.ny, 1
		  ];
		this._screenToTerrainMx = m3.inverse(this._terrainToScreenMx);

		this.env.setNullAround([this.cx, this.cy]);

		this.getTerrainPt([0,0], pt)
		this.env.addPoint(pt);
		this.getTerrainPt([cdims[0],0], pt)
		this.env.addPoint(pt);
		this.getTerrainPt([cdims[0],cdims[1]], pt)
		this.env.addPoint(pt);
		this.getTerrainPt([0,cdims[1]], pt)
		this.env.addPoint(pt);
		
		this.expandedEnv = new Envelope2D();
		this.expandedEnv.setFromOther(this.env);
		this.expandedEnv.expand(this.dataRetrievalEnvExpandFactor);
	};

/** Calculate and store map display transformation, between ground and screen units.
  * Original center of transformation should have been provided previously from map configuration, through readConfig function. 
  * Otherwise it will be undefined.
  * @this MapController
  * @param {boolean} [opt_forceprepdisp] - (optional) force display canvas initialization, is performed automatically at first invocation.
  * @param {number} [opt_centerx] - (optional) force new x-coord center.
  * @param {number} [opt_centery] - (optional) force new y-coord center.
*/
	this._calcTransform = function(opt_forceprepdisp, opt_centerx, opt_centery)
	{			
		var _inv = this.callSequence.calling("_calcTransform", arguments);
		
		// Intializing and dimensioning canavas - canvas size will be used immediately ahead
		var pt=[]; k = this.scale * (MapCtrlConst.MMPD / 1000.0);
		this.m = 1.0 / k;
		
		this.getGraphicController().prepDisplay(opt_forceprepdisp);
		
		var cdims = this.getGraphicController().getCanvasDims();

		var hwidth = k * (cdims[0] / 2.0);
		var hheight = k * (cdims[1] / 2.0);

		if (opt_centerx != null && opt_centery != null && this.prevhdims.length > 0)
		{
			var dx = opt_centerx - this.cx;
			var dy = opt_centery - this.cy;

			this.cx -= (hwidth * ( dx / this.prevhdims[0])) - dx;
			this.cy += dy -(hheight * ( dy / this.prevhdims[1]));

			if (isNaN(this.cx)) {
				throw new Error("_calcTransform: this.cx is NaN");
			}
			if (isNaN(this.cy)) {
				throw new Error("_calcTransform: this.cy is NaN");
			}
		}
		
		this.callSequence.addMsg("_calcTransform", _inv, "center coords set");

		this.prevhdims = [hwidth, hheight];

		// this.cx and this.cy contains coordinates of transformation center
		// this.ox and this.oy contains coordinates of display's origin point

		this.ox = this.cx - hwidth;
		this.oy = this.cy - hheight;

		this.ny = (this.oy + cdims[1] * k) / k;
		this.nx = -this.m * this.ox;

		this._terrainToScreenMx = [
		    this.m, 0, 0,
		    0, -this.m, 0,
		    this.nx, this.ny, 1
		  ];
		this._screenToTerrainMx = m3.inverse(this._terrainToScreenMx);

		this.callSequence.addMsg("_calcTransform", _inv, "screen to terrain matrix is set");

		this.env.setNullAround([this.cx, this.cy]);

		this.getTerrainPt([0,0], pt)
		this.env.addPoint(pt);
		this.getTerrainPt([cdims[0],0], pt)
		this.env.addPoint(pt);
		this.getTerrainPt([cdims[0],cdims[1]], pt)
		this.env.addPoint(pt);
		this.getTerrainPt([0,cdims[1]], pt)
		this.env.addPoint(pt);

		this.callSequence.addMsg("_calcTransform", _inv, "envelope is set");
		
		this.expandedEnv = new Envelope2D();
		this.expandedEnv.setFromOther(this.env);
		this.expandedEnv.expand(this.dataRetrievalEnvExpandFactor);

		this.callSequence.addMsg("_calcTransform", _inv, String.format("expanded envelope is set, expand factor: {0}",this.dataRetrievalEnvExpandFactor));

	};
	
	this.multiplyMx = function(p_is_terr2scr, p_op_mx)
	{
		this.useMatrix = true;

		if (p_is_terr2scr) {
			this._terrainToScreenMx = m3.multiply(this._terrainToScreenMx, p_op_mx);
		} else {
			this._screenToTerrainMx = m3.multiply(this._screenToTerrainMx, p_op_mx);
		}

	};

/** @this MapController 
  * Refresh map display by retrieving data form server
  * @param {boolean} [opt_forceprepdisp] - (optional) force display canvas initialization, is performed automatically at first invocation.
  * @param {number} [opt_centerx] - (optional) force new x-coord center of map transformation.
  * @param {number} [opt_centery] - (optional) force new y-coord center of map transformation.
*/
	this.refresh = function(opt_forceprepdisp, opt_centerx, opt_centery) {
		
		this.callSequence.init("refresh");
		this._onChangeStart();

		this._calcTransform(opt_forceprepdisp, opt_centerx, opt_centery);
		this._prepareRefreshDraw();
	};
	
/** @this MapController 
  * Refresh map display by retrieving data form server
  * @param {Envelope2D} p_env - coordinate envelope to be taken as new map extent
  * @param {LayerFilter} [opt_filter] - (optional) if present, objects obeying filter criteria will be present, despite being or not inside envelope.
*/	
	this.refreshFromEnv = function(p_env, opt_filter) {
		this._calcTransformFromEnv(p_env);
		this._prepareRefreshDraw(opt_filter);
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
		this._calcTransformFromEnv(env);
		this._prepareRefreshDraw(opt_filter);
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
	this._redraw = function(opt_forceprepdisp, opt_centerx, opt_centery) {
		this._onChangeStart();
		this._calcTransform(opt_forceprepdisp, opt_centerx, opt_centery);
		this._localDraw();
	};

	// called by pan tool mouse move method - redraw only
	this.transientPan = function(p_x, p_y, p_start_terrain, p_start_screen) {

		let terrain_pt=[];
		
		this.getTerrainPt([p_x, p_y], terrain_pt);

		let deltax = p_start_terrain[0] - terrain_pt[0];
		let deltay = p_start_terrain[1] - terrain_pt[1];
		
		let deltascrx =  p_x - p_start_screen[0];
		let deltascry =  p_y - p_start_screen[1];

		if (Math.abs(deltascrx) > 1 || Math.abs(deltascry) > 1) {
			this.scrDiffFromLastSrvResponse.moveCenter(deltascrx, deltascry);
			this.moveCenter(deltax, deltay);
			this._redraw(true);
		}

	};

	// called by pan tool mouse up method - redraw only
	this.finishPan = function(p_x, p_y, p_start_terrain, p_start_screen) {

		let muidx=0, terrain_pt=[], ret = false;

		this.getTerrainPt([p_x, p_y], terrain_pt);
		
		let deltascrx =  Math.abs(p_start_screen[0] - p_x);
		let deltascry =  Math.abs(p_start_screen[1] - p_y);
		
		let deltax =  p_start_terrain[0] - terrain_pt[0];
		let deltay =  p_start_terrain[1] - terrain_pt[1];	
		
		if (deltascrx > 1 && deltascry > 1) {	
					
			this.moveCenter(deltax, deltay);
			this.refresh(false);	
			
			if (this.onPanZoom[muidx] !== undefined && this.onPanZoom[muidx] != null) {
				this.onPanZoom[muidx]();
				muidx++;
			}
			
			ret = true;
		}
		
		return ret;
	};
	
	// called by mousewheel scaling - redraw only
	this.quickChangeScale = function(p_scale, p_pagerefx, p_pagerefy) {

		var terrain_pt = [];
		
		this.getTerrainPt([p_pagerefx, p_pagerefy], terrain_pt);		
		
		this.updateM_scrDiffFromLastSrvResponse();
		this.scrDiffFromLastSrvResponse.scaleFromCenter(p_pagerefx, p_pagerefy);
		this._changeScale(p_scale, true, terrain_pt[0], terrain_pt[1]);
		
	}

	// called by discrete zoom in / zoom - with refresh	
	this.changeScale = function(p_scale) {
		this._changeScale(p_scale, false);
	}

	// apenas para uso interno
	this._changeScale = function(p_scale, p_redrawonly, opt_centerx, opt_centery) {
		
		if (this.maxscaleview) {
			if (p_scale > this.maxscaleview.scale) {
				this.scale = this.maxscaleview.scale;
				this.cx = this.maxscaleview.terrain_center[0];
				this.cy = this.maxscaleview.terrain_center[1];
				
				if (p_redrawonly) {
					this._redraw(false, opt_centerx, opt_centery);
				} else {
					this.refresh(false, opt_centerx, opt_centery);
				}
				return;
			}
		}
		
		this.setScale(p_scale);
		if (p_redrawonly) {
			this._redraw(false, opt_centerx, opt_centery);
		} else {
			this.refresh(false, opt_centerx, opt_centery);
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

		this.cx = p_centerx;
		this.cy = p_centery;
		this.refresh(false);
	};
	this.moveCenter = function(p_deltax, p_deltay)
	{
		//console.log("mapctrl moveCenter dx:"+p_deltax+' dy:'+p_deltay+", cx:"+this.cx+' cy:'+this.cy);

		if (isNaN(p_deltax)) {
			throw new Error("moveCenter: p_deltax is NaN");
		}
		if (isNaN(p_deltay)) {
			throw new Error("moveCenter: p_deltay is NaN");
		}
		
		this.cx = parseFloat(this.cx) + parseFloat(p_deltax);
		this.cy = parseFloat(this.cy) + parseFloat(p_deltay);
		
		if (isNaN(this.cx)) {
			throw new Error("moveCenter: new this.cx is NaN");
		}
		if (isNaN(this.cy)) {
			throw new Error("moveCenter: new this.cy is NaN");
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

	this.getScreenPtFromTerrain = function(p_terrpt_x, p_terrpt_y, out_pt, opt_forcemx)
	{
		if (p_terrpt_x === null || typeof p_terrpt_x != 'number') {
			console.trace();
			throw new Error(this.msg("MISSPARM1X")+p_terrpt_x);
		}
		if (p_terrpt_y === null || typeof p_terrpt_y != 'number') {
			throw new Error(this.msg("MISSPARM1Y")+p_terrpt_y);
		}
		var v, ret, retmx=[], vy, vx;

		out_pt.length = 2;
		vx = parseFloat(p_terrpt_x);
		vy = parseFloat(p_terrpt_y);

		if (this.useMatrix || opt_forcemx) {
			v = [vx, vy, 1];
			//console.log(String.format("  ---- A v:{0}", v));
			m3.vectorMultiply(v, this._terrainToScreenMx, retmx);
			out_pt[0] = retmx[0];
			out_pt[1] = retmx[1];
		} else {
			/*
			console.log(String.format("  ----- B m:{0} vx:{1} nx:{2:.2f}", this.m, vx, this.nx));
			console.log(String.format("  -----         vy:{0} ny:{1:.2f}", vy, this.ny));
			* */
			out_pt[0] = Math.round(this.m * vx + this.nx);
			out_pt[1] = Math.round(-this.m * vy + this.ny);
		}
	};

	this.getScreenPtFromSrvResponse = function(p_data_x, p_data_y, out_pt, opt_forcemx, opt_dolog)
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
		
		this.getScreenPtFromTerrain(terr_x, terr_y, out_pt, opt_forcemx)
		
		if (opt_dolog) {
			console.log(String.format("  x:{0} y:{1}  v:{2}", terr_x, terr_y, JSON.stringify(out_pt)));
		}

	};
		
	this.getTerrainPt = function(p_scrpt, out_pt, opt_forcemx)
	{
		if (p_scrpt === null || typeof p_scrpt != 'object' || p_scrpt.length != 2) {
			throw new Error(this.msg("MISSPARM2")+p_scrpt);
		}
		var v, ret, retmx=[], vy, vx = parseFloat(p_scrpt[0]);

		out_pt.length = 2;
		vy = parseFloat(p_scrpt[1]);

		if (this.useMatrix || opt_forcemx) {
			v = [vx, vy, 1];
			m3.vectorMultiply(v, this._screenToTerrainMx, retmx);
			out_pt[0] = retmx[0];
			out_pt[1] = retmx[1];
		} else {
			out_pt[0] = (vx - this.nx) / this.m;
			out_pt[1] = (vy - this.ny) / -this.m;
		}
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

		if (p_initconfig.terrain_center !== undefined)
		{
			
			tobj = p_initconfig["terrain_center"];

			if (isNaN(parseFloat(tobj[0]))) {
				throw new Error(this.msg("ERRCEN0")+ ":" + tobj[0]);
			}
			if (isNaN(parseFloat(tobj[1]))) {
				throw new Error(this.msg("ERRCEN1")+ ":" + tobj[1]);
			}

			this.cx = parseFloat(tobj[0]);
			this.cy = parseFloat(tobj[1]);
			
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
		
		/*if (this.legend_data) {
			this.legend_data.setWidgetId(this.mapctrlsmgr.legend_widget_name);
		}*/

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
		let foundlnames = [];

		// Layer (vector) config
		if (p_initconfig["lconfig"] !== undefined) {
			
			this.lconfig = p_initconfig["lconfig"];
			var lc, bot, top;
			for (var lname in this.lconfig)
			{
				if (!this.lconfig.hasOwnProperty(lname)) {
					continue;
				}
				
				foundlnames.push(lname);

				if (this.lnames.indexOf(lname) < 0 && this.lconfig[lname]['rasterbaseurl'] === undefined) {
					notused_lnames.push(lname);
				}
								
				bot = 0; top = MapCtrlConst.MAXSCALE_VALUE;
				
				lc = this.lconfig[lname];
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
		
		if (notused_lnames.length >= 0) {
			if (console) {
				console.warn(this.msg("NOTUSEDLYRS") + notused_lnames.join(','));
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
		var ret = "OK";
		var lyrconf = this.getLayerConfig(p_layername);
		if (lyrconf === undefined) {
			ret = "NOCONFIG";
		} else if (lyrconf.style === undefined && 
					lyrconf.condstyle === undefined &&
					lyrconf.label === undefined) 
		{
			ret = "NOSTYLE";
		}
		if (this.do_showLayerDrawingCondition) {
			console.log("checkLayerDrawingCondition layer:"+p_layername+", ret:"+ret);	
		}
		return ret;
	}
	
	this.getDrawableLayerList = function(out_drawable_layer_lst, opt_alllayers_returns_emptylist) 
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
			if (this.checkLayerDrawingCondition(scale_vlst[i]) == "OK") {
				out_drawable_layer_lst.push(scale_vlst[i]);
			}
			i++;
		}

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
		var ret, sep, formatstr;
		if (this.baseurl.endsWith("/")) {
			sep = "";
		} else {
			sep = "/";
		}
		// TODO: verificar número de casas decimais
		
		if (isNaN(this.cx)) {
			throw new Error("getStatsURL - cx is NaN:" + this.cx);
		}
		if (isNaN(this.cy)) {
			throw new Error("getStatsURL - cy is NaN");
		}
		if (isNaN(this.expandedEnv.getWidth())) {
			throw new Error("getStatsURL - env.getWidth() is NaN");
		}
		if (isNaN(this.expandedEnv.getHeight())) {
			throw new Error("getStatsURL - env.getHeight() is NaN");
		}
		if (isNaN(this.m)) {
			throw new Error("getStatsURL - this.m is NaN");
		}

		var vizlyrs = [];
		this.getDrawableLayerList(vizlyrs, false);
		
		if (vizlyrs.length > 0) {
			formatstr = "{0}{1}stats?map={2}&cenx={3}&ceny={4}&wid={5}&hei={6}&pixsz={7}&vizlrs={8}";
			ret = String.format(formatstr, this.baseurl, sep, this.mapname, formatFracDigits(this.cx, 2),
					formatFracDigits(this.cy,2), formatFracDigits(this.expandedEnv.getWidth(),2),
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
	}

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
			oidkey, p_cenx, p_ceny, p_pixsz, out_readfc, opt_forcemx)
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

		// TODO: attrs transportados numa lista, lista ordenada dos nomes respectivos tem de ser transportada no ínicio da transmissão desde a BD
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
			this.toScreenPoints(p_content_obj.crds, storedfeatdata.path_levels, storedfeatdata.points, opt_forcemx);
			
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
			console.log(p_content_obj);
			throw new Error("_storeFeat -- "+String.format(this.msg("MISSINGGEOMETRY")) );
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
							p_perattribute_style, is_inscreenspace, 
							in_styleflags, opt_displaylayer)
	{
		var pixsz, cenx, ceny, content;
		var content = data.cont;
		//var fc = data.fcnt;
		var ci, readfc = [0], feat, ctrlcnt = 10000;
		//var screencoords = [];
		var opt_forcemx = false;
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
		
		this.scrDiffFromLastSrvResponse.set(this.m);
		
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
								this._drawFeature(feat, p_perattribute_style, is_inscreenspace,
									layername,
									in_styleflags.fillStroke, dodebug, opt_displaylayer);
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
					this._drawFeature(feat, p_perattribute_style, is_inscreenspace,
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
								this._drawFeature(feat, p_perattribute_style, is_inscreenspace, 
										layername, in_styleflags, 
										dodebug, opt_displaylayer, oidkey);
								drawn = true;
							} catch(e) {
								console.log(e);
								inerror = true;
							}

						}

						this.labelengine.addLabel(layername, feat, feat.points);
					}
				}

				if (!inerror && !drawn && !p_dontdraw_flag)
				{
					this._drawFeature(feat, p_perattribute_style, is_inscreenspace, 
							layername, in_styleflags,  
							dodebug, opt_displaylayer, oidkey);
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
				this._executeVectorRefreshDraw(p_objforlatevectordrawing.filteringdata);
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
				this._executeVectorRefreshDraw(pp_objforlatevectordrawing.filteringdata);
			}
		}

	};

	this.drawImageInCanvas = function(p_rastername, p_imageelem, opt_force, opt_displaylayer) 
	{		
		if (typeof p_imageelem != 'undefined') 
		{
			var rasterkey = rasterkey_from_pyramid_pos(p_imageelem.pyrpos)
			if (p_imageelem.elem.complete || opt_force) 
			{
				//console.log("        . complete "+p_imageelem.elem.src);
				// Se a imagem está cerregada vamos desenhá-la imediatamente no canvas
				//this.imagecounters.incrementLoaded(p_rastername);
				
				this.getGraphicController().drawImage(p_imageelem.elem, p_imageelem.ulterrain[0], 
					p_imageelem.ulterrain[1], p_imageelem.sizes[0], p_imageelem.sizes[1], 
					opt_displaylayer);
					
				p_imageelem.drawn = true;
			} 
			else 
			{
				//console.log("        . pending "+rasterkey+", na lista:"+this.pendingimages[p_rastername].indexOf(rasterkey));
				// A imagem deverá estar em carregamento, incrementamos a contagem
				// de imagens pendentes para esta layer raster.
				if (this.pendingimages[p_rastername].indexOf(rasterkey) < 0) {
					this.pendingimages[p_rastername].push(rasterkey);
				}
			}
		}		
	};

	this.drawFeatureInCanvas = function(p_feature,
			p_dostroke, p_dofill, is_inscreenspace, p_dolog, opt_displaylayer,
			opt_forcemx)
	{
		switch (p_feature.path_levels) 
		{
			case 3:
				// TODO: fecho automático de polígnos não fechados
				if (p_dolog) {
					console.log(".. drawFeatureInCanvas, antes de drawMultiplePathCollection");
				}
				this.getGraphicController().drawMultiplePathCollection(p_feature.points, p_dostroke, p_dofill, 
					is_inscreenspace, opt_displaylayer, p_dolog, opt_forcemx);

				break;
				
			case 2:
				if (p_dolog) {
					console.log(".. drawFeatureInCanvas, POLY antes drawMultiplePath");
				}
				this.getGraphicController().drawMultiplePath(p_feature.points, p_dostroke, p_dofill, 
					is_inscreenspace, opt_displaylayer, p_dolog,  opt_forcemx);			
				break;
				
			case 1:
				if (p_dolog) {
					console.log(".. drawFeatureInCanvas, LINE antes drawSimplePath");
				}				

				this.drawSimplePath(p_feature.points, p_dostroke, false, 
					is_inscreenspace, null, opt_displaylayer, p_dolog, opt_forcemx); 		
					
				break;
				
			default:
			
				throw new Error("Internal error in drawFeatureInCanvas");
		
		}
	};
	
	this._drawFeature = function(p_featdata, p_perattribute, 
									is_inscreenspace, p_layername,
									out_styleflags, opt_dodebug, 
									opt_displaylayer, opt_oidkey)
	{
		var pac, paci, attrval;
		var hasperattribstyle = false;
		var do_forcemx = false;
		
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

		if (p_perattribute)
		{
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

				if (attrval != null)
				{
					paci = 0;
					while (p_perattribute[attrname][paci] !== undefined && p_perattribute[attrname][paci] != null)
					{
						pac = p_perattribute[attrname][paci];
						
						if (
							pac.f !== undefined && pac.f != null &&
							pac.style !== undefined && pac.style != null &&
							pac.f(attrval)
						)
						{
							this.pushStyle(pac.style, out_styleflags, displaylayer);
							//this.legend_data.add(p_layername, pac.style);
							hasperattribstyle = true;
						}
						paci++;
					}
				}
			}
		/*
		} else {
			let ds = this.getLayerDefaultStyle();
			if (ds) {
				//this.legend_data.add(p_layername, ds);
			}
			*/
		}

		if (!this.currentStyleIsDefault(displaylayer) && (out_styleflags.stroke || out_styleflags.fill))
		{
			 this.drawFeatureInCanvas(p_featdata,
							out_styleflags.stroke, out_styleflags.fill, 
							is_inscreenspace, opt_dodebug, 
							displaylayer, do_forcemx);

			if (opt_dodebug) {
				console.log("  .. out_styleflags:"+JSON.stringify(out_styleflags)+" strokestyle:"+this.getGraphicController().getStrokeStyle('temporary'));
				console.log("  .. _drawFeature, depois drawFeatureInCanvas");
			}

		}

		if (hasperattribstyle) {
			this.popStyle(out_styleflags, displaylayer);
		}

		//return true;
	};
	
	
	// TODO: FALTA DOC
	this.drawCircle = function(p_cx, p_cy, p_radius, p_stroke, p_fill, is_inscreenspace, opt_styleobj, opt_displaylayer) {

		if (opt_styleobj) {
			this.getGraphicController().saveCtx(opt_displaylayer);
			this.getGraphicController().interpretStyleChgObj(opt_styleobj, opt_displaylayer);
		}
		
		this.getGraphicController().drawCircle(p_cx, p_cy, p_radius, p_stroke, p_fill, is_inscreenspace, opt_displaylayer);

		if (opt_styleobj) {
			this.getGraphicController().restoreCtx(opt_displaylayer);
		}

	};
		
	this.drawCrossHairs = function(p_x, p_y, p_stroke, p_fill, is_inscreenspace, opt_displaylayer) {
		this.getGraphicController().drawCrossHairs(p_x, p_y, p_stroke, p_fill, is_inscreenspace, opt_displaylayer);		
	};


	this.drawSimplePath = function(p_points, p_stroke, p_fill,  
					is_inscreenspace, opt_styleobj, opt_displaylayer, dolog, do_forcemx) {
		if (opt_styleobj) {
			this.getGraphicController().saveCtx(opt_displaylayer);
			this.getGraphicController().interpretStyleChgObj(opt_styleobj, opt_displaylayer);
		}

		this.getGraphicController().drawSimplePath(p_points, p_stroke, p_fill,  
					is_inscreenspace, opt_displaylayer, dolog, do_forcemx);

		if (opt_styleobj) {
			this.getGraphicController().restoreCtx(opt_displaylayer);
		}
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
	 * * out_styleflags - out parameter -- array of two, containing two 
	 *    flags -- first indicates style has stroking parameters, 
	 *    second indicates the presence of fill parameters. 
	 * 
	 * * out_return - out parameter -- array of three elements:
	 * 		- first: boolean indicating style as been applied
	 * 		- second: per attribute styling config object
	 * 		- legenddata: object of type legendData summary of symbology 
	 * 			applications
	 * 
	 * * out_return - out parameter -- array of three elements:
	 * 		- first: boolean indicating style as been applied
	 * 		- second: per attribute styling config object
	 * 		- legenddata: object of type legendData summary of symbology 
	 * 			applications
	 * 
	 * * out_legenddata - out parameter -- object of type legendData 
	 * 		summary of symbology applications
	 * */
	
	//this.activateLayerStyle = function(layername, out_styleflags, 
		//		out_return, opt_displaylayer, opt_style)
	// this.activateLayerStyle = function(layername, out_styleflags, 
		//		out_return, opt_displaylayer)
	this.activateLayerStyle = function(layername, out_return_obj, 
				opt_displaylayer, opt_style)
	{
		'use strict';
		var ret = true;
		
		if (this.lconfig[layername] === undefined || this.lconfig[layername] == null) {
			throw new Error("activateLayerStyle -- layer not configured:" + layername);
		}

		out_return_obj.fillStroke = {
				stroke: true,
				fill: false
		};
		out_return_obj.hasstyle = false;
		out_return_obj.perattribute = null;

		if (opt_style)
		{
			out_return_obj.hasstyle = true;
			this.pushStyle(opt_style, out_return_obj.fillStroke, opt_displaylayer);
		} else { 
			if (this.lconfig[layername].defaultdraw !== undefined) {
				ret = this.lconfig[layername].defaultdraw;
			}

			if (!ret) {
				return ret;
			}
			
			if (this.altstylemode && this.lconfig[layername]["altstyle"] !== undefined) {
				out_return_obj.hasstyle = true;
				this.pushStyle(this.lconfig[layername]["altstyle"], out_return_obj.fillStroke, opt_displaylayer);
			} else if (this.lconfig[layername]["style"] !== undefined) {
				 // TODO: introduzir scaledependent e background depedent
				out_return_obj.hasstyle = true;
				this.pushStyle(this.lconfig[layername]['style'], out_return_obj.fillStroke, opt_displaylayer);
			} else if (this.lconfig[layername]["condstyle"] !== undefined && this.lconfig[layername]["condstyle"] != null) {
				out_return_obj.hasstyle = true;
				this.pushStyle(this.lconfig[layername]["condstyle"]["default"], out_return_obj.fillStroke, opt_displaylayer);
				out_return_obj.perattribute = this.lconfig[layername]["condstyle"]["perattribute"];
			}
			
			/*
			if (out_return_obj.hasstyle && this.lconfig[layername]["altstyle"] !== undefined && this.lconfig[layername]["altstyle"] != null ) {
				out_return_obj.altstyle = this.lconfig[layername]["altstyle"]
			}*/
		}

		return ret;

	};

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
	};

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

	this.drawSingleFeature = function(p_layername, p_objid, is_inscreenspace,
							opt_displaylayer, opt_style, opt_do_debug)
	{
		'use strict';

		var ldata, out_return = {};
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
			if (feat == null) {
				throw new Error("drawSingleFeature, NULL feature data, key:"+p_objid);
				return;
			}
			this._drawFeature(feat, out_return.perattribute, is_inscreenspace,
								p_layername,
								out_return.fillStroke, dodebug,  
								opt_displaylayer, p_objid);
		}

		if (out_return.hasstyle) {
			this.popStyle(out_return.fillStroke, opt_displaylayer);
		}

		return feat;
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

	this.drawLyr = function(layername, is_inscreenspace, out_styleflags, opt_maxallowed_duration, opt_displaylayer)
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

		if (maxallowed_duration > 0) {
			t0 = Date.now();
		}

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

				this._drawFeature(ldata[ci], out_return.perattribute, is_inscreenspace, 
									layername, out_return.fillStroke,
									dodebug, opt_displaylayer, ci);
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
									is_inscreenspace, layername, out_return.fillStroke, 
									dodebug, opt_displaylayer, oidkey);
				if (maxallowed_duration > 0)
				{
					if (maxallowed_duration > 0 ) 
					{
						t1 = Date.now();
						if ((t1-t0) > maxallowed_duration) {
							break;
						}
					}
				}
			}
		}

		if (out_return.hasstyle) {
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

	this._sendReadFeatureRequest = function(opt_filterdata)
	{
		var fclen, chunk, lname, dispname;
		let legend_attrnames = null;
		var dontdraw = false;
		var opt_filter_reference = null;
		var reqid = null;
		var inscreenspace = true;
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
								p_self.callSequence.addMsg("_sendReadFeatureRequest_callback", _inv1, String.format("call server returned, ready: {0}", this.readyState));
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

										if (!p_self.activateLayerStyle(lname, activateReturn)) {
											dontdraw = true;
										}

										try {
											p_self.setFeatureData(lname, respdata, dontdraw, activateReturn.perattribute, inscreenspace, activateReturn.fillStroke, legend_attrnames);
										} catch(e) {
											console.log(".. error in _sendReadFeatureRequest, setFeatureData");
											console.log(e);
											throw e;
										}

										if (activateReturn.hasstyle) {
											p_self.popStyle(activateReturn.fillStroke);
										}

										try {
											if (!p_self.muted_vectors) {
												p_self._retrieveVectorsFromServer(opt_filterdata);
											}
										} catch(e) {
											console.log(e);
											p_self._onRetrieveFinish('error 1');
										}
									}
									else
									{
										if (this.responseText.length < 1) {
											p_self._onRetrieveFinish('error '+this.status+', void response');									
										} else {										
											p_self._onRetrieveFinish('error '+this.status);
										}
										var resp = this.responseText.toLowerCase();
										if (resp.indexOf("unavailable") >= 0 || resp.indexOf("indispon") >= 0) {
											this.showWarn(String.format(p_self.msg("FSUNAVAILB"), this.status));
										} else {
											if (this.responseText.length > 0) {
												this.showWarn(this.responseText);
											}
										}
										p_self.clearTransient();
										p_self.clearTemporary();
									}
								} catch(e) {
									var useless = null;
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

										p_self.setFeatureData(lname, respdata, dontdraw, perattribute, inscreenspace, styleflags);
										p_self.drawLyr(lname, true, styleflags, respdata)

										if (activateReturn.hasstyle) {
											p_self.popStyle(activateReturn.fillStroke);
										}

										try {
											p_self._retrieveFromServer(opt_filterdata);
										} catch(e) {
											console.log(e);
											p_self._onRetrieveFinish('error 3');
										}
									}
									else
									{
										p_self._onRetrieveFinish('error 4 len:'+this.responseText.length);
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
	// 	 p_sclval: current scale value
	// 	 opt_objforlatevectordrawing: object containing attributes to control vector drawing ocurring after the rasters, here retrieved, are fully drawn
	
	this._retrieveRastersFromServer = function(p_sclval, p_objforlatevectordrawing)
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
				function (name, rasterLayerSpecs, the_mapcontroller, the_rcvctrler, sclval, clrimflag_ref) 
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
				p_sclval,
				clrimgflag_obj
			);

		} else {
			this.callSequence.addMsg("_retrieveRastersFromServer", _inv, "raster specs DON'T exist");
			this.clearImageData(null);
		}
	};

	this._retrieveVectorsFromServer = function(opt_filterdata)
	{
		var currnumbs, nchunks, nvert;

		var _inv = this.callSequence.calling("_retrieveVectorsFromServer", arguments);

		// layers vectoriais
		if (!this.activeserver || this.pendingChunks.length == 0)
		{
			while (true) 
			{
				if (!this.rcvctrler.nextCurrLayer()) 
				{
					this.callSequence.addMsg("_retrieveVectorsFromServer", _inv, "next current layer: NONE");
					this._onRetrieveFinish('normal');
					break;
				} else if (this.activeserver && this.fanningChunks.length == 0) {

					this.callSequence.addMsg("_retrieveVectorsFromServer", _inv, "fanningChunks.length == 0");

					currnumbs = [];
					this.rcvctrler.getCurrNumbers(currnumbs);
					lname = currnumbs[0];
					if (lname != null)
					{						
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
		this._sendReadFeatureRequest(opt_filterdata);
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
				mutingfilter = (!this.muted_vectors || (this.lconfig[p_layername].allowmuting !== undefined && !this.lconfig[lname].allowmuting));
			}
			
			if (scldep && mutingfilter)
			{
				ret = true;			
			}	
			
		}	
		
		return ret;
	};

/** @this MapController 
  * Prepare and execute data server request
  * @param {LayerFilter} [opt_filterdata] - (optional) if present, objects obeying filter criteria will be present, despite being or not inside envelope.
*/
	this._prepareRefreshDraw = function(opt_filterdata)
	{
		var _inv = this.callSequence.calling("_prepareRefreshDraw", arguments);
		
		if (this._xhrs.length > 0 || this.rcvctrler.currentlyRetrieving()) {
			// Está a decorrer um processo de obtenção de geometrias do servidor
			this.callSequence.addMsg("_prepareRefreshDraw", _inv, "aborting previous requests");
			this.abortAllRequests();
		} else {
			this.callSequence.addMsg("_prepareRefreshDraw", _inv, "resetting 'retrieve controller'");
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

		this.callSequence.addMsg("_prepareRefreshDraw", _inv, String.format("executed {0} 'on before refresh' functions",obr_i));
		
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
			
			this.callSequence.addMsg("_prepareRefreshDraw", _inv, "fetching vector stats from server");

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
									p_self._checkRefreshDraw(MapCtrlConst.REFRESH_VECTORS, sclval, opt_filterdata);
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

			this.callSequence.addMsg("_prepareRefreshDraw", _inv, "fetching raster specs from server");
			
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
												p_mapctrller._checkRefreshDraw(MapCtrlConst.REFRESH_RASTERS, sclval, opt_filterdata);
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
  * @param {string} p_sclval - The ID of HTML container object to recieve the map display.
  * @returns {string} - String containing class name
*/
	this._checkRefreshDraw = function(p_mode, p_sclval, opt_filterdata)
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
			this._executeRefreshDraw(p_sclval, opt_filterdata)
		}
		else {
			this.clearTransient();
		}
	}

	this._executeVectorRefreshDraw = function(opt_filterdata)
	{
		var _inv = this.callSequence.calling("_executeVectorRefreshDraw", arguments);
		
		this.waitingForFirstChunk = true;		
		if (this.activeserver && this.rcvctrler.getLayerCount() > 0)
		{
			this.callSequence.addMsg("_executeVectorRefreshDraw", _inv, "active server, existing stats:"+this.rcvctrler.existLayerStats()+", muted vectors:"+this.muted_vectors);
			if (this.rcvctrler.existLayerStats()) {
				try {	
					if (!this.rcvctrler.hasAnythingToDraw()) {
						this.progressMessage(this.msg("NOTHINGTODRAW"));
						window.setTimeout(function(){ this.clearTransient(); }, 1000);
					} else if (!this.muted_vectors) {
						this._retrieveVectorsFromServer(opt_filterdata);
					}
				} catch(e) {
					console.log(e);
					this._onRetrieveFinish('error 5');
				}
			}
		} else {
			try {
				if (!this.muted_vectors) {
					this.callSequence.addMsg("_executeVectorRefreshDraw", _inv, "no active server or zero layers");
					this._retrieveVectorsFromServer(opt_filterdata);
				}
			} catch(e) {
				console.log(e);
				this._onRetrieveFinish('error 6');
			}

		}
 
	}


/** @this MapController 
  * Main object to control map display
  * @param {string} p_sclval - The ID of HTML container object to recieve the map display.
  * @returns {string} - String containing class name
*/
	this._executeRefreshDraw = function(p_sclval, opt_filterdata)
	{

		var _inv = this.callSequence.calling("_executeRefreshDraw", arguments);

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
		if (!this.muted_vectors && p_sclval >= this.vectorexclusive_scales[0] && p_sclval <= this.vectorexclusive_scales[1]) {
			vectors_exclusive = true;
		}

		this.callSequence.addMsg("_executeRefreshDraw", _inv, String.format("refreshing vectors: {0}, rasters: {1}, muted vectors: {2}, vectors exclusive: {3}", refresh_vectors, refresh_rasters, this.muted_vectors, vectors_exclusive));
		
		if (refresh_rasters && !vectors_exclusive) 
		{
			this._retrieveRastersFromServer(
				p_sclval, 
				{
					"refresh_vectors": refresh_vectors,
					"filteringdata": opt_filterdata
				}
			);
		}
		else if (refresh_vectors && !this.muted_vectors) 
		{
			this._executeVectorRefreshDraw(opt_filterdata);
		}

	}
		
/*
	this._executeVectorRefreshDrawAfterRaster = function(p_sclval, opt_filterdata)
	{
		var refresh_vectors = ((this.refreshcapability & MapCtrlConst.REFRESH_VECTORS) == MapCtrlConst.REFRESH_VECTORS);		
		if (refresh_vectors) 
		{
			this._executeVectorRefreshDraw(opt_filterdata);
		}
	}

 */

	this.localDrawRasters = function(opt_force)
	{
		var i=0, rasternames = [];
		this.rcvctrler.getRasterNames(rasternames);
		

		this.clear(MapCtrlConst.CLEARMODE_RASTER);
		
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
					if (this._drawRasterLyr(rasternames[i], MapCtrlConst.ACCPTBLE_LYRREDRAW_DELAY_MSEC, opt_force)) {
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
	this.localDrawFeatures = function(do_clear)
	{
		var lname, styleflags = [];
		var t0=0, t1=0;
		if (do_clear) {
			this.clear(MapCtrlConst.CLEARMODE_VECTOR);
		}

		t0 = Date.now();
		try 
		{
			for (var li=0; li<this.lnames.length; li++)
			{
				if (this._cancelCurrentChange) {
					break;
				}

				this.drawLyr(this.lnames[li], true, styleflags, MapCtrlConst.ACCPTBLE_LYRREDRAW_DELAY_MSEC);
				t1 = Date.now();
				if ((t1- t0) > MapCtrlConst.ACCPTBLE_LYRREDRAW_DELAY_MSEC) {
					break;
				}
			}
		} catch(e) {
			console.log(e);
		}
	};

	this.drawLabels = function(p_scale_val, opt_displaylayer)
	{
		var out_styleflags = [], als_return=[];
		
		if (this.labelengine != null)
		{
			i = 0;
			while (this.lnames[i] !== undefined && this.lnames[i] != null)
			{
				layername = this.lnames[i];
				i++;

				if (this.labelengine.layerHasLabels(layername))
				{
					this.activateLayerLabelStyle(layername, out_styleflags, als_return, opt_displaylayer);
					hasstyle = als_return[0];
					
					this.labelengine.genLabels(p_scale_val, layername, opt_displaylayer);

					if (hasstyle) {
						this.popStyle(out_styleflags, opt_displaylayer);
					}
				}

			}
		}
	};

	this._localDraw = function() {
		
		this.drawnrasters.length = 0;

		this._cancelCurrentChange = false;
		
		try {
			this.localDrawRasters(false);
			// _cancelCurrentChange can be set during draw raster task
			if (!this._cancelCurrentChange) {
				this.localDrawFeatures(true);
			}
			// TODO: repor o desenho de Labels -- não seguia o rato durante o pan
			//this.drawLabels();
		} catch(e) {
			console.log(e);
		}	
		
		this._onDrawFinish('localdraw');
	};
	
	this._onChangeStart = function() {
		this.clearLegendData();
	}

	this._onRetrieveFinish = function(p_type, opt_displaylayer)
	{
		if (p_type != 'error') {
			this.drawLabels(this.getScale(), opt_displaylayer);
		}
		this._onDrawFinish(p_type);
		this.pubScaleVal();
		
		this.updateLegend();
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
				this._cancelCurrentChange = false;
				console.log("key:"+dffkey+" json:"+JSON.stringify(this.onDrawFinishFuncs));
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

// TODO - parâmetros de sobreamento não podem ser aplicados ao ctx, tem de despoletar o desenho de
// um segundo texto desviado 

	this.applyStyle = function(p_styleobj, out_styleflags, opt_displaylayer)
	{
		out_styleflags.length = 0;
		out_styleflags.stroke = false;
		out_styleflags.fill = false;
		var foundattrs = [];

		if (typeof p_styleobj == 'undefined') {
			throw new Error("applyStyle "+this.msg("NOSTYOBJ"));
		}
		for (var attr in p_styleobj)
		{
			if (!p_styleobj.hasOwnProperty(attr)) {
				continue;
			}
			if (foundattrs.indexOf(attr) < 0) {
				foundattrs.push(attr);
			}
			switch (attr) {
				case "strokecolor":
					this.getGraphicController().setStrokeStyle(p_styleobj[attr], opt_displaylayer);
					out_styleflags.stroke = true;
					break;
				case "fillcolor":
					this.getGraphicController().setFillStyle(p_styleobj[attr], opt_displaylayer);
					out_styleflags.fill = true;
					break;
				case "linewidth":
					this.getGraphicController().setLineWidth(p_styleobj[attr], opt_displaylayer);
					break;
				case "linejoin":
					this.getGraphicController().setLineJoin(p_styleobj[attr], opt_displaylayer);
					break;
				case "linecap":
					this.getGraphicController().setLineCap(p_styleobj[attr], opt_displaylayer);
					break;
				case "font":
					this.getGraphicController().setFont(p_styleobj[attr], opt_displaylayer);
					break;
				case "align":
					this.getGraphicController().setTextAlign(p_styleobj[attr].toLowerCase(), opt_displaylayer);
					break;
				case "baseline":
					this.getGraphicController().setBaseline(p_styleobj[attr].toLowerCase(), opt_displaylayer);
					break;
				case "shadowcolor":
					this.getGraphicController().setShadowColor(p_styleobj[attr].toLowerCase(), opt_displaylayer);
					break;
				case "shadowoffsetx":
					this.getGraphicController().setShadowOffsetX(p_styleobj[attr], opt_displaylayer);
					break;
				case "shadowoffsety":
					this.getGraphicController().setShadowOffsetY(p_styleobj[attr], opt_displaylayer);
					break;
				case "shadowblur":
					this.getGraphicController().setShadowBlur(p_styleobj[attr], opt_displaylayer);
					break;
				case "bgstyle":
					this.getGraphicController().setLabelBackground(p_styleobj[attr], opt_displaylayer);
					break;
				case "marker":
					this.getGraphicController().setMarker(p_styleobj[attr], opt_displaylayer);
					break;
				case "markersize":
					this.getGraphicController().setMarkerSize(p_styleobj[attr], opt_displaylayer);
					break;
			}
		}
		if (out_styleflags.stroke === undefined ||  out_styleflags.fill === undefined || (!out_styleflags.stroke && !out_styleflags.fill)) {
			throw new Error("applyStyle "+this.msg("NOTHDRAW"));
		}
		// valores default
		if (foundattrs.indexOf("linewidth") < 0) {
			this.getGraphicController().setLineWidth(1, opt_displaylayer);
		}
		if (foundattrs.indexOf("linejoin") < 0) {
			this.getGraphicController().setLineJoin("round", opt_displaylayer);
		}
		if (foundattrs.indexOf("linecap") < 0) {
			this.getGraphicController().setLineJoin("butt", opt_displaylayer);
		}
		if (foundattrs.indexOf("font") < 0) {
			this.getGraphicController().setFont("10px sans-serif", opt_displaylayer);
		}
		if (foundattrs.indexOf("align") < 0) {
			this.getGraphicController().setTextAlign("center", opt_displaylayer);
		}
		if (foundattrs.indexOf("baseline") < 0) {
			this.getGraphicController().setBaseline("alphabetic", opt_displaylayer);
		}

		if (foundattrs.indexOf("shadowcolor") < 0) {
			this.getGraphicController().setShadowColor("rgba(0,0,0,0)", opt_displaylayer);
		}
		if (foundattrs.indexOf("shadowoffsetx") < 0) {
			this.getGraphicController().setShadowOffsetX(0, opt_displaylayer);
		}
		if (foundattrs.indexOf("shadowoffsety") < 0) {
			this.getGraphicController().setShadowOffsetY(0, opt_displaylayer);
		}
		if (foundattrs.indexOf("shadowblur") < 0) {
			this.getGraphicController().setShadowBlur(0, opt_displaylayer);
		}

		if (foundattrs.indexOf("marker") < 0) {
			this.getGraphicController().setMarker("square", opt_displaylayer);
		}
		if (foundattrs.indexOf("markersize") < 0) {
			this.getGraphicController().setMarkerSize(1, opt_displaylayer);
		}

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
					"fillcolor": this.getGraphicController().getFillStyle(displaylayer),
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
	this.currentStyleIsDefault = function(opt_displaylayer)
	{
		var displaylayer;

		if (opt_displaylayer == null) {
			displaylayer = 'base';
		} else {
			displaylayer = opt_displaylayer;
		}

		if (this.styleStack[displaylayer] === undefined) {
			this.styleStack[displaylayer] = [];
		}

		return (this.styleStack[displaylayer].length == 0);
	};

	//this.grController = new CanvasController(p_elemid, this);
	this.grCtrlrMgr = new GraphicControllerMgr(this, p_elemid);
	this.getGraphicController = function(opt_key) {
		return this.grCtrlrMgr.get(opt_key);
	};
	
	this.env = new Envelope2D();
	this.mapctrlsmgr = new MapControlsMgr(this);
	this.rcvctrler = new RetrievalController();
	this.labelengine = new MapLabelEngine(this);
	this.spatialindexer = new SpatialIndexer(this, MapCtrlConst.SPINDEX_STEP);

	this.findNearestObject = function(p_scrx, p_scry, p_radius, p_layername, opt_forcemx)
	{
		var ret = null;
		var pix_radius = Math.ceil(this.m * p_radius);

		//console.log(String.format("scr:[{0},{1}] pxrad:{2} rad:{3}",p_scrx, p_scry, pix_radius, p_radius));
		
		if (this.spatialindexer) {
			ret = this.spatialindexer.findNearestObject([p_scrx, p_scry], pix_radius, p_layername);
		}

		return ret;
	}

	this.setMarkerSize = function(p_style) {
		this.getGraphicController().setMarkerSize(p_style);
	};

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
							opt_do_debug, opt_style)
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
						opt_displaylayer, opt_style, opt_do_debug);
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

		// TODO: Externalizar a configuração deste "banner"
		var ctxlyr = 'transient';
		var inscreenspace = true;
		var msg = p_msg;
		this.getGraphicController().saveCtx(ctxlyr);
		var txtsz = 18;
		this.getGraphicController().setFont(txtsz+"px Arial", ctxlyr);
		var tw = this.getGraphicController().measureTextWidth(msg, ctxlyr);
		var margin = 40;
		var mask_offset_y = 60;
		var mask_offset_y = 60;


		var wid = 2 * margin + tw;
		var mask_y = this.getGraphicController().getCanvasDims()[1]-mask_offset_y;
		var text_y = mask_y + txtsz - 3;


		this.getGraphicController().clearDisplayLayer(ctxlyr);
		this.getGraphicController().setFillStyle('rgba(255, 0, 0, 0.5)', ctxlyr);

		this.getGraphicController().drawRect(0, mask_y, wid, 18, false, true, inscreenspace, ctxlyr);
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

	/* //THROTTLED EVENTS CANCELADOS
	throttleMouseEvent("mousemove", "optimizedMousemove");
	
	window.addEventListener("optimizedMousemove", 
		(function (p_mapctrlsmgr) {
			return function(e) {
				p_mapctrlsmgr.mousemove(e);
			}
		})(this.mapctrlsmgr)
	);
	* */ 

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

	// debounced resize
	window.addEventListener("resize", 
		(function (p_mapctrl) {
			let timerId = null;
			let waitPeriodMsec = 200;
			return function(e) {
				if (timerId != null) {
					window.clearTimeout(timerId);
				}
				timerId = window.setTimeout(function(e) {
						p_mapctrl.refresh(true);
						timerId = null;
					}, waitPeriodMsec);
			}
		})(this)
	);

	
}
