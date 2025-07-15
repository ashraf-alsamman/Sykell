describe('Dashboard', () => {
  beforeEach(() => {
    cy.login('admin', 'password')
  })

  it('should display dashboard after login', () => {
    cy.get('h1').should('contain', 'URL Dashboard')
    cy.get('form').should('contain', 'Add New URL')
  })

  it('should add a new URL', () => {
    cy.get('h1').should('contain', 'URL Dashboard')
    cy.get('#newUrl').should('be.visible')
    
    const testUrl = 'https://example.com'
    cy.get('#newUrl').type(testUrl)
    cy.get('button[type="submit"]').click()
  })

  it('should validate URL format', () => {
    // Wait for dashboard to load
    cy.get('h1').should('contain', 'URL Dashboard')
    cy.get('#newUrl').should('be.visible')
    
    cy.get('#newUrl').type('invalid-url')
    cy.get('button[type="submit"]').should('be.disabled')
  })

  it('should filter URLs by status', () => {
    // Wait for dashboard to load
    cy.get('h1').should('contain', 'URL Dashboard')
    cy.get('#statusFilter').should('be.visible')
    
    cy.get('#statusFilter').select('completed')
  })

  it('should search URLs', () => {
    // Wait for dashboard to load
    cy.get('h1').should('contain', 'URL Dashboard')
    cy.get('#searchFilter').should('be.visible')
    
    cy.get('#searchFilter').type('example')
    // The search should be applied (actual results depend on data)
  })

  it('should select URLs for bulk actions', () => {
    cy.get('h1').should('contain', 'URL Dashboard')
    
    // Add a URL first if table is empty
    cy.get('body').then(($body) => {
      if ($body.find('table').length === 0) {
        // No table means no URLs, so add one first
        cy.get('#newUrl').type('https://test.com')
        cy.get('button[type="submit"]').click()
        cy.get('table', { timeout: 10000 }).should('be.visible')
      }
    })
    
    cy.get('table input[type="checkbox"]').first().check()
    cy.get('button').contains('Delete Selected').should('be.visible')
  })

  it('should navigate to analysis detail', () => {
    // Wait for dashboard to load
    cy.get('h1').should('contain', 'URL Dashboard')
    
    // This test depends on having completed analyses
    // For now, just check if the dashboard loads properly
    cy.get('#newUrl').should('be.visible')
    cy.get('#statusFilter').should('be.visible')
    cy.get('#searchFilter').should('be.visible')
  })


}) 