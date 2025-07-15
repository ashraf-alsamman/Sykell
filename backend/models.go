package main

import (
	"time"
)

// URL represents a website URL to be crawled
type URL struct {
	ID           int64     `json:"id" db:"id"`
	URL          string    `json:"url" db:"url"`
	Status       string    `json:"status" db:"status"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
	StartedAt    *time.Time `json:"started_at,omitempty" db:"started_at"`
	CompletedAt  *time.Time `json:"completed_at,omitempty" db:"completed_at"`
	ErrorMessage *string   `json:"error_message,omitempty" db:"error_message"`
}

// AnalysisResult represents the analysis results for a URL
type AnalysisResult struct {
	ID                 int64     `json:"id" db:"id"`
	URLID              int64     `json:"url_id" db:"url_id"`
	HTMLVersion        *string   `json:"html_version,omitempty" db:"html_version"`
	PageTitle          *string   `json:"page_title,omitempty" db:"page_title"`
	H1Count            int       `json:"h1_count" db:"h1_count"`
	H2Count            int       `json:"h2_count" db:"h2_count"`
	H3Count            int       `json:"h3_count" db:"h3_count"`
	H4Count            int       `json:"h4_count" db:"h4_count"`
	H5Count            int       `json:"h5_count" db:"h5_count"`
	H6Count            int       `json:"h6_count" db:"h6_count"`
	InternalLinksCount int       `json:"internal_links_count" db:"internal_links_count"`
	ExternalLinksCount int       `json:"external_links_count" db:"external_links_count"`
	BrokenLinksCount   int       `json:"broken_links_count" db:"broken_links_count"`
	HasLoginForm       bool      `json:"has_login_form" db:"has_login_form"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

// BrokenLink represents a broken link found during analysis
type BrokenLink struct {
	ID          int64     `json:"id" db:"id"`
	URLID       int64     `json:"url_id" db:"url_id"`
	LinkURL     string    `json:"link_url" db:"link_url"`
	StatusCode  *int      `json:"status_code,omitempty" db:"status_code"`
	ErrorMessage *string  `json:"error_message,omitempty" db:"error_message"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// User represents a system user
type User struct {
	ID           int64     `json:"id" db:"id"`
	Username     string    `json:"username" db:"username"`
	PasswordHash string    `json:"-" db:"password_hash"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// API Request/Response structures

// CreateURLRequest represents the request to create a new URL
type CreateURLRequest struct {
	URL string `json:"url" binding:"required"`
}

// UpdateStatusRequest represents the request to update URL status
type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

// BulkActionRequest represents bulk delete/rerun requests
type BulkActionRequest struct {
	IDs []int64 `json:"ids" binding:"required"`
}

// LoginRequest represents the login request
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// URLListResponse represents the paginated URL list response
type URLListResponse struct {
	URLs       []URL `json:"urls"`
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
	TotalPages int   `json:"total_pages"`
}

// AnalysisDetailResponse represents the detailed analysis response
type AnalysisDetailResponse struct {
	URL            URL            `json:"url"`
	Analysis       AnalysisResult `json:"analysis"`
	BrokenLinks    []BrokenLink   `json:"broken_links"`
	InternalLinks  []Link         `json:"internal_links"`
	ExternalLinks  []Link         `json:"external_links"`
}

// Link represents a link found during analysis
type Link struct {
	URL      string `json:"url"`
	Text     string `json:"text"`
	IsBroken bool   `json:"is_broken"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
} 