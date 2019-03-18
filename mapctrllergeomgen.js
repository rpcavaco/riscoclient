
function generateRect(p_genobj, p_storedpart, p_cenx, p_ceny, p_pixsz) 
{
	var mx=[], mx2=[], mx3=[], mx4=[], rc = [], rv=[];

	if (p_genobj.dims == undefined) {
		throw new Error("Rectangle with no dims:"+oidkey);
	}

	m3.translation(p_cenx, p_ceny, mx)
	m3.scaling(p_pixsz, p_pixsz, mx2)	

	if (p_genobj.cc !== undefined && p_genobj.cc != null) {			
		hw = p_genobj.dims[0]/2.0;
		hh = p_genobj.dims[1]/2.0;
		rc = [p_genobj.cc[0] + (hw/2.0), p_genobj.cc[1] + (hh/2.0)];
	} else {			
		hw = p_genobj.dims[0];
		hh = p_genobj.dims[1];
		rc = [p_genobj.ll[0], p_genobj.ll[1]];
	}
	
	if (p_genobj.rot !== undefined && p_genobj.rot != null) 
	{
		m3.multiply(mx, mx2, mx3);	

		m3.translation(rc[0], rc[1], mx);			
		m3.multiply(mx3, mx, mx2);	
					
		m3.rotation(m3.degToRad(p_genobj.rot), mx);
		m3.multiply(mx2, mx, mx3);

		m3.translation(-rc[0], -rc[1], mx);			
		m3.multiply(mx3, mx, mx4);	
		
	} else {
		m3.multiply(mx, mx2, mx4);	
	}
	
	if (p_genobj.cc !== undefined && p_genobj.cc != null) 
	{						
		m3.vectorMultiply([p_genobj.cc[0] - hw, p_genobj.cc[1] - hh, 1], mx4, rv);			
		p_storedpart.push([rv[0],rv[1]]);	
		
		m3.vectorMultiply([p_genobj.cc[0] + hw, p_genobj.cc[1] - hh, 1], mx4, rv);			
		p_storedpart.push([rv[0],rv[1]]);	
	
		m3.vectorMultiply([p_genobj.cc[0] + hw, p_genobj.cc[1] + hh, 1], mx4, rv);			
		p_storedpart.push([rv[0],rv[1]]);	
		
		m3.vectorMultiply([p_genobj.cc[0] - hw, p_genobj.cc[1] + hh, 1], mx4, rv);			
		p_storedpart.push([rv[0],rv[1]]);	
		
		m3.vectorMultiply([p_genobj.cc[0] - hw, p_genobj.cc[1] - hh, 1], mx4, rv);			
		p_storedpart.push([rv[0],rv[1]]);				
	} 
	else if (p_genobj.ll !== undefined && p_genobj.ll != null) 
	{
		m3.vectorMultiply([p_genobj.ll[0], p_genobj.ll[1], 1], mx4, rv);			
		p_storedpart.push([rv[0],rv[1]]);	
		
		m3.vectorMultiply([p_genobj.ll[0] + hw, p_genobj.ll[1], 1], mx4, rv);			
		p_storedpart.push([rv[0],rv[1]]);	
	
		m3.vectorMultiply([p_genobj.ll[0] + hw, p_genobj.ll[1] + hh, 1], mx4, rv);			
		p_storedpart.push([rv[0],rv[1]]);	
		
		m3.vectorMultiply([p_genobj.ll[0], p_genobj.ll[1] + hh, 1], mx4, rv);			
		p_storedpart.push([rv[0],rv[1]]);	
		
		m3.vectorMultiply([p_genobj.ll[0], p_genobj.ll[1], 1], mx4, rv);			
		p_storedpart.push([rv[0],rv[1]]);				
		
	} else {
		throw new Error("Rectangle with no ref point (ll or cc):"+oidkey);
	}
	
}

function generateGeom(p_genobj, p_storedpart, p_cenx, p_ceny, p_pixsz) 
{
	if (p_genobj.type == 'rect') 
	{
		generateRect(p_genobj, p_storedpart, p_cenx, p_ceny, p_pixsz)
	}
}
