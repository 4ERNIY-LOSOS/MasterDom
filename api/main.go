package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"

	"masterdom/api/handlers"
	"masterdom/api/middleware"
	"masterdom/api/store"
)

func main() {
	dbUrl := "postgres://user:password@db:5432/masterdom?sslmode=disable"

	dbp, err := pgxpool.New(context.Background(), dbUrl)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Unable to create connection pool: %v\n", err)
		os.Exit(1)
	}
	defer dbp.Close()

	if err := dbp.Ping(context.Background()); err != nil {
		log.Fatalf("Unable to ping database: %v\n", err)
	}
	log.Println("Successfully connected to the database")

	appStore := store.NewPostgresStore(dbp)
	appHandlers := handlers.NewHandler(appStore)

	r := gin.Default()
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
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
			auth.POST("/register", appHandlers.Register)
			auth.POST("/login", appHandlers.Login)
		}

		api.GET("/offers", appHandlers.GetOffers)
		api.GET("/categories", appHandlers.GetAllCategories)

		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.GET("/profile", appHandlers.GetMyProfile)
			protected.PATCH("/profile", appHandlers.UpdateMyProfile)
			protected.POST("/offers", appHandlers.CreateOffer)

			admin := protected.Group("/admin")
			admin.Use(middleware.AdminAuthMiddleware())
			{
				admin.GET("/users", appHandlers.GetUsers)
				admin.GET("/users/:id", appHandlers.GetUserByID)
				admin.PATCH("/users/:id", appHandlers.UpdateUser)
				admin.DELETE("/users/:id", appHandlers.DeleteUser)

				admin.GET("/offers", appHandlers.GetAdminAllOffers)
				admin.PATCH("/offers/:id", appHandlers.UpdateOfferStatus)
				admin.DELETE("/offers/:id", appHandlers.DeleteOffer)

				admin.POST("/categories", appHandlers.CreateCategory)
				admin.PATCH("/categories/:id", appHandlers.UpdateCategory)
				admin.DELETE("/categories/:id", appHandlers.DeleteCategory)

				admin.GET("/stats", appHandlers.GetAdminStats)
			}
		}
	}

	r.Run(":8080")
}
