export namespace config {
	
	export class Settings {
	    version: string;
	    ruta_origen: string;
	    ruta_destino: string;
	    ruta_respaldo: string;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.ruta_origen = source["ruta_origen"];
	        this.ruta_destino = source["ruta_destino"];
	        this.ruta_respaldo = source["ruta_respaldo"];
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
	        this.errores = source["errores"];
	    }
	}

}

