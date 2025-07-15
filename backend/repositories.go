package main

import (
	"database/sql"
	"fmt"
)

// URLRepository handles URL database operations
type URLRepository struct {
	db *sql.DB
}

func NewURLRepository(db *sql.DB) *URLRepository {
	return &URLRepository{db: db}
}

func (r *URLRepository) Create(url string) (*URL, error) {
	query := `INSERT INTO urls (url) VALUES (?)`
	result, err := r.db.Exec(query, url)
	if err != nil {
		return nil, fmt.Errorf("failed to create URL: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get last insert ID: %w", err)
	}

	return r.GetByID(id)
}

func (r *URLRepository) GetByID(id int64) (*URL, error) {
	query := `SELECT id, url, status, created_at, updated_at, started_at, completed_at, error_message 
			  FROM urls WHERE id = ?`
	
	var url URL
	err := r.db.QueryRow(query, id).Scan(
		&url.ID, &url.URL, &url.Status, &url.CreatedAt, &url.UpdatedAt,
		&url.StartedAt, &url.CompletedAt, &url.ErrorMessage,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get URL by ID: %w", err)
	}

	return &url, nil
}

func (r *URLRepository) GetAll(page, pageSize int, status, search string) (*URLListResponse, error) {
	offset := (page - 1) * pageSize
	
	// Build WHERE clause
	whereClause := "WHERE 1=1"
	args := []interface{}{}
	
	if status != "" {
		whereClause += " AND status = ?"
		args = append(args, status)
	}
	
	if search != "" {
		whereClause += " AND (url LIKE ? OR page_title LIKE ?)"
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm)
	}

	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM urls %s", whereClause)
	var total int64
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count URLs: %w", err)
	}

	// Get URLs
	query := fmt.Sprintf(`SELECT id, url, status, created_at, updated_at, started_at, completed_at, error_message 
						 FROM urls %s ORDER BY created_at DESC LIMIT ? OFFSET ?`, whereClause)
	args = append(args, pageSize, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get URLs: %w", err)
	}
	defer rows.Close()

	var urls []URL
	for rows.Next() {
		var url URL
		err := rows.Scan(
			&url.ID, &url.URL, &url.Status, &url.CreatedAt, &url.UpdatedAt,
			&url.StartedAt, &url.CompletedAt, &url.ErrorMessage,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan URL: %w", err)
		}
		urls = append(urls, url)
	}

	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))

	return &URLListResponse{
		URLs:       urls,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (r *URLRepository) UpdateStatus(id int64, status string) error {
	query := `UPDATE urls SET status = ?, updated_at = NOW()`
	
	if status == "running" {
		query += `, started_at = NOW()`
	} else if status == "completed" || status == "failed" {
		query += `, completed_at = NOW()`
	}
	
	query += ` WHERE id = ?`
	
	_, err := r.db.Exec(query, status, id)
	if err != nil {
		return fmt.Errorf("failed to update URL status: %w", err)
	}
	
	return nil
}

func (r *URLRepository) UpdateErrorMessage(id int64, errorMessage string) error {
	query := `UPDATE urls SET error_message = ?, updated_at = NOW() WHERE id = ?`
	_, err := r.db.Exec(query, errorMessage, id)
	if err != nil {
		return fmt.Errorf("failed to update error message: %w", err)
	}
	return nil
}

func (r *URLRepository) Delete(id int64) error {
	query := `DELETE FROM urls WHERE id = ?`
	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete URL: %w", err)
	}
	return nil
}

func (r *URLRepository) BulkDelete(ids []int64) error {
	query := `DELETE FROM urls WHERE id IN (`
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		if i > 0 {
			query += ","
		}
		query += "?"
		args[i] = id
	}
	query += ")"

	_, err := r.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("failed to bulk delete URLs: %w", err)
	}
	return nil
}

