package filemanager

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
)

type ExpedienteData struct {
	Prefijo        string
	OV             string
	Materia        string
	Numero         string
	Anio           string
	NombreCarpeta  string
	NombreRespaldo string
	RangoNum       string
}

type SendReport struct {
	Success          bool     `json:"success"`
	Message          string   `json:"message"`
	ArchivosEnviados int      `json:"archivosEnviados"`
	RutaAC           string   `json:"rutaAC"`
	RutaRespaldo     string   `json:"rutaRespaldo"`
	RutaDestino2     string   `json:"rutaDestino2"`
	RutasDetalle     []string `json:"rutasDetalle"`
	Errores          []string `json:"errores"`
}

type FileInfo struct {
	Name     string `json:"name"`
	Path     string `json:"path"`
	Size     int64  `json:"size"`
	IsTagged bool   `json:"isTagged"`
}

func ValidarExpediente(expediente string) (*ExpedienteData, error) {
	partes := strings.Split(expediente, "/")
	for i := range partes {
		partes[i] = strings.TrimSpace(partes[i])
	}

	var prefijo, ov, materia, numero, anio string
	if len(partes) == 4 {
		prefijo = partes[0]
		materia = partes[1]
		numero = partes[2]
		anio = partes[3]
		ov = ""
	} else if len(partes) == 5 {
		prefijo = partes[0]
		ov = partes[1]
		materia = partes[2]
		numero = partes[3]
		anio = partes[4]
	} else {
		return nil, fmt.Errorf("El formato del expediente no es válido, ningún input del expediente puede ir vacío.")
	}

	if prefijo == "" || materia == "" || numero == "" || anio == "" {
		return nil, fmt.Errorf("El formato del expediente no es válido, ningún input del expediente puede ir vacío.")
	}

	if prefijo != "INVEACDMX" && prefijo != "INVEADF" {
		return nil, fmt.Errorf("Falta seleccionar un prefijo válido para el expediente (INVEACDMX / INVEADF).")
	}

	if len(partes) == 5 && ov != "OV" {
		return nil, fmt.Errorf("El formato del expediente debe incluir /OV/.")
	}

	if strings.HasPrefix(numero, "0") {
		return nil, fmt.Errorf("El número de expediente no puede iniciar con 0.")
	}

	numVal, err := strconv.Atoi(numero)
	if err != nil || numVal <= 0 {
		return nil, fmt.Errorf("El número de expediente debe contener únicamente dígitos mayores a 0.")
	}

	if len(anio) != 4 {
		return nil, fmt.Errorf("El año del expediente debe ser un año válido de 4 dígitos.")
	}

	// Calular Rango numérico 100 en 100
	inicio := ((numVal - 1) / 100) * 100 + 1
	fin := ((numVal-1)/100 + 1) * 100
	rangoStr := fmt.Sprintf("%04d-%04d", inicio, fin)

	// Formato de nombre de carpeta AC (con pad de 4 ceros)
	numPad := fmt.Sprintf("%04d", numVal)
	var nombreCarpetaAC string
	if materia == "IO" {
		nombreCarpetaAC = fmt.Sprintf("%s-IO-%s-%s", prefijo, numPad, anio)
	} else {
		if ov != "" {
			nombreCarpetaAC = fmt.Sprintf("%s-%s-%s-%s-%s", prefijo, ov, materia, numPad, anio)
		} else {
			nombreCarpetaAC = fmt.Sprintf("%s-%s-%s-%s", prefijo, materia, numPad, anio)
		}
	}

	// Formato de nombre de carpeta Respaldo (sin ceros a la izquierda)
	var nombreCarpetaResp string
	if materia == "IO" {
		nombreCarpetaResp = fmt.Sprintf("%s-IO-%s-%s", prefijo, numero, anio)
	} else {
		if ov != "" {
			nombreCarpetaResp = fmt.Sprintf("%s-%s-%s-%s-%s", prefijo, ov, materia, numero, anio)
		} else {
			nombreCarpetaResp = fmt.Sprintf("%s-%s-%s-%s", prefijo, materia, numero, anio)
		}
	}

	return &ExpedienteData{
		Prefijo:        prefijo,
		OV:             ov,
		Materia:        materia,
		Numero:         numero,
		Anio:           anio,
		NombreCarpeta:  nombreCarpetaAC,
		NombreRespaldo: nombreCarpetaResp,
		RangoNum:       rangoStr,
	}, nil
}

