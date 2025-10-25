package store

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"masterdom/api/models"
)

type Store interface {
	CreateUser(ctx context.Context, payload models.RegisterPayload, hashedPassword string) (string, error)
	GetUserByEmail(ctx context.Context, email string) (*models.User, error)
	CreateOffer(ctx context.Context, userID string, payload models.CreateOfferPayload) (string, error)
	GetOffers(ctx context.Context, offerTypeFilter string, search string, categoryID string) ([]models.OfferResponse, error)
	GetAllUsers(ctx context.Context) ([]models.UserDetail, error)
	GetUserDetailByID(ctx context.Context, userID string) (*models.UserDetail, error)
	UpdateUserDetail(ctx context.Context, userID string, payload models.UpdateUserPayload) error
	DeleteUser(ctx context.Context, userID string) error
	IsUserAdmin(ctx context.Context, userID string) (bool, error)
	GetUserEmailByID(ctx context.Context, userID string) (string, error)
	GetAllOffersForAdmin(ctx context.Context) ([]models.AdminOfferResponse, error)
	UpdateOfferStatus(ctx context.Context, offerID string, payload models.UpdateOfferPayload) error
	DeleteOffer(ctx context.Context, offerID string) error
	GetAllCategories(ctx context.Context) ([]models.ServiceCategory, error)
	CreateCategory(ctx context.Context, payload models.CategoryPayload) (int, error)
	UpdateCategory(ctx context.Context, categoryID int, payload models.CategoryPayload) error
	DeleteCategory(ctx context.Context, categoryID int) error
	GetAdminStats(ctx context.Context) (*models.AdminStats, error)
}

type PostgresStore struct {
	dbpool *pgxpool.Pool
}

func NewPostgresStore(dbpool *pgxpool.Pool) *PostgresStore {
	return &PostgresStore{dbpool: dbpool}
}

func (s *PostgresStore) CreateUser(ctx context.Context, payload models.RegisterPayload, hashedPassword string) (string, error) {
	tx, err := s.dbpool.Begin(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var userID string
	err = tx.QueryRow(ctx,
		"INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'user') RETURNING id",
		payload.Email, hashedPassword).Scan(&userID)
	if err != nil {
		return "", fmt.Errorf("failed to create user: %w", err)
	}

	_, err = tx.Exec(ctx,
		"INSERT INTO user_details (user_id, first_name, last_name, phone_number) VALUES ($1, $2, $3, $4)",
		userID, payload.FirstName, payload.LastName, payload.PhoneNumber)
	if err != nil {
		return "", fmt.Errorf("failed to create user_details: %w", err)
	}

	return userID, tx.Commit(ctx)
}

func (s *PostgresStore) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := s.dbpool.QueryRow(ctx,
		"SELECT id, email, password_hash, role FROM users WHERE email = $1",
		email).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Role)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return &user, nil
}

func (s *PostgresStore) GetOffers(ctx context.Context, offerTypeFilter string, search string, categoryID string) ([]models.OfferResponse, error) {
	baseQuery := `SELECT o.id, o.title, o.description, o.offer_type, o.created_at, 
				   u.id as author_id, 
				   up.first_name as author_first_name
			FROM offers o
			JOIN users u ON o.author_id = u.id
			LEFT JOIN user_details up ON u.id = up.user_id
			WHERE o.is_active = true`

	args := []interface{}{}
	whereClauses := []string{}
	argCount := 1

	if offerTypeFilter != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("o.offer_type = $%d", argCount))
		args = append(args, offerTypeFilter)
		argCount++
	}

	if search != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("(LOWER(o.title) LIKE $%d OR LOWER(o.description) LIKE $%d)", argCount, argCount))
		args = append(args, "%"+strings.ToLower(search)+"%")
		argCount++
	}

	if categoryID != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("o.category_id = $%d", argCount))
		args = append(args, categoryID)
		argCount++
	}

	if len(whereClauses) > 0 {
		baseQuery += " AND " + strings.Join(whereClauses, " AND ")
	}

	baseQuery += " ORDER BY o.created_at DESC"

	rows, err := s.dbpool.Query(ctx, baseQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch offers: %w", err)
	}
	defer rows.Close()

	offers := make([]models.OfferResponse, 0)
	for rows.Next() {
		var offer models.OfferResponse
		if err := rows.Scan(&offer.ID, &offer.Title, &offer.Description, &offer.OfferType, &offer.CreatedAt, &offer.AuthorID, &offer.AuthorFirstName); err != nil {
			log.Printf("Error scanning offer row: %v", err)
			continue
		}
		offers = append(offers, offer)
	}
	return offers, nil
}

