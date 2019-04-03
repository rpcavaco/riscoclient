
var EditControllerLeaflet = {
	mode: 'none', // none create modify
	_isactive: false,
	_map: null,
	_sketchFeats: [],
	_maxSketchFeats: EditControllerDefs.maxSketchFeats,
	_tempMarkerOptions: EditControllerDefs.tempMarkerOptions,
	_currentEventSourceLeafletId: null,
	startingMovePoint: null,
	featInEdition: null,
	featInEditionMoved: false,
	currentUser: null,
	editAuthBool: false,
	setCurrentUser: EditControllerDefs.setCurrentUser,
	getCurrentUser: function() {
		return this.currentUser;
	},
	init: function() {
		this.featInEditionMoved = false;
	},
	_clearSketch: function() {
		for (var i=0; i<this._sketchFeats.length; i++) {
			this._sketchFeats[i].remove();
		}
		this._sketchFeats.splice(0,this._sketchFeats.length);		
	},
	setStartingMovePoint: function(p_location) {
		this.startingMovePoint = p_location;
	},
	clearStartingMovePoint: function() {
		this.startingMovePoint = null;
	},
	applyStartingMovePoint2FeatInEdition: function() {
		if (this.featInEdition != null && this.startingMovePoint != null) {
			this.featInEdition.setLatLng(this.startingMovePoint);
			this.moveTargetMarker(this.startingMovePoint);
			LF_setPointElementCoords(this.featInEdition, this.startingMovePoint);
		}
	},
	setFeatInEdition: function(p_feat) {
		this.featInEdition = p_feat;
	},
	getFeatInEdition: function() {
		return this.featInEdition;
	},
	setMap: function(p_map) {
		this._map = p_map;
	},
	getMap: function(p_map) {
		return this._map;
	},
	activate: function(p_doactivate, p_silent) {
		EditController.mode = 'none';
		if (!this.editAuthBool) {
			if (!p_silent) {
				MessagesController.setMessage(MsgCtrl.getMsg(EditControllerDefs.userNotAuthenticatedMsg), "WARN");
			}
			return false;
		} else {
			this._isactive = p_doactivate;
			if (this._isactive) {
				// Activar edição
				EditController.init();
				L.DomUtil.addClass(this._map._container,'crosshair-cursor-enabled');
				DynLayerRenderer.setEnforceDiameters(false);
				DynLayerRenderer.refreshDynLayer();
				MessagesController.setMessage(MsgCtrl.getMsg(EditControllerDefs.enteringEditModeMsg), "INFO");
				// alterar aspecto da Feature em edição
				DynLayerRenderer.selMarkerChangeEditingState(true);
			} else {
				// Desactivar edição
				L.DomUtil.removeClass(this._map._container,'crosshair-cursor-enabled');
				this._clearSketch();
				DynLayerRenderer.selMarkerChangeEditingState(false);
				//DynLayerRenderer.setEnforceDiameters(true);
				DynLayerRenderer.refreshDynLayer();
				// remover a 'mira' de edição
				//this.removeTargetMarker();	
				
				conditionallyDoUpdate(this.featInEdition, this.featInEditionMoved);
			}
			return true;
		}
	},
	isActive: function() {
		return this._isactive;
	},
	preparePayload: function(p_location, p_gisid) {
		// e.latlng
		var feat = {
			"type": "Feature",
			"geometry": {
				"type": "Point",
				"coordinates": [p_location.lng, p_location.lat]
			}
		};
		return EditControllerDefs.payloadTemplate(feat, p_gisid);
	},
	doMove: function(p_location) {	

		if (typeof getFeatGISId == 'undefined') {
			// definido em setup.js ou init.js, para extrair o gis_id do objecto em edicao
			log('doMove saida A');
			return;
		}

		if (this.featInEdition == null) {
			// não existe objecto em edicao
			log('doMove saida B');
			return;
		}
		
		// mode funciona como semaphore uma vez que o leaflet desencandeia doMove e doMark,
		//   um deles primeiro
		if (this.isActive() && this.mode == 'none') {
			this.mode = 'modify';
		} else {
			return;
		}		
		
		//conditionallyDoUpdate(this.featInEdition);
		
		/*
		var gisid = getFeatGISId(this.featInEdition);		
		var payload = this.preparePayload(p_location, gisid);
		
		MessagesController.setMessage(MsgCtrl.getMsg(EditControllerDefs.confirmUpdateMsg), 'QUEST', function(e) {
			// Gravar alteração da posição da feature
			var res, url = EditControllerDefs.saveEndpoint;
			ajaxSender(url, function() {
				var res;
				if (this.readyState === this.DONE)
				{
					if (this.status == 200) {
						res = this.responseText;
						if (res != gisid) {
							// Aviso de alteração imprevista no GIS ID
							MessagesController.setMessage(MsgCtrl.getMsg(EditControllerDefs.updateError), 'WARN');
						}
						EditController.mode = 'none';
						EditController.clearStartingMovePoint();
						customMapRefresh();
					}
				}
			}, JSON.stringify(payload), null, true);
						
		}, function(e) {  
			// Repor feature no local inicial
			EditController.mode = 'none';
			EditController.applyStartingMovePoint2FeatInEdition();
			EditController.clearStartingMovePoint();
		})
		* */
	},
	doMark: function(p_location) {	

		// mode funciona como semaphore uma vez que o leaflet desencandeia ambos doMove e doMark,
		//   um deles primeiro

		if (this.isActive() && this.mode == 'none') {
			this.mode = 'create';
		} else {
			return;
		}

		if (this._sketchFeats.length >= this._maxSketchFeats) {
			for (var i=(this._maxSketchFeats-1); i<this._sketchFeats.length; i++) {
				this._sketchFeats[i].remove();
			}
			this._sketchFeats.splice(this._maxSketchFeats-1,(this._sketchFeats.length-this._maxSketchFeats)+1) 
		}

		var pylodobj = this.preparePayload(p_location, "");
		var feat = pylodobj['gjson'];
		var payload = pylodobj;

		(function (p_sketchfeats, p_feat, p_markeropts, p_map) {
			p_sketchfeats.push(L.geoJSON(p_feat, {
				pointToLayer: function (feature, latlng) {
					//console.log(p_markeropts);
					return L.circle(latlng, p_markeropts);
				}
			}).addTo(p_map));
		})(this._sketchFeats, feat, this._tempMarkerOptions, this._map);
		
		// Confirmação de que se pretende a gravação de novo ponto	
		MessagesController.setMessage(MsgCtrl.getMsg(EditControllerDefs.confirmInsertMsg), 'QUEST', function(e) {

			var res, url = EditControllerDefs.saveEndpoint;
			// Gravação do novo ponto
			ajaxSender(url, function() {
				if (this.readyState === this.DONE) {
					if (this.status == 200) {
						res = this.responseText;
						EditControllerDefs.redirecToSaveForm(res);
					}
				}
			}, JSON.stringify(payload), null, true);
			
		}, function(e) {  
			EditController._clearSketch();
		})		
		
		this.mode = 'none';
	},
	click: function(e) {
		if (EditController._isactive) {
			EditController.doMark(e.latlng);
        }     
	},
	removeTargetMarker: function(e) {
		if (this._targetMarker) {
			this._targetMarker.remove();
			this._targetMarker = null;
		}			
	},
	moveTargetMarker: function(p_location) {
		if (this._targetMarker) {
			this._targetMarker.setLatLng(p_location);
		}	
	}
}

