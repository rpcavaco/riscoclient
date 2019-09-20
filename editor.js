
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
	featInEditionChanged: false,
	currentUser: null,
	editAuthBool: false,
	selFeatRedrawFunc: null,
	setCurrentUser: EditControllerDefs.setCurrentUser,
	msgController: null,
	setMsgController: function(p_obj) {
		this.msgController = p_obj;
	},
	setMessage: function(p_msg_txt, p_mode, opt_fyes, opt_fno) {
		if (this.msgController) {
			this.msgController.setMessage(p_msg_txt, p_mode, opt_fyes, opt_fno);
		}
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
	setFeatInEdition: function(p_feat) {
		this.featInEdition = clone(p_feat);
		this.featInEditionChanged = false;
		this.startingFeature = clone(p_feat);
	},
	ensureFeatInEdition: function(p_feature) {
		if (p_feature!=null && this.startingFeature == null) {
			this.setFeatInEdition(p_feature);
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
	activate: function(p_feature, p_silent) {
		this._activate(true, p_feature, p_silent)
	},
	deactivate: function(p_silent) {
		this._activate(false, null, p_silent)
	},
	_activate: function(p_doactivate, p_feature, p_silent) {
		/*
		console.trace("_activate");
		console.log(p_doactivate);
		console.log(p_feature);
		console.log(p_silent);
		* */
		//EditController.mode = 'none';
		let displayer, map;
		if (!this.editAuthBool) {
		//if (false) {
			if (!p_silent) {
				this.setMessage(MsgCtrl.getMsg(EditControllerDefs.userNotAuthenticatedMsg), "WARN");
			}
			return false;
		} else {
			this._isactive = p_doactivate;
			if (this._isactive) {
				// Activar edição
				EditController.init();
				this.setMessage(MsgCtrl.getMsg(EditControllerDefs.enteringEditModeMsg), "INFO");
				
				if (p_feature!=null) {
					this.setFeatInEdition(p_feature);
				}
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

					//this.clearFeatInEdition();

				}
			}
			return true;
		}
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
		transf_loc = [];
		map.getTerrainPt(p_location, transf_loc, false);
		var geojsonfeat = {
			"type": "Feature",
			"geometry": {
				"type": "Point",
				"coordinates": [transf_loc[0], transf_loc[1]]
			}
		};
		return EditControllerDefs.payloadTemplate(geojsonfeat, p_gisid);
	},
	setNextPoint: function(null_map, x, y, p_layername, markerfunc_modifier, opt_displaylyr) {
	// null_map, opt_displaylyr and searchtolerance are currently ignored, this._defmapctrlr is used, searchtolerance also ignored
	// new feature: type "point" is forced
		let map;
		let displayer;
		if (this._isactive ) {
			map = this._defmapctrlr;
			displayer = this._defdisplyr;
			map.clearDispLayer(displayer);
			if (!this.featInEditionExists()) {
				this.featInEdition = {};
				genNewEmptyFeature("point", this.featInEdition);
			}
			if (this.featInEditionExists()) {
				setNextPoint(this.getFeatInEdition(), x, y);
				this.featInEditionChanged = true;
				map.drawSingleFeatureFeat(p_layername, this.getFeatInEdition(), true,
							displayer, null, markerfunc_modifier, false);
			}
		}
	},	
	mouseClick: function(null_map, x, y, layername, markerfunc_modifier) { 
		// null_map is currently ignored, this._defmapctrlr is used
		EditController.setNextPoint(null_map, x, y, layername, markerfunc_modifier);
	},
	setSelFeatRedrawFunc: function(p_func) {
		this.selFeatRedrawFunc = p_func;
	},
	doSave: function() {
		// to extend
	}
}