func ObtenerRutaAC(exp *ExpedienteData, acBasePath string) (string, error) {
	var carpetaMateria, carpetaRango string
	if exp.Materia == "IO" {
		carpetaMateria = "INSPECCIONES OCULARES"
		carpetaRango = fmt.Sprintf("%s-IO-%s", exp.Prefijo, exp.RangoNum)
	} else if exp.Materia == "MP" {
		carpetaMateria = "MEDIOS PUBLICITARIOS"
		carpetaRango = fmt.Sprintf("%s-%s-%s-%s", exp.Prefijo, exp.OV, exp.Materia, exp.RangoNum)
	} else {
		carpetaMateria = exp.Materia
		if exp.OV != "" {
			carpetaRango = fmt.Sprintf("%s-%s-%s-%s", exp.Prefijo, exp.OV, exp.Materia, exp.RangoNum)
		} else {
			carpetaRango = fmt.Sprintf("%s-%s-%s", exp.Prefijo, exp.Materia, exp.RangoNum)
		}
	}

	rutaExpediente := filepath.Join(acBasePath, exp.Anio, carpetaMateria, carpetaRango, exp.NombreCarpeta)
	if err := os.MkdirAll(rutaExpediente, 0755); err != nil {
		return "", err
	}
	return rutaExpediente, nil
}

func ObtenerRutaRespaldoCalendario(exp *ExpedienteData, respaldoBasePath string, t time.Time) (string, error) {
	yearStr := strconv.Itoa(t.Year())

	meses := []string{
		"ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
		"JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
	}
	mesNombre := meses[int(t.Month())-1]

	// Calcular rangos de semana (Lunes a Domingo) del mes
	firstDay := time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, t.Location())
	lastDay := firstDay.AddDate(0, 1, -1)
	numDias := lastDay.Day()

	type semanaRango struct {
		inicio int
		fin    int
	}
	var semanas []semanaRango

	diaActual := 1
	for diaActual <= numDias {
		dt := time.Date(t.Year(), t.Month(), diaActual, 0, 0, 0, 0, t.Location())
		// Go Weekday: 0=Sunday, 1=Monday, ..., 6=Saturday
		wd := int(dt.Weekday())
		// Convertir a 0=Monday, 6=Sunday
		wdMon := (wd + 6) % 7
		diasHastaDomingo := 6 - wdMon
		finSemana := diaActual + diasHastaDomingo
		if finSemana > numDias {
			finSemana = numDias
		}
		semanas = append(semanas, semanaRango{inicio: diaActual, fin: finSemana})
		diaActual = finSemana + 1
	}

	semInicio, semFin := semanas[0].inicio, semanas[0].fin
	for _, s := range semanas {
		if t.Day() >= s.inicio && t.Day() <= s.fin {
			semInicio, semFin = s.inicio, s.fin
			break
		}
	}

	semanaStr := fmt.Sprintf("SEMANA DEL %d AL %d DE %s", semInicio, semFin, mesNombre)

	diasSemana := []string{"DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"}
	diaNombre := diasSemana[int(t.Weekday())]
	diaStr := fmt.Sprintf("%s %d DE %s", diaNombre, t.Day(), mesNombre)

	rutaCompleta := filepath.Join(respaldoBasePath, yearStr, mesNombre, semanaStr, diaStr, exp.NombreRespaldo)
	if err := os.MkdirAll(rutaCompleta, 0755); err != nil {
		return "", err
	}
	return rutaCompleta, nil
}