var EditControllerRisco = {
	mode: 'none', // none create modify
	_isactive: false,
	_map: null,
	_sketchFeats: [],
	_maxSketchFeats: EditControllerDefs.maxSketchFeats,
	_tempMarkerOptions: EditControllerDefs.tempMarkerOptions,
	_currentEventSourceLeafletId: null,
	startingMovePoint: null,
	featInEdition: null,
	featInEditionMoved: false,
	currentUser: null,
	editAuthBool: false,
	setCurrentUser: EditControllerDefs.setCurrentUser,
	getCurrentUser: function() {
		return this.currentUser;
	},
	init: function() {
		this.featInEditionMoved = false;
	},
	_clearSketch: function() {
		for (var i=0; i<this._sketchFeats.length; i++) {
			this._sketchFeats[i].remove();
		}
		this._sketchFeats.splice(0,this._sketchFeats.length);		
	},
	setStartingMovePoint: function(p_location) {
		this.startingMovePoint = p_location;
	},
	clearStartingMovePoint: function() {
		this.startingMovePoint = null;
	},
	applyStartingMovePoint2FeatInEdition: function() {
		if (this.featInEdition != null && this.startingMovePoint != null) {
			this.featInEdition.setLatLng(this.startingMovePoint);
			this.moveTargetMarker(this.startingMovePoint);
			LF_setPointElementCoords(this.featInEdition, this.startingMovePoint);
		}
	},
	setFeatInEdition: function(p_feat) {
		this.featInEdition = p_feat;
	},
	getFeatInEdition: function() {
		return this.featInEdition;
	},
	setMap: function(p_map) {
		this._map = p_map;
	},
	activate: function(p_doactivate, p_silent) {
		EditController.mode = 'none';
		if (!this.editAuthBool) {
			if (!p_silent) {
				MessagesController.setMessage(MsgCtrl.getMsg(EditControllerDefs.userNotAuthenticatedMsg), "WARN");
			}
			return false;
		} else {
			this._isactive = p_doactivate;
			if (this._isactive) {
				// Activar edição
				EditController.init();
				L.DomUtil.addClass(this._map._container,'crosshair-cursor-enabled');
				DynLayerRenderer.setEnforceDiameters(false);
				DynLayerRenderer.refreshDynLayer();
				MessagesController.setMessage(MsgCtrl.getMsg(EditControllerDefs.enteringEditModeMsg), "INFO");
				// alterar aspecto da Feature em edição
				DynLayerRenderer.selMarkerChangeEditingState(true);
			} else {
				// Desactivar edição
				L.DomUtil.removeClass(this._map._container,'crosshair-cursor-enabled');
				this._clearSketch();
				DynLayerRenderer.selMarkerChangeEditingState(false);
				//DynLayerRenderer.setEnforceDiameters(true);
				DynLayerRenderer.refreshDynLayer();
				// remover a 'mira' de edição
				//this.removeTargetMarker();	
				
				conditionallyDoUpdate(this.featInEdition, this.featInEditionMoved);
			}
			return true;
		}
	},
	isActive: function() {
		return this._isactive;
	},
	preparePayload: function(p_location, p_gisid) {
		// e.latlng
		var feat = {
			"type": "Feature",
			"geometry": {
				"type": "Point",
				"coordinates": [p_location.lng, p_location.lat]
			}
		};
		return EditControllerDefs.payloadTemplate(feat, p_gisid);
	},
	doMove: function(p_location) {	

		if (typeof getFeatGISId == 'undefined') {
			// definido em setup.js ou init.js, para extrair o gis_id do objecto em edicao
			log('doMove saida A');
			return;
		}

		if (this.featInEdition == null) {
			// não existe objecto em edicao
			log('doMove saida B');
			return;
		}
		
		// mode funciona como semaphore uma vez que o leaflet desencandeia doMove e doMark,
		//   um deles primeiro
		if (this.isActive() && this.mode == 'none') {
			this.mode = 'modify';
		} else {
			return;
		}		
		
		//conditionallyDoUpdate(this.featInEdition);
		
		/*
		var gisid = getFeatGISId(this.featInEdition);		
		var payload = this.preparePayload(p_location, gisid);
		
		MessagesController.setMessage(MsgCtrl.getMsg(EditControllerDefs.confirmUpdateMsg), 'QUEST', function(e) {
			// Gravar alteração da posição da feature
			var res, url = EditControllerDefs.saveEndpoint;
			ajaxSender(url, function() {
				var res;
				if (this.readyState === this.DONE)
				{
					if (this.status == 200) {
						res = this.responseText;
						if (res != gisid) {
							// Aviso de alteração imprevista no GIS ID
							MessagesController.setMessage(MsgCtrl.getMsg(EditControllerDefs.updateError), 'WARN');
						}
						EditController.mode = 'none';
						EditController.clearStartingMovePoint();
						customMapRefresh();
					}
				}
			}, JSON.stringify(payload), null, true);
						
		}, function(e) {  
			// Repor feature no local inicial
			EditController.mode = 'none';
			EditController.applyStartingMovePoint2FeatInEdition();
			EditController.clearStartingMovePoint();
		})
		* */
	},
	doMark: function(p_location) {	

		// mode funciona como semaphore uma vez que o leaflet desencandeia ambos doMove e doMark,
		//   um deles primeiro

		if (this.isActive() && this.mode == 'none') {
			this.mode = 'create';
		} else {
			return;
		}

		if (this._sketchFeats.length >= this._maxSketchFeats) {
			for (var i=(this._maxSketchFeats-1); i<this._sketchFeats.length; i++) {
				this._sketchFeats[i].remove();
			}
			this._sketchFeats.splice(this._maxSketchFeats-1,(this._sketchFeats.length-this._maxSketchFeats)+1) 
		}

		var pylodobj = this.preparePayload(p_location, "");
		var feat = pylodobj['gjson'];
		var payload = pylodobj;

		(function (p_sketchfeats, p_feat, p_markeropts, p_map) {
			p_sketchfeats.push(L.geoJSON(p_feat, {
				pointToLayer: function (feature, latlng) {
					//console.log(p_markeropts);
					return L.circle(latlng, p_markeropts);
				}
			}).addTo(p_map));
		})(this._sketchFeats, feat, this._tempMarkerOptions, this._map);
		
		// Confirmação de que se pretende a gravação de novo ponto	
		MessagesController.setMessage(MsgCtrl.getMsg(EditControllerDefs.confirmInsertMsg), 'QUEST', function(e) {

			var res, url = EditControllerDefs.saveEndpoint;
			// Gravação do novo ponto
			ajaxSender(url, function() {
				if (this.readyState === this.DONE)
				{
					if (this.status == 200)
					{
						res = this.responseText;
						EditControllerDefs.redirecToSaveForm(res);
					}
				}
			}, JSON.stringify(payload), null, true);
			
		}, function(e) {  
			EditController._clearSketch();
		});	
		
		this.mode = 'none';
	},
	click: function(e) {
		if (EditController._isactive) {
			EditController.doMark(e.latlng);
        }     
	},
	removeTargetMarker: function(e) {
		if (this._targetMarker) {
			this._targetMarker.remove();
			this._targetMarker = null;
		}			
	},
	moveTargetMarker: function(p_location) {
		if (this._targetMarker) {
			this._targetMarker.setLatLng(p_location);
		}	
	}
}