func (s *PostgresStore) IsUserAdmin(ctx context.Context, userID string) (bool, error) {
	var role string
	err := s.dbpool.QueryRow(ctx, "SELECT role FROM users WHERE id = $1", userID).Scan(&role)
	if err != nil {
		return false, nil
	}
	return role == "admin", nil
}

// ... Implementations for all other interface methods ...

func (s *PostgresStore) CreateOffer(ctx context.Context, userID string, payload models.CreateOfferPayload) (string, error) {
	var offerID string
	err := s.dbpool.QueryRow(ctx,
		`INSERT INTO offers (author_id, offer_type, title, description, category_id)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		userID, payload.OfferType, payload.Title, payload.Description, payload.CategoryID).Scan(&offerID)

	if err != nil {
		return "", fmt.Errorf("failed to create offer: %w", err)
	}
	return offerID, nil
}

func (s *PostgresStore) GetAllUsers(ctx context.Context) ([]models.UserDetail, error) {
	rows, err := s.dbpool.Query(ctx,
		`SELECT u.id, u.email, u.role, u.created_at, u.updated_at, 
				up.first_name, up.last_name, up.phone_number, up.bio, up.years_of_experience, up.average_rating
		 FROM users u
		 LEFT JOIN user_details up ON u.id = up.user_id
		 ORDER BY u.created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch all users: %w", err)
	}
	defer rows.Close()

	users := make([]models.UserDetail, 0)
	for rows.Next() {
		var user models.UserDetail
		if err := rows.Scan(
			&user.ID, &user.Email, &user.Role, &user.CreatedAt, &user.UpdatedAt,
			&user.FirstName, &user.LastName, &user.PhoneNumber, &user.Bio, &user.YearsOfExperience, &user.AverageRating);
			err != nil {
			return nil, fmt.Errorf("failed to scan user detail: %w", err)
		}
		users = append(users, user)
	}
	return users, nil
}

func (s *PostgresStore) GetUserDetailByID(ctx context.Context, userID string) (*models.UserDetail, error) {
	var user models.UserDetail
	err := s.dbpool.QueryRow(ctx,
		`SELECT u.id, u.email, u.role, u.created_at, u.updated_at, 
				up.first_name, up.last_name, up.phone_number, up.bio, up.years_of_experience, up.average_rating
		 FROM users u
		 LEFT JOIN user_details up ON u.id = up.user_id
		 WHERE u.id = $1`,
		userID).Scan(
		&user.ID, &user.Email, &user.Role, &user.CreatedAt, &user.UpdatedAt,
		&user.FirstName, &user.LastName, &user.PhoneNumber, &user.Bio, &user.YearsOfExperience, &user.AverageRating)

	if err != nil {
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}
	return &user, nil
}

func (s *PostgresStore) UpdateUserDetail(ctx context.Context, userID string, payload models.UpdateUserPayload) error {
	tx, err := s.dbpool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Handle role update in the 'users' table
	if payload.IsAdmin != nil {
		newRole := "user" // Default non-admin role
		if *payload.IsAdmin {
			newRole = "admin"
		}
		_, err := tx.Exec(ctx, "UPDATE users SET role = $1 WHERE id = $2", newRole, userID)
		if err != nil {
			return fmt.Errorf("failed to update user role: %w", err)
		}
	}

	// Handle profile updates in the 'user_details' table
	query := "UPDATE user_details SET updated_at = NOW()"
	args := []interface{}{}
	argCounter := 1

	if payload.FirstName != nil {
		query += fmt.Sprintf(", first_name = $%d", argCounter)
		args = append(args, *payload.FirstName)
		argCounter++
	}
	if payload.LastName != nil {
		query += fmt.Sprintf(", last_name = $%d", argCounter)
		args = append(args, *payload.LastName)
		argCounter++
	}
	if payload.PhoneNumber != nil {
		query += fmt.Sprintf(", phone_number = $%d", argCounter)
		args = append(args, *payload.PhoneNumber)
		argCounter++
	}
	if payload.Bio != nil {
		query += fmt.Sprintf(", bio = $%d", argCounter)
		args = append(args, *payload.Bio)
		argCounter++
	}
	if payload.YearsOfExperience != nil {
		query += fmt.Sprintf(", years_of_experience = $%d", argCounter)
		args = append(args, *payload.YearsOfExperience)
		argCounter++
	}

	// Only run the update if there are fields to update
	if argCounter > 1 {
		query += fmt.Sprintf(" WHERE user_id = $%d", argCounter)
		args = append(args, userID)

		_, err := tx.Exec(ctx, query, args...)
		if err != nil {
			return fmt.Errorf("failed to update user_details: %w", err)
		}
	}

	return tx.Commit(ctx)
}
func (s *PostgresStore) DeleteUser(ctx context.Context, userID string) error {
	_, err := s.dbpool.Exec(ctx, "DELETE FROM users WHERE id = $1", userID)
	return err
}

