package main

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// AuthService handles authentication logic
type AuthService struct {
	userRepo *UserRepository
	jwtSecret string
}

func NewAuthService(userRepo *UserRepository) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		jwtSecret: getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
	}
}

func (s *AuthService) Login(username, password string) (*LoginResponse, error) {
	user, err := s.userRepo.GetByUsername(username)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Generate JWT token
	token, err := s.generateToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &LoginResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *AuthService) ValidateToken(tokenString string) (*User, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		username := claims["username"].(string)
		return s.userRepo.GetByUsername(username)
	}

	return nil, fmt.Errorf("invalid token")
}

func (s *AuthService) generateToken(user *User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

// CrawlerService handles web crawling and analysis
type CrawlerService struct {
	urlRepo      *URLRepository
	analysisRepo *AnalysisRepository
	workerCount  int
	queue        chan *URL
	stopChan     chan bool
	wg           sync.WaitGroup
	running      bool
	mu           sync.Mutex
}

func NewCrawlerService(urlRepo *URLRepository, analysisRepo *AnalysisRepository) *CrawlerService {
	return &CrawlerService{
		urlRepo:      urlRepo,
		analysisRepo: analysisRepo,
		workerCount:  3,
		queue:        make(chan *URL, 100),
		stopChan:     make(chan bool),
	}
}

func (s *CrawlerService) Start() {
	s.mu.Lock()
	if s.running {
		s.mu.Unlock()
		return
	}
	s.running = true
	s.mu.Unlock()

	// Start workers
	for i := 0; i < s.workerCount; i++ {
		s.wg.Add(1)
		go s.worker()
	}

	// Start queue processor
	go s.processQueue()
}

func (s *CrawlerService) Stop() {
	s.mu.Lock()
	if !s.running {
		s.mu.Unlock()
		return
	}
	s.running = false
	s.mu.Unlock()

	close(s.stopChan)
	s.wg.Wait()
}

func (s *CrawlerService) processQueue() {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-s.stopChan:
			return
		case <-ticker.C:
			urls, err := s.urlRepo.GetQueuedURLs()
			if err != nil {
				log.Printf("Error getting queued URLs: %v", err)
				continue
			}

			for _, url := range urls {
				select {
				case s.queue <- &url:
				case <-s.stopChan:
					return
				default:
					// Queue is full, skip for now
					break
				}
			}
		}
	}
}

func (s *CrawlerService) worker() {
	defer s.wg.Done()

	for {
		select {
		case url := <-s.queue:
			s.processURL(url)
		case <-s.stopChan:
			return
		}
	}
}

func (s *CrawlerService) processURL(url *URL) {
	// Update status to running
	if err := s.urlRepo.UpdateStatus(url.ID, "running"); err != nil {
		log.Printf("Error updating status to running: %v", err)
		return
	}

	// Perform analysis
	analysis, err := s.analyzeURL(url.URL)
	if err != nil {
		errorMsg := err.Error()
		s.urlRepo.UpdateErrorMessage(url.ID, errorMsg)
		s.urlRepo.UpdateStatus(url.ID, "failed")
		return
	}

	// Save analysis results
	if err := s.analysisRepo.Create(url.ID, analysis); err != nil {
		log.Printf("Error saving analysis results: %v", err)
		s.urlRepo.UpdateStatus(url.ID, "failed")
		return
	}

	// Update status to completed
	s.urlRepo.UpdateStatus(url.ID, "completed")
}

func (s *CrawlerService) analyzeURL(urlStr string) (*AnalysisResult, error) {
	// Normalize URL
	if !strings.HasPrefix(urlStr, "http://") && !strings.HasPrefix(urlStr, "https://") {
		urlStr = "https://" + urlStr
	}

	// Create a custom HTTP client with browser-like headers
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Create request with browser-like headers
	req, err := http.NewRequest("GET", urlStr, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add browser-like headers to avoid being blocked
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")
	req.Header.Set("Accept-Encoding", "gzip, deflate")
	req.Header.Set("Connection", "keep-alive")
	req.Header.Set("Upgrade-Insecure-Requests", "1")

	// Fetch the page
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch URL: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d: %s", resp.StatusCode, resp.Status)
	}

	// Parse HTML
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %w", err)
	}

	analysis := &AnalysisResult{}

	// Get HTML version
	analysis.HTMLVersion = s.detectHTMLVersion(doc)

	// Get page title
	title := doc.Find("title").Text()
	if title != "" {
		analysis.PageTitle = &title
	}

	// Count headings
	analysis.H1Count = doc.Find("h1").Length()
	analysis.H2Count = doc.Find("h2").Length()
	analysis.H3Count = doc.Find("h3").Length()
	analysis.H4Count = doc.Find("h4").Length()
	analysis.H5Count = doc.Find("h5").Length()
	analysis.H6Count = doc.Find("h6").Length()

	// Analyze links
	baseURL, _ := url.Parse(urlStr)
	internalLinks, externalLinks, brokenLinks := s.analyzeLinks(doc, baseURL)

	analysis.InternalLinksCount = len(internalLinks)
	analysis.ExternalLinksCount = len(externalLinks)
	analysis.BrokenLinksCount = len(brokenLinks)

	// Check for login form
	analysis.HasLoginForm = s.detectLoginForm(doc)

	return analysis, nil
}

func (s *CrawlerService) detectHTMLVersion(doc *goquery.Document) *string {
	doctype := doc.Find("!DOCTYPE").Text()
	if doctype != "" {
		return &doctype
	}

	// Check for HTML5
	if doc.Find("html").Length() > 0 {
		version := "HTML5"
		return &version
	}

	// Default to HTML
	version := "HTML"
	return &version
}

func (s *CrawlerService) analyzeLinks(doc *goquery.Document, baseURL *url.URL) ([]string, []string, []string) {
	var internalLinks, externalLinks, brokenLinks []string

	doc.Find("a[href]").Each(func(i int, s *goquery.Selection) {
		href, exists := s.Attr("href")
		if !exists {
			return
		}

		// Parse the link URL
		linkURL, err := url.Parse(href)
		if err != nil {
			brokenLinks = append(brokenLinks, href)
			return
		}

		// Resolve relative URLs
		if !linkURL.IsAbs() {
			linkURL = baseURL.ResolveReference(linkURL)
		}

		// Check if it's internal or external
		if linkURL.Hostname() == baseURL.Hostname() {
			internalLinks = append(internalLinks, linkURL.String())
		} else {
			externalLinks = append(externalLinks, linkURL.String())
		}

		// Check if link is broken (simplified check)
		if resp, err := http.Head(linkURL.String()); err != nil || resp.StatusCode >= 400 {
			brokenLinks = append(brokenLinks, linkURL.String())
		}
	})

	return internalLinks, externalLinks, brokenLinks
}

func (s *CrawlerService) detectLoginForm(doc *goquery.Document) bool {
	// Check for common login form indicators
	selectors := []string{
		"form input[type='password']",
		"form input[name*='password']",
		"form input[name*='pass']",
		"form input[name*='login']",
		"form input[name*='user']",
		"form input[name*='email']",
	}

	for _, selector := range selectors {
		if doc.Find(selector).Length() > 0 {
			return true
		}
	}

	return false
}

func (s *CrawlerService) RerunAnalysis(urlID int64) error {
	_, err := s.urlRepo.GetByID(urlID)
	if err != nil {
		return fmt.Errorf("URL not found: %w", err)
	}

	// Reset status to queued
	if err := s.urlRepo.UpdateStatus(urlID, "queued"); err != nil {
		return fmt.Errorf("failed to reset status: %w", err)
	}

	return nil
} 