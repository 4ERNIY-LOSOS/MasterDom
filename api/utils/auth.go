package utils

import "os"

// GetJWTKey возвращает ключ для подписи JWT из переменной окружения.
func GetJWTKey() []byte {
	// В реальном приложении ключ должен быть более сложным и храниться безопасно.
	key := os.Getenv("JWT_SECRET")
	if key == "" {
		// Предоставляем значение по умолчанию для локальной разработки,
		// если переменная окружения не установлена.
		return []byte("my_super_secret_key_for_a_professional_project")
	}
	return []byte(key)
}