func (s *PostgresStore) GetUserEmailByID(ctx context.Context, userID string) (string, error) {
	var email string
	err := s.dbpool.QueryRow(ctx, "SELECT email FROM users WHERE id = $1", userID).Scan(&email)
	return email, err
}

func (s *PostgresStore) GetAllOffersForAdmin(ctx context.Context) ([]models.AdminOfferResponse, error) {
	rows, err := s.dbpool.Query(ctx,
		`SELECT o.id, o.title, o.description, o.offer_type, o.is_active, o.created_at, o.updated_at,
		        u.id as author_id, u.email as author_email,
		        up.first_name as author_first_name
		 FROM offers o
		 JOIN users u ON o.author_id = u.id
		 LEFT JOIN user_details up ON u.id = up.user_id
		 ORDER BY o.created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch all offers for admin: %w", err)
	}
	defer rows.Close()

	offers := make([]models.AdminOfferResponse, 0)
	for rows.Next() {
		var offer models.AdminOfferResponse
		if err := rows.Scan(
			&offer.ID, &offer.Title, &offer.Description, &offer.OfferType, &offer.IsActive,
			&offer.CreatedAt, &offer.UpdatedAt, &offer.AuthorID, &offer.AuthorEmail, &offer.AuthorFirstName);
			err != nil {
			return nil, fmt.Errorf("failed to scan admin offer: %w", err)
		}
		offers = append(offers, offer)
	}

	return offers, nil
}

func (s *PostgresStore) UpdateOfferStatus(ctx context.Context, offerID string, payload models.UpdateOfferPayload) error {
	if payload.IsActive == nil {
		return fmt.Errorf("is_active must be provided")
	}
	_, err := s.dbpool.Exec(ctx, "UPDATE offers SET is_active = $1, updated_at = NOW() WHERE id = $2", *payload.IsActive, offerID)
	return err
}

func (s *PostgresStore) DeleteOffer(ctx context.Context, offerID string) error {
	_, err := s.dbpool.Exec(ctx, "DELETE FROM offers WHERE id = $1", offerID)
	return err
}

func (s *PostgresStore) GetAllCategories(ctx context.Context) ([]models.ServiceCategory, error) {
	rows, err := s.dbpool.Query(ctx, "SELECT id, name, description FROM service_categories ORDER BY name")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch categories: %w", err)
	}
	defer rows.Close()

	categories := make([]models.ServiceCategory, 0)
	for rows.Next() {
		var cat models.ServiceCategory
		if err := rows.Scan(&cat.ID, &cat.Name, &cat.Description); err != nil {
			return nil, fmt.Errorf("failed to scan category: %w", err)
		}
		categories = append(categories, cat)
	}
	return categories, nil
}

func (s *PostgresStore) CreateCategory(ctx context.Context, payload models.CategoryPayload) (int, error) {
	var categoryID int
	err := s.dbpool.QueryRow(ctx, "INSERT INTO service_categories (name, description) VALUES ($1, $2) RETURNING id", payload.Name, payload.Description).Scan(&categoryID)
	return categoryID, err
}

func (s *PostgresStore) UpdateCategory(ctx context.Context, categoryID int, payload models.CategoryPayload) error {
	_, err := s.dbpool.Exec(ctx, "UPDATE service_categories SET name = $1, description = $2 WHERE id = $3", payload.Name, payload.Description, categoryID)
	return err
}

func (s *PostgresStore) DeleteCategory(ctx context.Context, categoryID int) error {
	_, err := s.dbpool.Exec(ctx, "DELETE FROM service_categories WHERE id = $1", categoryID)
	return err
}

func (s *PostgresStore) GetAdminStats(ctx context.Context) (*models.AdminStats, error) {
	var stats models.AdminStats
	err := s.dbpool.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM users),
			(SELECT COUNT(*) FROM offers),
			(SELECT COUNT(*) FROM jobs),
			(SELECT COUNT(*) FROM offers WHERE offer_type = 'request_for_service'),
			(SELECT COUNT(*) FROM offers WHERE offer_type = 'service_offer')
	`).Scan(
		&stats.TotalUsers,
		&stats.TotalOffers,
		&stats.TotalJobs,
		&stats.TotalServiceRequests,
		&stats.TotalServiceOffers,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get admin stats: %w", err)
	}
	return &stats, nil
}