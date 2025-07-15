package main

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	authService *AuthService
}

func NewAuthHandler(authService *AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid request format",
			Code:    http.StatusBadRequest,
		})
		return
	}

	response, err := h.authService.Login(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, ErrorResponse{
			Error:   "authentication_error",
			Message: "Invalid credentials",
			Code:    http.StatusUnauthorized,
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// URLHandler handles URL management endpoints
type URLHandler struct {
	urlRepo        *URLRepository
	crawlerService *CrawlerService
}

func NewURLHandler(urlRepo *URLRepository, crawlerService *CrawlerService) *URLHandler {
	return &URLHandler{
		urlRepo:        urlRepo,
		crawlerService: crawlerService,
	}
}

func (h *URLHandler) GetURLs(c *gin.Context) {
	// Get query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")
	search := c.Query("search")

	// Validate parameters
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	// Get URLs from repository
	response, err := h.urlRepo.GetAll(page, pageSize, status, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "database_error",
			Message: "Failed to retrieve URLs",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *URLHandler) CreateURL(c *gin.Context) {
	var req CreateURLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid request format",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Validate URL format
	if !strings.HasPrefix(req.URL, "http://") && !strings.HasPrefix(req.URL, "https://") {
		req.URL = "https://" + req.URL
	}

	// Create URL in database
	url, err := h.urlRepo.Create(req.URL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "database_error",
			Message: "Failed to create URL",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusCreated, url)
}

func (h *URLHandler) UpdateStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid URL ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid request format",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Validate status
	validStatuses := []string{"queued", "running", "completed", "failed"}
	valid := false
	for _, status := range validStatuses {
		if req.Status == status {
			valid = true
			break
		}
	}

	if !valid {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid status value",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Update status
	if err := h.urlRepo.UpdateStatus(id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "database_error",
			Message: "Failed to update status",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}

func (h *URLHandler) DeleteURL(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid URL ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.urlRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "database_error",
			Message: "Failed to delete URL",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "URL deleted successfully"})
}

func (h *URLHandler) BulkDelete(c *gin.Context) {
	var req BulkActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid request format",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.urlRepo.BulkDelete(req.IDs); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "database_error",
			Message: "Failed to delete URLs",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "URLs deleted successfully"})
}

func (h *URLHandler) BulkRerun(c *gin.Context) {
	var req BulkActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid request format",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Reset status for each URL to queued
	for _, id := range req.IDs {
		if err := h.urlRepo.UpdateStatus(id, "queued"); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error:   "database_error",
				Message: "Failed to reset URL status",
				Code:    http.StatusInternalServerError,
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Analysis queued for rerun"})
}

// AnalysisHandler handles analysis endpoints
type AnalysisHandler struct {
	analysisRepo *AnalysisRepository
	urlRepo      *URLRepository
}

func NewAnalysisHandler(analysisRepo *AnalysisRepository, urlRepo *URLRepository) *AnalysisHandler {
	return &AnalysisHandler{analysisRepo: analysisRepo, urlRepo: urlRepo}
}

func (h *AnalysisHandler) GetAnalysis(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid URL ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Get URL
	url, err := h.urlRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error:   "not_found",
			Message: "URL not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	// Get analysis
	analysis, err := h.analysisRepo.GetByURLID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{
			Error:   "not_found",
			Message: "Analysis not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	// Get broken links
	brokenLinks, err := h.analysisRepo.GetBrokenLinks(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "database_error",
			Message: "Failed to retrieve broken links",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	response := AnalysisDetailResponse{
		URL:         *url,
		Analysis:    *analysis,
		BrokenLinks: brokenLinks,
	}

	c.JSON(http.StatusOK, response)
}

func (h *AnalysisHandler) GetBrokenLinks(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{
			Error:   "validation_error",
			Message: "Invalid URL ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	brokenLinks, err := h.analysisRepo.GetBrokenLinks(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "database_error",
			Message: "Failed to retrieve broken links",
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"broken_links": brokenLinks})
} 