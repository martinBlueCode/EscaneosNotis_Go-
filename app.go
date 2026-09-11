package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"

	"EscaneosNotis_Go/pkg/config"
	"EscaneosNotis_Go/pkg/filemanager"
	"EscaneosNotis_Go/pkg/license"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx      context.Context
	settings config.Settings
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.settings = config.LoadSettings()
}

func (a *App) CheckLicense() bool {
	return license.CheckLicense()
}

func (a *App) VerificarLicencia() bool {
	return a.CheckLicense()
}

func (a *App) GetSettings() config.Settings {
	return a.settings
}

func (a *App) CargarConfiguracion() config.Settings {
	return a.GetSettings()
}

func (a *App) SaveSettings(s config.Settings) error {
	a.settings = s
	return config.SaveSettings(s)
}

func (a *App) GuardarConfiguracion(s config.Settings) error {
	return a.SaveSettings(s)
}

func (a *App) SelectFolder(title string) (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: title,
	})
}

func (a *App) SeleccionarCarpeta(title string) (string, error) {
	return a.SelectFolder(title)
}

func (a *App) ListPDFs(folderPath string) ([]filemanager.FileInfo, error) {
	if folderPath == "" {
		return []filemanager.FileInfo{}, nil
	}
	return filemanager.ListPDFs(folderPath)
}

func (a *App) ListarArchivosPDF(folderPath string) ([]filemanager.FileInfo, error) {
	return a.ListPDFs(folderPath)
}

func (a *App) RenameFile(oldPath string, newName string) (string, error) {
	if _, err := os.Stat(oldPath); os.IsNotExist(err) {
		return "", fmt.Errorf("El archivo no existe.")
	}

	dir := filepath.Dir(oldPath)
	ext := filepath.Ext(oldPath)
	cleanName := fmt.Sprintf("%s%s", newName, ext)
	newPath := filepath.Join(dir, cleanName)

	if oldPath == newPath {
		return newPath, nil
	}

	if _, err := os.Stat(newPath); err == nil {
		return "", fmt.Errorf("Ya existe un archivo con el nombre %s.", cleanName)
	}

	if err := os.Rename(oldPath, newPath); err != nil {
		return "", err
	}
	return newPath, nil
}

func (a *App) DeleteFile(filePath string) error {
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return fmt.Errorf("El archivo no existe.")
	}
	return os.Remove(filePath)
}

func (a *App) SendFiles(expediente string, pdfPaths []string) (*filemanager.SendReport, error) {
	return filemanager.EnviarArchivosDoble(
		expediente,
		pdfPaths,
		a.settings.RutaDestino,
		a.settings.RutaRespaldo,
	)
}

func (a *App) EnviarEscaneos(expediente string, pdfPaths []string) (*filemanager.SendReport, error) {
	return a.SendFiles(expediente, pdfPaths)
}

func (a *App) ReadPDFBase64(pdfPath string) (string, error) {
	data, err := os.ReadFile(pdfPath)
	if err != nil {
		return "", err
	}
	encoded := base64.StdEncoding.EncodeToString(data)
	return fmt.Sprintf("data:application/pdf;base64,%s", encoded), nil
}

func (a *App) ObtenerContenidoPDF(pdfPath string) (string, error) {
	return a.ReadPDFBase64(pdfPath)
}
