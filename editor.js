
function getFeatGISId(p_obj_in_edition) {
	ret = null;
	if (p_obj_in_edition!=null &&  p_obj_in_edition.attrs!==undefined && p_obj_in_edition.attrs['gid']!==undefined) {
		ret = p_obj_in_edition.attrs.gid;
	}
	return ret;
}

function setFeatGISId(p_obj_in_edition, p_gisid) {
	if (p_obj_in_edition!=null &&  p_obj_in_edition.attrs!==undefined) {
		p_obj_in_edition.attrs.gid = p_gisid;
	}
}

function setNextPoint(p_obj_in_edition, x, y) {
	if (p_obj_in_edition.type == "point") {
		p_obj_in_edition.points = [x, y];
	} else {
		throw new Error("setNextPoint: geom type not implemented yet:"+p_obj_in_edition.type);
	}
}

function genNewEmptyFeature(p_type, out_dict) {
	if (out_dict == null) {
		throw new Error("genNewFeature: no out dictionary to fill with feature structure");
	}
	if (p_type != "point") {
		throw new Error("genNewFeature: geom type not implemented yet:"+p_type);
	}
	out_dict.oid = -1;
	out_dict.type = "point";
	out_dict.points = [];
	out_dict.path_levels = 1;
	out_dict.attrs = {};
}

var EditControllerRisco = {
	//mode: 'none', // none create modify
	_isactive: false,
	_defmapctrlr: null,
	_defdisplyr: null,
	startingFeature: null,
	featInEdition: null,
	layerInEdition: null,
	featInEditionChanged: false,
	currentUser: null,
	editAuthBool: false,
	selFeatRedrawFunc: null,
	setCurrentUser: EditControllerDefs.setCurrentUser,
	msgController: null,
	symbModifier: null,
	setMsgController: function(p_obj) {
		this.msgController = p_obj;
	},
	setMessage: function(p_msg_txt, p_mode, opt_fyes, opt_fno) {
		if (this.msgController) {
			this.msgController.setMessage(p_msg_txt, p_mode, opt_fyes, opt_fno);
		}
	},
	setSymbModifier: function (p_modif) {
		this.symbModifier = p_modif;
	},
	getCurrentUser: function() {
		return this.currentUser;
	},
	init: function() {
		this.featInEditionChanged = false;
		this.startingFeature = null;
	},
	setDefaultMapController: function(p_mapctrlr, p_displyr) {
		this._defmapctrlr = p_mapctrlr;
		this._defdisplyr = p_displyr;
	},
	getDefaultMapController: function() {
		return this._defmapctrlr;
	},
	getDefaultMapDispLayer: function() {
		return this._defdisplyr;
	},
	setFeatInEdition: function(p_feat, p_layername) {
		this.featInEdition = clone(p_feat);
		this.featInEditionChanged = false;
		this.startingFeature = clone(p_feat);
		this.layerInEdition = p_layername;
	},
	ensureFeatInEdition: function(p_feature, p_layername) {
		if (p_feature!=null && this.startingFeature == null) {
			this.setFeatInEdition(p_feature, p_layername);
		}
	},	
	getFeatInEdition: function() {
		return this.featInEdition;
	},
	clearFeatInEdition: function() {
		this.featInEdition = null;
		this.featInEditionChanged = false;
		this.startingFeature = null;
	},
	featInEditionExists: function() {
		//console.log(this.featInEdition);
		return (this.featInEdition != null);
	},
	activate: function(p_feature, p_layername, p_silent) {
		return this._activate(true, p_feature, p_layername, p_silent)
	},
	deactivate: function(p_silent) {
		return this._activate(false, null, null, p_silent)
	},
	_activate: function(p_doactivate, p_feature, p_layername, p_silent) {
		let displayer, map, ret = false;
		if (!this.editAuthBool) {
			if (!p_silent) {
				this.setMessage(MsgCtrl.getMsg(EditControllerDefs.userNotAuthenticatedMsg), "WARN");
			}
			ret = false;
		} else {
			this._isactive = p_doactivate;
			if (this._isactive) {
				// Activar edição
				EditController.init();
				this.setMessage(MsgCtrl.getMsg(EditControllerDefs.enteringEditModeMsg), "INFO");
				if (p_feature!=null) {
					this.setFeatInEdition(p_feature, p_layername);
				} else {
					this.layerInEdition = p_layername;
				}
				ret = true;
			} else {
				// Desactivar edição
				displayer = this._defdisplyr;
				map = this._defmapctrlr;
				if (this.featInEditionChanged) {
					// saving
					this.doSave();
				} else {
					map.clearDispLayer(displayer);
					if (EditController.selFeatRedrawFunc!=null && EditController.featInEditionExists()) {
						EditController.selFeatRedrawFunc(EditController.getFeatInEdition());
					}
				}
				ret = false;
			}
		}
		
		return ret;
	},
	isActive: function() {
		return this._isactive;
	},
	preparePayload: function(p_location, p_gisid) {
		// e.latlng
		let map = this.getDefaultMapController();
		if (map==null) {
			throw new Error("EditController, preparePayload: no map controller");
		}
		var geojsonfeat = {
			"type": "Feature",
			"geometry": {
				"type": "Point",
				"coordinates": [p_location[0], p_location[1]]
			}
		};
		return EditControllerDefs.payloadTemplate(geojsonfeat, p_gisid);
	},
	setNextPoint: function(null_map, x, y, opt_do_debug) {
	// null_map, opt_displaylyr and searchtolerance are currently ignored, this._defmapctrlr is used, searchtolerance also ignored
	// new feature: type "point" is forced
		let map;
		let displayer, terrpt=[];		
		if (this._isactive ) {
			map = this._defmapctrlr;
			displayer = this._defdisplyr;
			map.clearDispLayer(displayer);
			if (!this.featInEditionExists()) {
				this.featInEdition = {};
				genNewEmptyFeature("point", this.featInEdition);
			}
			if (this.featInEditionExists()) {
				map.getTerrainPt([x,y], terrpt);			
				setNextPoint(this.getFeatInEdition(), terrpt[0], terrpt[1]);
				this.featInEditionChanged = true;
				map.drawNewFeature(this.layerInEdition, this.getFeatInEdition(), 
							this.symbModifier,
							null, displayer, opt_do_debug);
			}
		}
	},	
	refresh: function() {
		if (this._isactive && this.featInEditionExists()) {
			this._defmapctrlr.drawNewFeature(this.layerInEdition, this.getFeatInEdition(), 
						this.symbModifier, null, this._defdisplyr, false);
		}
	},
	mouseClick: function(null_map, x, y) { 
		// null_map is currently ignored, this._defmapctrlr is used
		EditController.setNextPoint(null_map, x, y, false);
	},
	setSelFeatRedrawFunc: function(p_func) {
		this.selFeatRedrawFunc = p_func;
	},
	doSave: function() {
		// to extend
	}
}
