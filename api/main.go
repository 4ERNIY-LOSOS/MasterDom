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

// --- Структуры для данных ---

type RegisterPayload struct {
	Email     string `json:"email" binding:"required"`
	Password  string `json:"password" binding:"required"`
	FirstName string `json:"firstName" binding:"required"`
}

type LoginPayload struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type CreateJobPayload struct {
	Title       string   `json:"title" binding:"required"`
	Description *string  `json:"description"`
	LocationLat *float64 `json:"location_lat"`
	LocationLon *float64 `json:"location_lon"`
}

// User для выборки из БД
type User struct {
	ID           string
	Email        string
	PasswordHash string
	Role         string
}

// Claims для JWT токена
type Claims struct {
	UserID string `json:"userId"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// Job для данных из таблицы jobs
type Job struct {
	ID          int       `json:"id"`
	ClientID    string    `json:"client_id"`
	MasterID    *string   `json:"master_id"` // Указатель, так как может быть NULL
	Title       string    `json:"title"`
	Description *string   `json:"description"` // Указатель, так как может быть NULL
	Status      string    `json:"status"`
	LocationLat *float64  `json:"location_lat"` // Указатель, так как может быть NULL
	LocationLon *float64  `json:"location_lon"` // Указатель, так как может быть NULL
	CreatedAt   time.Time `json:"created_at"`
}

// В реальном приложении этот ключ должен храниться в переменных окружения, а не в коде!
var jwtKey = []byte("my_super_secret_key_for_kursach")

// AuthMiddleware для проверки JWT токена
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(401, gin.H{"error": "Authorization header is missing"})
			return
		}

		// Ожидаем формат "Bearer <token>"
		const bearerSchema = "Bearer "
		if len(authHeader) < len(bearerSchema) || authHeader[:len(bearerSchema)] != bearerSchema {
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid authorization header format"})
			return
		}
		tokenString := authHeader[len(bearerSchema):]

		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			// Убедимся, что метод подписи соответствует ожиданиям
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(401, gin.H{"error": "Invalid or expired token"})
			return
		}

		// Сохраняем информацию о пользователе в контексте для последующих обработчиков
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

	err = dbpool.Ping(context.Background())
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to ping database: %v\n", err)
		os.Exit(1)
	}
	log.Println("Successfully connected to the database")

	r := gin.Default()

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
	r.Use(cors.New(config))

	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})

		api.GET("/users/count", func(c *gin.Context) {
			var count int64
			err := dbpool.QueryRow(context.Background(), "SELECT COUNT(*) FROM users").Scan(&count)
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to query database", "details": err.Error()})
				return
			}
			c.JSON(200, gin.H{"user_count": count})
		})

		auth := api.Group("/auth")
		{
			auth.POST("/register", func(c *gin.Context) {
				var payload RegisterPayload
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

				var userID string
				err = tx.QueryRow(context.Background(),
					"INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'client') RETURNING id",
					payload.Email, string(hashedPassword)).Scan(&userID)
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to create user", "details": err.Error()})
					return
				}

				_, err = tx.Exec(context.Background(),
					"INSERT INTO client_profiles (user_id, first_name) VALUES ($1, $2)",
					userID, payload.FirstName)
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to create client profile", "details": err.Error()})
					return
				}

				err = tx.Commit(context.Background())
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to commit transaction"})
					return
				}

				c.JSON(201, gin.H{"message": "User created successfully", "userId": userID})
			})

			// Новый эндпоинт для входа
			auth.POST("/login", func(c *gin.Context) {
				var payload LoginPayload
				if err := c.ShouldBindJSON(&payload); err != nil {
					c.JSON(400, gin.H{"error": "Invalid input"})
					return
				}

				var user User
				err = dbpool.QueryRow(context.Background(),
					"SELECT id, email, password_hash, role FROM users WHERE email = $1",
					payload.Email).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Role)
				if err != nil {
					// В реальности, лучше не говорить, что именно не так: email или пароль
					c.JSON(401, gin.H{"error": "Invalid credentials"})
					return
				}

				err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(payload.Password))
				if err != nil {
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

				c.JSON(200, gin.H{"token": tokenString})
			})
		}

		// Защищенная группа, требующая аутентификации
		protected := api.Group("/")
		protected.Use(AuthMiddleware())
		{
			protected.GET("/jobs", func(c *gin.Context) {
				rows, err := dbpool.Query(context.Background(), "SELECT id, client_id, master_id, title, description, status, location_lat, location_lon, created_at FROM jobs ORDER BY created_at DESC")
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to query jobs", "details": err.Error()})
					return
				}
				defer rows.Close()

				jobs := make([]Job, 0)
				for rows.Next() {
					var job Job
					if err := rows.Scan(&job.ID, &job.ClientID, &job.MasterID, &job.Title, &job.Description, &job.Status, &job.LocationLat, &job.LocationLon, &job.CreatedAt); err != nil {
						c.JSON(500, gin.H{"error": "Failed to scan job row", "details": err.Error()})
						return
					}
					jobs = append(jobs, job)
				}

				if err := rows.Err(); err != nil {
					c.JSON(500, gin.H{"error": "Error iterating job rows", "details": err.Error()})
					return
				}

				c.JSON(200, jobs)
			})

			protected.POST("/jobs", func(c *gin.Context) {
				var payload CreateJobPayload
				if err := c.ShouldBindJSON(&payload); err != nil {
					c.JSON(400, gin.H{"error": "Invalid input", "details": err.Error()})
					return
				}

				userID, exists := c.Get("userID")
				if !exists {
					// Эта проверка избыточна, если AuthMiddleware всегда отрабатывает, но она полезна для надежности
					c.JSON(500, gin.H{"error": "User ID not found in context"})
					return
				}

				var newJobID int
				sql := `INSERT INTO jobs (client_id, title, description, status, location_lat, location_lon)
						VALUES ($1, $2, $3, 'open', $4, $5) RETURNING id`

				err = dbpool.QueryRow(context.Background(), sql, userID, payload.Title, payload.Description, payload.LocationLat, payload.LocationLon).Scan(&newJobID)
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to create job", "details": err.Error()})
					return
				}

				c.JSON(201, gin.H{"message": "Job created successfully", "jobID": newJobID})
			})
		}
	}

	r.Run(":8080")
}
