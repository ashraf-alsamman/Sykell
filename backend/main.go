package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize database
	db, err := initDatabase()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Initialize repositories
	urlRepo := NewURLRepository(db)
	analysisRepo := NewAnalysisRepository(db)
	userRepo := NewUserRepository(db)

	// Initialize services
	authService := NewAuthService(userRepo)
	crawlerService := NewCrawlerService(urlRepo, analysisRepo)
	
	// Start the crawler service
	crawlerService.Start()

	// Initialize handlers
	authHandler := NewAuthHandler(authService)
	urlHandler := NewURLHandler(urlRepo, crawlerService)
	analysisHandler := NewAnalysisHandler(analysisRepo, urlRepo)

	// Setup Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(corsMiddleware())

	// API routes
	api := r.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(authMiddleware(authService))
		{
			// URL management
			urls := protected.Group("/urls")
			{
				urls.GET("", urlHandler.GetURLs)
				urls.POST("", urlHandler.CreateURL)
				urls.PUT("/:id/status", urlHandler.UpdateStatus)
				urls.DELETE("/:id", urlHandler.DeleteURL)
				urls.POST("/bulk-delete", urlHandler.BulkDelete)
				urls.POST("/bulk-rerun", urlHandler.BulkRerun)
			}

			// Analysis routes
			analysis := protected.Group("/analysis")
			{
				analysis.GET("/:id", analysisHandler.GetAnalysis)
				analysis.GET("/:id/links", analysisHandler.GetBrokenLinks)
			}
		}
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
} 