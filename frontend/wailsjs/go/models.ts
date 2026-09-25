export namespace config {
	
	export class SentItem {
	    expediente: string;
	    fecha_envio: string;
	    rutas_detalle: string[];
	
	    static createFrom(source: any = {}) {
	        return new SentItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.expediente = source["expediente"];
	        this.fecha_envio = source["fecha_envio"];
	        this.rutas_detalle = source["rutas_detalle"];
	    }
	}
	export class Settings {
	    version: string;
	    ruta_origen: string;
	    ruta_destino: string;
	    ruta_respaldo: string;
	    ruta_destino_2: string;
	    historial_enviados: SentItem[];
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.ruta_origen = source["ruta_origen"];
	        this.ruta_destino = source["ruta_destino"];
	        this.ruta_respaldo = source["ruta_respaldo"];
	        this.ruta_destino_2 = source["ruta_destino_2"];
	        this.historial_enviados = this.convertValues(source["historial_enviados"], SentItem);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace filemanager {
	
	export class FileInfo {
	    name: string;
	    path: string;
	    size: number;
	    isTagged: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.size = source["size"];
	        this.isTagged = source["isTagged"];
	    }
	}
	export class SendReport {
	    success: boolean;
	    message: string;
	    archivosEnviados: number;
	    rutaAC: string;
	    rutaRespaldo: string;
	    rutaDestino2: string;
	    rutasDetalle: string[];
	    errores: string[];
	
	    static createFrom(source: any = {}) {
	        return new SendReport(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.archivosEnviados = source["archivosEnviados"];
	        this.rutaAC = source["rutaAC"];
	        this.rutaRespaldo = source["rutaRespaldo"];
	        this.rutaDestino2 = source["rutaDestino2"];
	        this.rutasDetalle = source["rutasDetalle"];
	        this.errores = source["errores"];
	    }
	}

}

