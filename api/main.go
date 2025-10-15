package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// --- Новые структуры для регистрации ---

type RegisterClientPayload struct {
	Email       string  `json:"email" binding:"required,email"`
	Password    string  `json:"password" binding:"required,min=8"`
	FirstName   string  `json:"firstName" binding:"required"`
	LastName    *string `json:"lastName"`
	PhoneNumber *string `json:"phoneNumber"`
}

type RegisterMasterPayload struct {
	Email             string  `json:"email" binding:"required,email"`
	Password          string  `json:"password" binding:"required,min=8"`
	FirstName         string  `json:"firstName" binding:"required"`
	LastName          *string `json:"lastName"`
	PhoneNumber       *string `json:"phoneNumber"`
	Bio               *string `json:"bio"`
	YearsOfExperience *int    `json:"yearsOfExperience"`
}

type LoginPayload struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// --- Структуры для работы с БД ---

type User struct {
	ID           string
	Email        string
	PasswordHash string
	Role         string
}

// Claims для JWT токена (остается без изменений)
type Claims struct {
	UserID string `json:"userId"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// Ключ для JWT (в реальном приложении - из env)
var jwtKey = []byte("my_super_secret_key_for_a_professional_project")

// AuthMiddleware (остается без изменений)
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(401, gin.H{"error": "Authorization header is missing"})
			return
		}
		const bearerSchema = "Bearer "
		if len(authHeader) < len(bearerSchema) || authHeader[:len(bearerSchema)] != bearerSchema {
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid authorization header format"})
			return
		}
		tokenString := authHeader[len(bearerSchema):]
		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return jwtKey, nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid or expired token"})
			return
		}
		c.Set("userID", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func main() {
	dbUrl := "postgres://user:password@db:5432/masterdom?sslmode=disable"

	dbpool, err := pgxpool.New(context.Background(), dbUrl)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to create connection pool: %v\n", err)
		os.Exit(1)
	}
	defer dbpool.Close()

	if err := dbpool.Ping(context.Background()); err != nil {
		log.Fatalf("Unable to ping database: %v\n", err)
	}
	log.Println("Successfully connected to the database")

	r := gin.Default()
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"} // Адрес фронтенда
	config.AllowMethods = []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})

		auth := api.Group("/auth")
		{
			// --- НОВЫЕ МАРШРУТЫ РЕГИСТРАЦИИ ---

			// Регистрация клиента
			auth.POST("/register/client", func(c *gin.Context) {
				var payload RegisterClientPayload
				if err := c.ShouldBindJSON(&payload); err != nil {
					c.JSON(400, gin.H{"error": "Invalid input", "details": err.Error()})
					return
				}

				hashedPassword, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to hash password"})
					return
				}

				tx, err := dbpool.Begin(context.Background())
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to begin transaction"})
					return
				}
				defer tx.Rollback(context.Background()) // Откат в случае ошибки

				// 1. Создаем запись в таблице users
				var userID string
				err = tx.QueryRow(context.Background(),
					"INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'client') RETURNING id",
					payload.Email, string(hashedPassword)).Scan(&userID)
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to create user", "details": err.Error()})
					return
				}

				// 2. Создаем запись в таблице client_profiles
				_, err = tx.Exec(context.Background(),
					"INSERT INTO client_profiles (user_id, first_name, last_name, phone_number) VALUES ($1, $2, $3, $4)",
					userID, payload.FirstName, payload.LastName, payload.PhoneNumber)
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to create client profile", "details": err.Error()})
					return
				}

				// Если все успешно, коммитим транзакцию
				if err := tx.Commit(context.Background()); err != nil {
					c.JSON(500, gin.H{"error": "Failed to commit transaction"})
					return
				}

				c.JSON(201, gin.H{"message": "Client registered successfully", "userId": userID})
			})

			// Регистрация мастера
			auth.POST("/register/master", func(c *gin.Context) {
				var payload RegisterMasterPayload
				if err := c.ShouldBindJSON(&payload); err != nil {
					c.JSON(400, gin.H{"error": "Invalid input", "details": err.Error()})
					return
				}

				hashedPassword, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to hash password"})
					return
				}

				tx, err := dbpool.Begin(context.Background())
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to begin transaction"})
					return
				}
				defer tx.Rollback(context.Background())

				// 1. Создаем запись в таблице users
				var userID string
				err = tx.QueryRow(context.Background(),
					"INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'master') RETURNING id",
					payload.Email, string(hashedPassword)).Scan(&userID)
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to create user", "details": err.Error()})
					return
				}

				// 2. Создаем запись в таблице master_profiles
				_, err = tx.Exec(context.Background(),
					`INSERT INTO master_profiles (user_id, first_name, last_name, phone_number, bio, years_of_experience)
					 VALUES ($1, $2, $3, $4, $5, $6)`,
					userID, payload.FirstName, payload.LastName, payload.PhoneNumber, payload.Bio, payload.YearsOfExperience)
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to create master profile", "details": err.Error()})
					return
				}

				if err := tx.Commit(context.Background()); err != nil {
					c.JSON(500, gin.H{"error": "Failed to commit transaction"})
					return
				}

				c.JSON(201, gin.H{"message": "Master registered successfully", "userId": userID})
			})

			// Эндпоинт для входа (логика не меняется, но теперь обслуживает обе роли)
			auth.POST("/login", func(c *gin.Context) {
				var payload LoginPayload
				if err := c.ShouldBindJSON(&payload); err != nil {
					c.JSON(400, gin.H{"error": "Invalid input"})
					return
				}

				var user User
				err := dbpool.QueryRow(context.Background(),
					"SELECT id, email, password_hash, role FROM users WHERE email = $1",
					payload.Email).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Role)
				if err != nil {
					c.JSON(401, gin.H{"error": "Invalid credentials"})
					return
				}

				if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(payload.Password)); err != nil {
					c.JSON(401, gin.H{"error": "Invalid credentials"})
					return
				}

				expirationTime := time.Now().Add(24 * time.Hour)
				claims := &Claims{
					UserID: user.ID,
					Role:   user.Role,
					RegisteredClaims: jwt.RegisteredClaims{
						ExpiresAt: jwt.NewNumericDate(expirationTime),
					},
				}

				token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
				tokenString, err := token.SignedString(jwtKey)
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to create token"})
					return
				}

				c.JSON(200, gin.H{"token": tokenString, "role": user.Role})
			})
		}

		// Защищенная группа (пока пустая, будет наполняться)
		protected := api.Group("/")
		protected.Use(AuthMiddleware())
		{
			// Сюда будем добавлять эндпоинты для работы с заявками, чатами и т.д.
		}
	}

	r.Run(":8080")
}