func EnviarArchivosMultiple(expediente string, pdfPaths []string, acBasePath string, respaldoBasePath string, destino2BasePath string) (*SendReport, error) {
	expData, err := ValidarExpediente(expediente)
	if err != nil {
		return &SendReport{Success: false, Message: err.Error()}, err
	}

	if len(pdfPaths) == 0 {
		return &SendReport{Success: false, Message: "No se seleccionaron archivos para enviar."}, nil
	}

	// Validar etiquetado (YYYY-MM-DD-...)
	patron := regexp.MustCompile(`(?i)^\d{4}-\d{2}-\d{2}[-].+\.pdf$`)
	for _, p := range pdfPaths {
		baseName := filepath.Base(p)
		if !patron.MatchString(baseName) {
			return &SendReport{Success: false, Message: "Uno o más archivos seleccionados no han sido etiquetados/renombrados."}, nil
		}
	}

	// 1. Ruta AC (Obligatoria)
	var rutaAC string
	if acBasePath != "" {
		r, err := ObtenerRutaAC(expData, acBasePath)
		if err != nil {
			return &SendReport{Success: false, Message: fmt.Sprintf("Error al crear ruta en AC: %v", err)}, err
		}
		rutaAC = r
	} else {
		return &SendReport{Success: false, Message: "Falta seleccionar la ruta obligatoria de AC."}, fmt.Errorf("Falta seleccionar ruta AC")
	}

	// 2. Ruta Respaldo (Opcional)
	var rutaResp string
	if respaldoBasePath != "" {
		if _, err := os.Stat(respaldoBasePath); err == nil {
			r, err := ObtenerRutaRespaldoCalendario(expData, respaldoBasePath, time.Now())
			if err == nil {
				rutaResp = r
			}
		}
	}

	// 3. Ruta Destino 2 (Opcional, crea o reutiliza la subcarpeta con el expediente completo)
	var rutaDest2 string
	if destino2BasePath != "" {
		if _, err := os.Stat(destino2BasePath); err == nil {
			targetSubdir := filepath.Join(destino2BasePath, expData.NombreCarpeta)
			if err := os.MkdirAll(targetSubdir, 0755); err == nil {
				rutaDest2 = targetSubdir
			}
		}
	}

	archivosEnviados := 0
	var errores []string

	for _, p := range pdfPaths {
		if _, err := os.Stat(p); os.IsNotExist(err) {
			errores = append(errores, fmt.Sprintf("El archivo no existe: %s", filepath.Base(p)))
			continue
		}

		baseName := filepath.Base(p)
		failCopy := false

		// Copia 1: A Respaldo (Si está activo)
		if rutaResp != "" {
			targetResp := filepath.Join(rutaResp, baseName)
			targetResp = evitarColision(targetResp)
			if err := copiarArchivo(p, targetResp); err != nil {
				errores = append(errores, fmt.Sprintf("Error al copiar a Respaldo (%s): %v", baseName, err))
				failCopy = true
			}
		}

		// Copia 2: A Destino 2 (Si está activo)
		if rutaDest2 != "" {
			targetD2 := filepath.Join(rutaDest2, baseName)
			targetD2 = evitarColision(targetD2)
			if err := copiarArchivo(p, targetD2); err != nil {
				errores = append(errores, fmt.Sprintf("Error al copiar a Destino 2 (%s): %v", baseName, err))
				failCopy = true
			}
		}

		// Si falló el copiado en alguna de las rutas secundarias, NO MOVER para no perder el archivo de origen
		if failCopy {
			errores = append(errores, fmt.Sprintf("Se conservó el archivo %s en origen para evitar pérdidas.", baseName))
			continue
		}

		// Traslado final: MOVER a AC (vacía la carpeta origen)
		targetAC := filepath.Join(rutaAC, baseName)
		targetAC = evitarColision(targetAC)
		if err := moverArchivo(p, targetAC); err != nil {
			errores = append(errores, fmt.Sprintf("Error al mover a AC (%s): %v", baseName, err))
			continue
		}

		archivosEnviados++
	}

	// Detalle de rutas seleccionadas para evidencia
	var rutasDetalle []string
	if rutaAC != "" {
		rutasDetalle = append(rutasDetalle, fmt.Sprintf("AC: %s", rutaAC))
	}
	if rutaResp != "" {
		rutasDetalle = append(rutasDetalle, fmt.Sprintf("Respaldo: %s", rutaResp))
	}
	if rutaDest2 != "" {
		rutasDetalle = append(rutasDetalle, fmt.Sprintf("Destino 2: %s", rutaDest2))
	}

	var lineasReporte []string
	if len(rutasDetalle) == 1 {
		lineasReporte = append(lineasReporte, fmt.Sprintf("Se enviaron (%d) archivo(s) a 1 ruta:", archivosEnviados))
	} else {
		lineasReporte = append(lineasReporte, fmt.Sprintf("Se enviaron (%d) archivo(s) a %d rutas:", archivosEnviados, len(rutasDetalle)))
	}

	for _, r := range rutasDetalle {
		lineasReporte = append(lineasReporte, fmt.Sprintf("• %s", r))
	}

	msg := strings.Join(lineasReporte, "\n")

	return &SendReport{
		Success:          archivosEnviados > 0,
		Message:          msg,
		ArchivosEnviados: archivosEnviados,
		RutaAC:           rutaAC,
		RutaRespaldo:     rutaResp,
		RutaDestino2:     rutaDest2,
		RutasDetalle:     rutasDetalle,
		Errores:          errores,
	}, nil
}

