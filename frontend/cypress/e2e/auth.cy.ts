describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should redirect to login when not authenticated', () => {
    cy.url().should('include', '/login')
  })

  it('should login with valid credentials', () => {
    cy.login('admin', 'password')
    cy.url().should('eq', Cypress.config().baseUrl + '/')
    cy.get('h1').should('contain', 'URL Dashboard')
    cy.get('span').should('contain', 'Welcome, admin!')
  })

  it('should logout successfully', () => {
    cy.login('admin', 'password')
    cy.logout()
    cy.url().should('include', '/login')
  })
}) 