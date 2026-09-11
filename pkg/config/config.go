package config

import (
	"encoding/json"
	"os"
)

type Settings struct {
	Version      string `json:"version"`
	RutaOrigen   string `json:"ruta_origen"`
	RutaDestino  string `json:"ruta_destino"`
	RutaRespaldo string `json:"ruta_respaldo"`
}

const SettingsFile = "settings.json"

func LoadSettings() Settings {
	defaults := Settings{
		Version:      "0.0",
		RutaOrigen:   `C:\Expedientes_Prueba`,
		RutaDestino:  `C:\Expedientes_Prueba`,
		RutaRespaldo: `C:\Users\LmartinezN\Documents\CAMBIOS_SISTEMA\RESPALDO`,
	}

	data, err := os.ReadFile(SettingsFile)
	if err != nil {
		return defaults
	}

	var loaded Settings
	if err := json.Unmarshal(data, &loaded); err != nil {
		return defaults
	}

	if loaded.RutaOrigen == "" {
		loaded.RutaOrigen = defaults.RutaOrigen
	}
	if loaded.RutaDestino == "" {
		loaded.RutaDestino = defaults.RutaDestino
	}
	if loaded.RutaRespaldo == "" {
		loaded.RutaRespaldo = defaults.RutaRespaldo
	}

	return loaded
}

func SaveSettings(s Settings) error {
	data, err := json.MarshalIndent(s, "", "    ")
	if err != nil {
		return err
	}
	return os.WriteFile(SettingsFile, data, 0644)
}