func EnviarArchivosDoble(expediente string, pdfPaths []string, acBasePath string, respaldoBasePath string) (*SendReport, error) {
	return EnviarArchivosMultiple(expediente, pdfPaths, acBasePath, respaldoBasePath, "")
}

func ListPDFs(folderPath string) ([]FileInfo, error) {
	entries, err := os.ReadDir(folderPath)
	if err != nil {
		return nil, err
	}

	patron := regexp.MustCompile(`(?i)^\d{4}-\d{2}-\d{2}[-].+\.pdf$`)
	var list []FileInfo

	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(strings.ToLower(entry.Name()), ".pdf") {
			fullPath := filepath.Join(folderPath, entry.Name())
			info, _ := entry.Info()
			var size int64 = 0
			if info != nil {
				size = info.Size()
			}
			list = append(list, FileInfo{
				Name:     entry.Name(),
				Path:     fullPath,
				Size:     size,
				IsTagged: patron.MatchString(entry.Name()),
			})
		}
	}

	sort.Slice(list, func(i, j int) bool {
		return strings.ToLower(list[i].Name) < strings.ToLower(list[j].Name)
	})

	return list, nil
}

func evitarColision(targetPath string) string {
	if _, err := os.Stat(targetPath); os.IsNotExist(err) {
		return targetPath
	}

	dir := filepath.Dir(targetPath)
	ext := filepath.Ext(targetPath)
	base := strings.TrimSuffix(filepath.Base(targetPath), ext)

	c := 1
	for {
		newPath := filepath.Join(dir, fmt.Sprintf("%s_%d%s", base, c, ext))
		if _, err := os.Stat(newPath); os.IsNotExist(err) {
			return newPath
		}
		c++
	}
}

func copiarArchivo(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	return err
}

func moverArchivo(src, dst string) error {
	err := os.Rename(src, dst)
	if err == nil {
		return nil
	}
	// Fallback si src y dst están en distintos volúmenes
	if err := copiarArchivo(src, dst); err != nil {
		return err
	}
	return os.Remove(src)
}