func (r *URLRepository) GetQueuedURLs() ([]URL, error) {
	query := `SELECT id, url, status, created_at, updated_at, started_at, completed_at, error_message 
			  FROM urls WHERE status = 'queued' ORDER BY created_at ASC`
	
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get queued URLs: %w", err)
	}
	defer rows.Close()

	var urls []URL
	for rows.Next() {
		var url URL
		err := rows.Scan(
			&url.ID, &url.URL, &url.Status, &url.CreatedAt, &url.UpdatedAt,
			&url.StartedAt, &url.CompletedAt, &url.ErrorMessage,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan URL: %w", err)
		}
		urls = append(urls, url)
	}

	return urls, nil
}

// AnalysisRepository handles analysis results database operations
type AnalysisRepository struct {
	db *sql.DB
}

func NewAnalysisRepository(db *sql.DB) *AnalysisRepository {
	return &AnalysisRepository{db: db}
}

func (r *AnalysisRepository) Create(urlID int64, analysis *AnalysisResult) error {
	query := `INSERT INTO analysis_results (url_id, html_version, page_title, h1_count, h2_count, h3_count, 
			  h4_count, h5_count, h6_count, internal_links_count, external_links_count, broken_links_count, has_login_form) 
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	
	_, err := r.db.Exec(query, urlID, analysis.HTMLVersion, analysis.PageTitle, analysis.H1Count,
		analysis.H2Count, analysis.H3Count, analysis.H4Count, analysis.H5Count, analysis.H6Count,
		analysis.InternalLinksCount, analysis.ExternalLinksCount, analysis.BrokenLinksCount, analysis.HasLoginForm)
	
	if err != nil {
		return fmt.Errorf("failed to create analysis result: %w", err)
	}
	
	return nil
}

func (r *AnalysisRepository) GetByURLID(urlID int64) (*AnalysisResult, error) {
	query := `SELECT id, url_id, html_version, page_title, h1_count, h2_count, h3_count, h4_count, h5_count, h6_count,
			  internal_links_count, external_links_count, broken_links_count, has_login_form, created_at, updated_at
			  FROM analysis_results WHERE url_id = ?`
	
	var analysis AnalysisResult
	err := r.db.QueryRow(query, urlID).Scan(
		&analysis.ID, &analysis.URLID, &analysis.HTMLVersion, &analysis.PageTitle,
		&analysis.H1Count, &analysis.H2Count, &analysis.H3Count, &analysis.H4Count,
		&analysis.H5Count, &analysis.H6Count, &analysis.InternalLinksCount,
		&analysis.ExternalLinksCount, &analysis.BrokenLinksCount, &analysis.HasLoginForm,
		&analysis.CreatedAt, &analysis.UpdatedAt,
	)
	
	if err != nil {
		return nil, fmt.Errorf("failed to get analysis result: %w", err)
	}
	
	return &analysis, nil
}

func (r *AnalysisRepository) AddBrokenLink(urlID int64, linkURL string, statusCode *int, errorMessage *string) error {
	query := `INSERT INTO broken_links (url_id, link_url, status_code, error_message) VALUES (?, ?, ?, ?)`
	_, err := r.db.Exec(query, urlID, linkURL, statusCode, errorMessage)
	if err != nil {
		return fmt.Errorf("failed to add broken link: %w", err)
	}
	return nil
}

func (r *AnalysisRepository) GetBrokenLinks(urlID int64) ([]BrokenLink, error) {
	query := `SELECT id, url_id, link_url, status_code, error_message, created_at 
			  FROM broken_links WHERE url_id = ? ORDER BY created_at DESC`
	
	rows, err := r.db.Query(query, urlID)
	if err != nil {
		return nil, fmt.Errorf("failed to get broken links: %w", err)
	}
	defer rows.Close()

	var links []BrokenLink
	for rows.Next() {
		var link BrokenLink
		err := rows.Scan(&link.ID, &link.URLID, &link.LinkURL, &link.StatusCode, &link.ErrorMessage, &link.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan broken link: %w", err)
		}
		links = append(links, link)
	}

	return links, nil
}

// UserRepository handles user database operations
type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) GetByUsername(username string) (*User, error) {
	query := `SELECT id, username, password_hash, created_at, updated_at FROM users WHERE username = ?`
	
	var user User
	err := r.db.QueryRow(query, username).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get user by username: %w", err)
	}
	
	return &user, nil
} 