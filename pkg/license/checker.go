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
		"http://172.16.0.3/sistemacva/adminlyp/api_db.php",
		"http://lto7.ddns.net/sistemacva/adminlyp/api_db.php",
	}

	client := &http.Client{
		Timeout: 1200 * time.Millisecond,
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
						val := fmt.Sprintf("%v", apiResp.Data[0][0])
						if val == "1" {
							ch <- true
							return
						}
					}
				}
			}
			ch <- false
		}(targetURL)
	}

	// Esperar respuesta: si cualquiera devuelve true en paralelo, dar acceso inmediato
	responses := 0
	for responses < len(urls) {
		select {
		case res := <-ch:
			if res {
				return true
			}
			responses++
		case <-time.After(1500 * time.Millisecond):
			return false
		}
	}

	return false
}
