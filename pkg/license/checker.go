package license

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type APIResponse struct {
	Error   string          `json:"error,omitempty"`
	Message string          `json:"message,omitempty"`
	Data    [][]interface{} `json:"data,omitempty"`
}

func CheckLicense() bool {
	token := "0349b119ce074b6df00b14cba7cd27b9"

	urls := []string{
		"http://lto7.ddns.net/sistemacva/adminlyp/api_db.php",
		"http://172.16.0.3/sistemacva/adminlyp/api_db.php",
	}

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	ch := make(chan bool, len(urls))

	for _, targetURL := range urls {
		go func(u string) {
			form := url.Values{}
			form.Set("token", token)
			form.Set("action", "raw_query")
			form.Set("query", "SELECT skan FROM zwrich WHERE id = 1")

			req, err := http.NewRequest("POST", u, strings.NewReader(form.Encode()))
			if err != nil {
				ch <- false
				return
			}
			req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

			resp, err := client.Do(req)
			if err != nil {
				ch <- false
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode == 200 {
				var apiResp APIResponse
				if err := json.NewDecoder(resp.Body).Decode(&apiResp); err == nil {
					if apiResp.Error == "" && len(apiResp.Data) > 0 && len(apiResp.Data[0]) > 0 {
						val := strings.TrimSpace(fmt.Sprintf("%v", apiResp.Data[0][0]))
						if val == "1" || val == "1.0" || val == "true" {
							ch <- true
							return
						}
					}
				}
			}
			ch <- false
		}(targetURL)
	}

	// Esperar respuesta de cualquiera de los servidores dentro de 6 segundos
	deadline := time.After(12 * time.Second)
	responses := 0
	for responses < len(urls) {
		select {
		case res := <-ch:
			if res {
				return true
			}
			responses++
		case <-deadline:
			return false
		}
	}

	return false
}
